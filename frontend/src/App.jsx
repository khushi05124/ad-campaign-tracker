
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  BarChart3,
  MousePointerClick,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/api/campaigns";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const getCTR = (campaign) => {
  if (campaign.ctr !== undefined && campaign.ctr !== null) {
    return Number(campaign.ctr) || 0;
  }

  const impressions = Number(campaign.impressions) || 0;
  const clicks = Number(campaign.clicks) || 0;

  return impressions ? (clicks / impressions) * 100 : 0;
};

const getCPC = (campaign) => {
  if (campaign.cpc !== undefined && campaign.cpc !== null) {
    return Number(campaign.cpc) || 0;
  }

  const clicks = Number(campaign.clicks) || 0;
  return clicks ? (Number(campaign.spend) || 0) / clicks : 0;
};

const getCPA = (campaign) => {
  if (campaign.cpa !== undefined && campaign.cpa !== null) {
    return Number(campaign.cpa) || 0;
  }

  const conversions = Number(campaign.conversions) || 0;
  return conversions
    ? (Number(campaign.spend) || 0) / conversions
    : 0;
};

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [platform, setPlatform] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("campaign_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const invalidDates = Boolean(
    startDate && endDate && startDate > endDate
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCampaigns() {
      if (invalidDates) {
        setCampaigns([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (platform !== "All") params.set("platform", platform);
        if (startDate) params.set("start_date", startDate);
        if (endDate) params.set("end_date", endDate);

        const response = await fetch(
          `${API_URL}?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`API request failed (${response.status})`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The API returned an unexpected response.");
        }

        setCampaigns(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load campaign data.");
          setCampaigns([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCampaigns();

    return () => controller.abort();
  }, [platform, startDate, endDate, invalidDates]);

  // Search campaigns by name or platform.
  const filteredCampaigns = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      return (
        !query ||
        String(campaign.campaign_name || "").toLowerCase().includes(query) ||
        String(campaign.platform || "").toLowerCase().includes(query)
      );
    });
  }, [campaigns, searchTerm]);

  // Sort the searched results when a table heading is clicked.
  const sortedCampaigns = useMemo(() => {
    const getSortValue = (campaign) => {
      switch (sortKey) {
        case "spend":
          return Number(campaign.spend) || 0;
        case "impressions":
          return Number(campaign.impressions) || 0;
        case "clicks":
          return Number(campaign.clicks) || 0;
        case "ctr":
          return getCTR(campaign);
        case "cpc":
          return getCPC(campaign);
        case "cpa":
          return getCPA(campaign);
        case "conversions":
          return Number(campaign.conversions) || 0;
        case "platform":
          return String(campaign.platform || "").toLowerCase();
        default:
          return String(campaign.campaign_name || "").toLowerCase();
      }
    };

    return [...filteredCampaigns].sort((a, b) => {
      const first = getSortValue(a);
      const second = getSortValue(b);

      let comparison;

      if (typeof first === "string" && typeof second === "string") {
        comparison = first.localeCompare(second);
      } else {
        comparison = first - second;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredCampaigns, sortKey, sortDirection]);

  const totals = useMemo(() => {
    const result = sortedCampaigns.reduce(
      (acc, campaign) => {
        acc.spend += Number(campaign.spend) || 0;
        acc.impressions += Number(campaign.impressions) || 0;
        acc.clicks += Number(campaign.clicks) || 0;
        acc.conversions += Number(campaign.conversions) || 0;
        return acc;
      },
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    result.ctr = result.impressions
      ? (result.clicks / result.impressions) * 100
      : 0;
    result.cpc = result.clicks ? result.spend / result.clicks : 0;
    result.cpa = result.conversions
      ? result.spend / result.conversions
      : 0;

    return result;
  }, [sortedCampaigns]);

  const chartData = sortedCampaigns.map((campaign) => ({
    name: campaign.campaign_name,
    spend: Number(campaign.spend) || 0,
    clicks: Number(campaign.clicks) || 0,
  }));

  function resetFilters() {
    setPlatform("All");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setSortKey("campaign_name");
    setSortDirection("asc");
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function SortHeading({ label, sortBy }) {
    const active = sortKey === sortBy;

    return (
      <button
        type="button"
        className="sort-button"
        onClick={() => handleSort(sortBy)}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        {label}
        {active ? (
          sortDirection === "asc" ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : (
          <ArrowUpDown size={14} />
        )}
      </button>
    );
  }

  function exportCSV() {
    if (sortedCampaigns.length === 0) return;

    const columns = [
      ["Campaign", (c) => c.campaign_name],
      ["Platform", (c) => c.platform],
      ["Spend (INR)", (c) => Number(c.spend) || 0],
      ["Impressions", (c) => Number(c.impressions) || 0],
      ["Clicks", (c) => Number(c.clicks) || 0],
      ["CTR (%)", (c) => getCTR(c).toFixed(2)],
      ["CPC (INR)", (c) => getCPC(c).toFixed(2)],
      ["CPA (INR)", (c) => getCPA(c).toFixed(2)],
      ["Conversions", (c) => Number(c.conversions) || 0],
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = [
      columns.map(([heading]) => escapeCSV(heading)).join(","),
      ...sortedCampaigns.map((campaign) =>
        columns
          .map(([, getValue]) => escapeCSV(getValue(campaign)))
          .join(",")
      ),
    ];

    const csv = "\uFEFF" + rows.join("\r\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ad-campaign-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <BarChart3 size={25} />
          </div>
          <div>
            <h1>Ad Campaign Tracker</h1>
            <p>Multi-channel performance overview</p>
          </div>
        </div>
        <span className="live-badge">● Live dashboard</span>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">CAMPAIGN ANALYTICS</p>
          <h2>Performance overview</h2>
          <p className="subtitle">
            Monitor spend, engagement and conversions across your campaigns.
          </p>
        </div>
      </section>

      <section className="filter-panel">
        <div className="filter-heading">
          <h3>Filter performance</h3>
          <button className="reset-button" onClick={resetFilters}>
            <RefreshCw size={15} /> Reset filters
          </button>
        </div>

        <div className="filters">
          <label>
            Platform
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              <option value="All">All platforms</option>
              <option value="Google">Google</option>
              <option value="Facebook">Facebook</option>
              <option value="Amazon">Amazon</option>
            </select>
          </label>

          <label>
            Start date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            End date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>

        {invalidDates && (
          <p className="error-message">
            Start date must be on or before end date.
          </p>
        )}
      </section>

      {error && <p className="error-message">{error}</p>}

      <section className="metrics-grid">
        <Metric
          title="Total Spend"
          value={money(totals.spend)}
          icon={<DollarSign />}
          color="teal"
        />
        <Metric
          title="Impressions"
          value={number(totals.impressions)}
          icon={<BarChart3 />}
          color="blue"
        />
        <Metric
          title="Total Clicks"
          value={number(totals.clicks)}
          icon={<MousePointerClick />}
          color="purple"
        />
        <Metric
          title="Conversions"
          value={number(totals.conversions)}
          icon={<ShoppingCart />}
          color="orange"
        />
      </section>

      <section className="secondary-metrics">
        <div>
          <span>Overall CTR</span>
          <strong>{totals.ctr.toFixed(2)}%</strong>
        </div>
        <div>
          <span>Average CPC</span>
          <strong>{money(totals.cpc)}</strong>
        </div>
        <div>
          <span>Average CPA</span>
          <strong>{money(totals.cpa)}</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Spend by campaign</h3>
              <p>Campaign spend for the selected filters and search</p>
            </div>
          </div>

          {loading ? (
            <p className="empty-state">Loading campaign data...</p>
          ) : error ? (
            <p className="empty-state">Unable to load chart data.</p>
          ) : chartData.length === 0 ? (
            <p className="empty-state">No campaign data for these filters.</p>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 8, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={65}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar
                    dataKey="spend"
                    name="Spend"
                    fill="#0d9488"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Clicks by campaign</h3>
              <p>Compare campaign engagement</p>
            </div>
          </div>

          {loading ? (
            <p className="empty-state">Loading campaign data...</p>
          ) : error ? (
            <p className="empty-state">Unable to load chart data.</p>
          ) : chartData.length === 0 ? (
            <p className="empty-state">No campaign data for these filters.</p>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 8, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={65}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickFormatter={number} />
                  <Tooltip formatter={(value) => number(value)} />
                  <Bar
                    dataKey="clicks"
                    name="Clicks"
                    fill="#6366f1"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="panel table-panel">
          <div className="panel-heading">
            <div>
              <h3>Campaign performance</h3>
              <p>
                Showing {sortedCampaigns.length} of {campaigns.length} campaigns
              </p>
            </div>
            <button
              className="export-button"
              onClick={exportCSV}
              disabled={loading || Boolean(error) || sortedCampaigns.length === 0}
              title="Download the currently filtered results as CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          <div className="campaign-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search campaign name or platform..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search campaigns"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th><SortHeading label="Campaign" sortBy="campaign_name" /></th>
                  <th><SortHeading label="Platform" sortBy="platform" /></th>
                  <th><SortHeading label="Spend" sortBy="spend" /></th>
                  <th><SortHeading label="CTR" sortBy="ctr" /></th>
                  <th><SortHeading label="CPC" sortBy="cpc" /></th>
                  <th><SortHeading label="CPA" sortBy="cpa" /></th>
                  <th><SortHeading label="Conversions" sortBy="conversions" /></th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign) => (
                  <tr key={campaign.campaign_id}>
                    <td className="campaign-name">{campaign.campaign_name}</td>
                    <td>
                      <span className="platform-tag">{campaign.platform}</span>
                    </td>
                    <td>{money(campaign.spend)}</td>
                    <td>{getCTR(campaign).toFixed(2)}%</td>
                    <td>{money(getCPC(campaign))}</td>
                    <td>{money(getCPA(campaign))}</td>
                    <td>{number(campaign.conversions)}</td>
                  </tr>
                ))}

                {!loading && !error && sortedCampaigns.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      {searchTerm
                        ? "No campaigns match your search."
                        : "No campaigns found for the selected filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer>Ad Campaign Tracker · React · Flask · MySQL</footer>
    </main>
  );
}

function Metric({ title, value, icon, color }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${color}`}>{icon}</div>
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}

export default App;
