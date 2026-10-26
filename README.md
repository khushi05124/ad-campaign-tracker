# Ad Campaign Tracker 📊

A full-stack web application for tracking and analyzing advertising campaign performance across Google, Facebook, and Amazon.

## Features

- Interactive campaign analytics dashboard
- Filter campaigns by advertising platform and date range
- Total spend, impressions, clicks, and conversions
- CTR, CPC, and CPA calculations
- Spend-by-campaign bar chart
- Clicks-by-campaign bar chart
- Campaign performance table
- Clear no-data messages for empty date ranges

## Tech Stack

- Frontend: React, Vite, Recharts, Lucide React, CSS
- Backend: Python, Flask, Flask-CORS
- Database: MySQL

## Project Structure

```text
ad-campaign-tracker/
├── backend/
│   └── app.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## Dashboard Metrics

- CTR = Clicks / Impressions × 100
- CPC = Spend / Clicks
- CPA = Spend / Conversions

The application handles zero denominators to avoid invalid metric values.

## Setup Instructions

### 1. Database

Start MySQL and create the `ad_tracker` database with the required `campaigns` and `daily_performance` tables. Add campaign performance records to populate the dashboard.

Configure your database credentials in the backend `.env` file. Never upload this file to GitHub.

### 2. Backend

Open a terminal in the backend folder and install dependencies:

```bash
pip install flask flask-cors mysql-connector-python python-dotenv
```

Start the backend:

```bash
python app.py
```

API URL: http://127.0.0.1:5000

### 3. Frontend

Open another terminal in the frontend folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## API Endpoint

GET /api/campaigns

Optional query parameters:
- platform
- start_date
- end_date

Example:

http://127.0.0.1:5000/api/campaigns?start_date=2026-10-20&end_date=2026-10-21

## Testing

Tested platform filtering, date filtering, campaign metrics, both charts, and the no-data message for date ranges without matching performance records.

## Future Improvements

- Export campaign reports to CSV
- Add campaign creation and editing
- Add user authentication
- Deploy the application online

---

Built using React, Flask, and MySQL.
