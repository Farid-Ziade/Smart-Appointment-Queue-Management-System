import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth.js";
import { useRequest } from "../../shared/hooks/useRequest.js";
import { getDashboard } from "../../shared/sharedServer/dashboardApi.js";
import { businessDate, addDays, money } from "../../shared/utils/dateTime.js";
import AP_DatePicker from "../../components/ap_datepicker.jsx";
import AP_Button from "../../components/ap_button.jsx";
import AP_Feedback from "../../components/ap_feedback.jsx";
export default function DashboardScreen() {
  const { settings } = useAuth(),
    today = businessDate(settings.timeZone);
  const [range, setRange] = useState({ from: today, to: today }),
    [draft, setDraft] = useState(range);
  const request = useRequest(
    useCallback((signal) => getDashboard(range, signal), [range]),
  );
  const maxVolume = useMemo(
    () => Math.max(1, ...(request.data?.volume ?? []).map((row) => row.count)),
    [request.data],
  );
  function apply(event) {
    event.preventDefault();
    setRange({ ...draft });
  }
  const metrics = request.data?.metrics;
  const cards = metrics
    ? [
        ["Appointments", metrics.appointments],
        ["Completed", metrics.completed],
        ["Cancelled", metrics.cancelled],
        ["No-shows", metrics.noShows],
        ["Waiting today", metrics.waiting],
        ["Completed revenue", money(metrics.revenueCents, settings.currency)],
      ]
    : [];
  return (
    <main>
      <p className="eyebrow">Administration</p>
      <h1>Business dashboard</h1>
      <p>Appointment totals and completed revenue from your database.</p>
      <form className="filters" onSubmit={apply}>
        <AP_DatePicker
          id="dashboard-from"
          label="From"
          value={draft.from}
          required
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
        />
        <AP_DatePicker
          id="dashboard-to"
          label="To"
          min={draft.from}
          value={draft.to}
          required
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
        />
        <AP_Button type="submit">Apply dates</AP_Button>
        <AP_Button
          onClick={() => {
            const value = { from: addDays(today, -6), to: today };
            setDraft(value);
            setRange(value);
          }}
        >
          Last 7 days
        </AP_Button>
      </form>
      <AP_Feedback
        loading={request.loading}
        error={request.error}
        onRetry={request.reload}
      />
      {metrics && (
        <>
          <div className="metric-grid">
            {cards.map(([label, value]) => (
              <article className="metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <p className="muted">
            Totals use the appointment’s scheduled date. Revenue uses the price
            saved with each completed appointment. “Waiting today” includes
            waiting and called customers, regardless of the selected dates.
          </p>
          <section className="chart-card">
            <h2>Appointment volume</h2>
            <p>
              Seven days ending {range.to}; includes every appointment status.
            </p>
            <div
              className="bar-chart"
              role="img"
              aria-label={request.data.volume
                .map((row) => `${row.date}: ${row.count} appointments`)
                .join("; ")}
            >
              {request.data.volume.map((row) => (
                <div className="bar-column" key={row.date}>
                  <span>{row.count}</span>
                  <div className="bar-track">
                    <div
                      className="bar"
                      style={{ height: `${(row.count / maxVolume) * 100}%` }}
                    />
                  </div>
                  <small>{row.date.slice(5)}</small>
                </div>
              ))}
            </div>
            <details>
              <summary>View chart data</summary>
              <table>
                <caption>Daily appointment counts</caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Appointments</th>
                  </tr>
                </thead>
                <tbody>
                  {request.data.volume.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        </>
      )}
    </main>
  );
}
