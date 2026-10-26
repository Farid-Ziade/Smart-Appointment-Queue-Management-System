import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../shared/hooks/useAuth.js";
import { useAppointments } from "../../shared/hooks/useAppointments.js";
import { useAction } from "../../shared/hooks/useAction.js";
import { appointmentApi } from "../../shared/sharedServer/appointmentApi.js";
import {
  businessDate,
  addDays,
  displayDateTime,
  money,
} from "../../shared/utils/dateTime.js";
import AP_Button from "../../components/ap_button.jsx";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_DatePicker from "../../components/ap_datepicker.jsx";
import AP_Table from "../../components/ap_table.jsx";
import AP_Modal from "../../components/ap_modal.jsx";
import AP_Feedback from "../../components/ap_feedback.jsx";
export default function AppointmentsScreen() {
  const { session, settings } = useAuth(),
    customer = session.user.role === "customer",
    today = businessDate(settings.timeZone);
  const [filters, setFilters] = useState({
      from: addDays(today, -30),
      to: addDays(today, 90),
      search: "",
    }),
    [draft, setDraft] = useState(filters),
    [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null),
    action = useAction();
  const request = useAppointments(
    filters.from,
    filters.to,
    filters.search,
    page,
  );
  async function confirm(row) {
    if (
      await action.run(
        () => appointmentApi.confirm(row.id),
        "Appointment confirmed.",
      )
    )
      request.reload();
  }
  async function cancel() {
    if (
      await action.run(
        () => appointmentApi.cancel(cancelTarget.id),
        "Appointment cancelled.",
      )
    ) {
      setCancelTarget(null);
      request.reload();
    }
  }
  function apply(event) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft, search: draft.search.trim() });
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Appointments</p>
          <h1>{customer ? "My appointments" : "Manage appointments"}</h1>
          <p>
            {customer
              ? "Review your requests, change a time, or cancel a booking."
              : "Confirm requests and manage the appointments assigned to your team."}
          </p>
        </div>
        {customer && (
          <Link className="button-link" to="/book">
            Book appointment
          </Link>
        )}
      </div>
      <form className="filters" onSubmit={apply}>
        <AP_DatePicker
          id="appointments-from"
          label="From"
          value={draft.from}
          onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          required
        />
        <AP_DatePicker
          id="appointments-to"
          label="To"
          min={draft.from}
          value={draft.to}
          onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          required
        />
        <AP_Textbox
          id="appointments-search"
          label="Booking reference"
          value={draft.search}
          onChange={(event) =>
            setDraft({ ...draft, search: event.target.value })
          }
          placeholder="APT-…"
        />
        <AP_Button type="submit">Apply filters</AP_Button>
      </form>
      <AP_Feedback
        loading={request.loading}
        error={request.error}
        onRetry={request.reload}
      />
      <AP_Feedback
        error={!cancelTarget && action.error}
        success={action.success}
      />
      {request.data && (
        <>
          <AP_Table
            caption={`${request.data.total} appointments in the selected range`}
            rows={request.data.appointments}
            empty="No appointments match these filters."
            columns={[
              {
                key: "reference",
                label: "Booking",
                render: (row) => (
                  <>
                    <strong>{row.reference}</strong>
                    <small>{row.serviceName}</small>
                  </>
                ),
              },
              {
                key: "startAt",
                label: "Date & time",
                render: (row) => (
                  <>
                    {displayDateTime(row.startAt, settings.timeZone)}
                    <small>
                      {row.durationMinutes} minutes ·{" "}
                      {row.staff?.fullName ?? "Staff unavailable"}
                    </small>
                  </>
                ),
              },
              ...(!customer
                ? [
                    {
                      key: "customer",
                      label: "Customer",
                      render: (row) => (
                        <>
                          {row.customer?.fullName}
                          <small>{row.customer?.email}</small>
                        </>
                      ),
                    },
                  ]
                : []),
              {
                key: "priceCents",
                label: "Price",
                render: (row) => money(row.priceCents, settings.currency),
              },
              {
                key: "status",
                label: "Status",
                render: (row) => <span className="badge">{row.status}</span>,
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="actions">
                    {!customer &&
                      row.status === "Pending" &&
                      new Date(row.startAt) > new Date() && (
                        <AP_Button
                          disabled={action.busy}
                          onClick={() => confirm(row)}
                        >
                          Confirm
                        </AP_Button>
                      )}
                    {["Pending", "Confirmed"].includes(row.status) && (
                      <Link to={`/book?appointmentId=${row.id}`}>
                        Reschedule
                      </Link>
                    )}
                    {(customer
                      ? ["Pending", "Confirmed"]
                      : ["Pending", "Confirmed", "CheckedIn"]
                    ).includes(row.status) && (
                      <AP_Button
                        disabled={action.busy}
                        onClick={() => setCancelTarget(row)}
                      >
                        Cancel
                      </AP_Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <div className="pagination">
            <AP_Button
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </AP_Button>
            <span>
              Page {request.data.page} of {request.data.pages}
            </span>
            <AP_Button
              disabled={page >= request.data.pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </AP_Button>
          </div>
        </>
      )}
      <AP_Modal
        open={Boolean(cancelTarget)}
        onClose={() => !action.busy && setCancelTarget(null)}
        title="Cancel this appointment?"
      >
        {cancelTarget && (
          <>
            <p>
              {cancelTarget.serviceName} · {cancelTarget.reference}
            </p>
            <p>{displayDateTime(cancelTarget.startAt, settings.timeZone)}</p>
            <p>The reserved time will become available to other customers.</p>
            <AP_Feedback error={action.error} />
            <div className="actions">
              <AP_Button
                className="danger"
                disabled={action.busy}
                onClick={cancel}
              >
                {action.busy ? "Cancelling…" : "Yes, cancel appointment"}
              </AP_Button>
              <AP_Button
                disabled={action.busy}
                onClick={() => setCancelTarget(null)}
              >
                Keep appointment
              </AP_Button>
            </div>
          </>
        )}
      </AP_Modal>
    </main>
  );
}
