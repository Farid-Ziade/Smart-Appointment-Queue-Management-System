import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth.js";
import { useRequest } from "../../shared/hooks/useRequest.js";
import { useAction } from "../../shared/hooks/useAction.js";
import { useQueueSocket } from "../../shared/hooks/useQueueSocket.js";
import { queueApi } from "../../shared/sharedServer/queueApi.js";
import { staffApi } from "../../shared/sharedServer/staffApi.js";
import { displayTime } from "../../shared/utils/dateTime.js";
import AP_Button from "../../components/ap_button.jsx";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_Select from "../../components/ap_select.jsx";
import AP_Table from "../../components/ap_table.jsx";
import AP_Modal from "../../components/ap_modal.jsx";
import AP_Feedback from "../../components/ap_feedback.jsx";
export default function QueueScreen() {
  const { session, settings } = useAuth(),
    admin = session.user.role === "admin";
  const request = useRequest(
    useCallback((signal) => queueApi.list(signal), []),
  );
  const staff = useRequest(
    useCallback((signal) => staffApi.list(undefined, signal), []),
  );
  const connected = useQueueSocket(request.reload),
    action = useAction();
  const [reference, setReference] = useState(""),
    [staffId, setStaffId] = useState(admin ? "" : session.user.id),
    [priorityEntry, setPriorityEntry] = useState(null),
    [priority, setPriority] = useState("0");
  const counts = useMemo(
    () =>
      (request.data?.entries ?? []).reduce(
        (result, row) => ({
          ...result,
          [row.status]: (result[row.status] ?? 0) + 1,
        }),
        {},
      ),
    [request.data],
  );
  async function checkIn(event) {
    event.preventDefault();
    if (
      await action.run(
        () => queueApi.checkIn(reference.trim()),
        "Customer checked in.",
      )
    ) {
      setReference("");
      request.reload();
    }
  }
  async function call() {
    if (
      await action.run(
        () => queueApi.callNext(staffId),
        "Next customer called.",
      )
    )
      request.reload();
  }
  async function change(row, operation) {
    if (
      await action.run(
        () => queueApi.change(row.id, operation),
        operation === "start" ? "Service started." : "Appointment completed.",
      )
    )
      request.reload();
  }
  async function savePriority(event) {
    event.preventDefault();
    if (
      await action.run(
        () => queueApi.prioritize(priorityEntry.id, Number(priority)),
        "Queue priority updated.",
      )
    ) {
      setPriorityEntry(null);
      request.reload();
    }
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Today’s arrivals</p>
          <h1>Live queue</h1>
          <p>Check in confirmed appointments, then call and serve customers.</p>
        </div>
        <span className={`badge ${connected ? "positive" : ""}`}>
          {connected
            ? "Live updates connected"
            : "Reconnecting · refresh every 20 seconds"}
        </span>
      </div>
      <div className="metric-grid compact">
        {[
          ["Waiting", "Waiting"],
          ["Called", "Called"],
          ["InService", "In service"],
        ].map(([key, label]) => (
          <article className="metric" key={key}>
            <span>{label}</span>
            <strong>{request.data ? (counts[key] ?? 0) : "—"}</strong>
          </article>
        ))}
      </div>
      <div className="queue-tools">
        <form onSubmit={checkIn}>
          <h2>Check in a customer</h2>
          <AP_Textbox
            id="check-in-reference"
            label="Booking reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="APT-…"
            required
            disabled={action.busy}
          />
          <AP_Button type="submit" disabled={action.busy || !reference.trim()}>
            Check in
          </AP_Button>
        </form>
        <section>
          <h2>Call the next customer</h2>
          {admin ? (
            <>
              <AP_Feedback error={staff.error} onRetry={staff.reload} />
              <AP_Select
                id="queue-staff"
                label="Staff member"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                options={(staff.data?.staff ?? []).map((employee) => ({
                  value: employee.id,
                  label: employee.fullName,
                }))}
              />
            </>
          ) : (
            <p>{session.user.fullName}</p>
          )}
          <AP_Button disabled={!staffId || action.busy} onClick={call}>
            Call next
          </AP_Button>
          <p className="muted">
            Priority first, then arrival order. Finish the current customer
            before calling another.
          </p>
        </section>
      </div>
      <AP_Feedback
        error={!priorityEntry && action.error}
        success={action.success}
      />
      <AP_Feedback
        loading={request.loading}
        error={request.error}
        onRetry={request.reload}
      />
      {request.data && (
        <AP_Table
          caption={`Active queue · ${request.data.day}`}
          rows={request.data.entries}
          empty="No customers are waiting or being served."
          columns={[
            {
              key: "label",
              label: "Number",
              render: (row) => (
                <strong className="queue-number">{row.label}</strong>
              ),
            },
            {
              key: "customer",
              label: "Customer",
              render: (row) => (
                <>
                  {row.appointment?.customerId?.fullName}
                  <small>{row.appointment?.reference}</small>
                </>
              ),
            },
            {
              key: "service",
              label: "Service / staff",
              render: (row) => (
                <>
                  {row.appointment?.serviceName}
                  <small>{row.appointment?.staffId?.fullName}</small>
                </>
              ),
            },
            {
              key: "checkedInAt",
              label: "Arrival",
              render: (row) => displayTime(row.checkedInAt, settings.timeZone),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <span className="badge">{row.status}</span>,
            },
            { key: "priority", label: "Priority" },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="actions">
                  {row.status === "Called" && (
                    <AP_Button
                      disabled={action.busy}
                      onClick={() => change(row, "start")}
                    >
                      Start service
                    </AP_Button>
                  )}
                  {row.status === "InService" && (
                    <AP_Button
                      disabled={action.busy}
                      onClick={() => change(row, "complete")}
                    >
                      Complete
                    </AP_Button>
                  )}
                  {admin && row.status === "Waiting" && (
                    <AP_Button
                      onClick={() => {
                        setPriorityEntry(row);
                        setPriority(String(row.priority));
                      }}
                    >
                      Set priority
                    </AP_Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
      <AP_Modal
        open={Boolean(priorityEntry)}
        onClose={() => !action.busy && setPriorityEntry(null)}
        title={`Priority for ${priorityEntry?.label ?? ""}`}
      >
        <form onSubmit={savePriority}>
          <p>
            Higher numbers are called first. Use 0 for normal arrival order.
          </p>
          <AP_Textbox
            id="queue-priority"
            label="Priority (0–1000)"
            type="number"
            min="0"
            max="1000"
            step="1"
            required
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          />
          <AP_Feedback error={action.error} />
          <AP_Button type="submit" disabled={action.busy}>
            Save priority
          </AP_Button>
        </form>
      </AP_Modal>
    </main>
  );
}
