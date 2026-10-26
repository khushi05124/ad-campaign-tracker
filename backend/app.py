
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "ad_tracker")
    )


@app.route("/")
def home():
    return jsonify({"message": "Ad Campaign Tracker API is running"})


@app.route("/api/campaigns")
def get_campaigns():
    platform = request.args.get("platform", "All")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        conditions = []
        params = []

        if platform and platform != "All":
            conditions.append("c.platform = %s")
            params.append(platform)

        if start_date:
            conditions.append("dp.performance_date >= %s")
            params.append(start_date)

        if end_date:
            conditions.append("dp.performance_date <= %s")
            params.append(end_date)

        where_clause = (
            "WHERE " + " AND ".join(conditions)
            if conditions else ""
        )

        query = f"""
            SELECT
                c.campaign_id,
                c.campaign_name,
                c.platform,
                COALESCE(SUM(dp.impressions), 0) AS impressions,
                COALESCE(SUM(dp.clicks), 0) AS clicks,
                COALESCE(SUM(dp.spend), 0) AS spend,
                COALESCE(SUM(dp.conversions), 0) AS conversions,
                CASE
                    WHEN COALESCE(SUM(dp.impressions), 0) > 0
                    THEN SUM(dp.clicks) * 100.0
                         / SUM(dp.impressions)
                    ELSE 0
                END AS ctr,
                CASE
                    WHEN COALESCE(SUM(dp.clicks), 0) > 0
                    THEN SUM(dp.spend) / SUM(dp.clicks)
                    ELSE 0
                END AS cpc,
                CASE
                    WHEN COALESCE(SUM(dp.conversions), 0) > 0
                    THEN SUM(dp.spend) / SUM(dp.conversions)
                    ELSE 0
                END AS cpa
            FROM campaigns c
            LEFT JOIN daily_performance dp
                ON c.campaign_id = dp.campaign_id
            {where_clause}
            GROUP BY
                c.campaign_id,
                c.campaign_name,
                c.platform
            ORDER BY spend DESC
        """

        cursor.execute(query, params)
        campaigns = cursor.fetchall()

        for campaign in campaigns:
            for key, value in campaign.items():
                if value is not None and key in (
                    "spend", "ctr", "cpc", "cpa"
                ):
                    campaign[key] = float(value)

        return jsonify(campaigns)

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
