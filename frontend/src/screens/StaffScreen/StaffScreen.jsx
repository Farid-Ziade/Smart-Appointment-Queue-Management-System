import { useCallback, useState } from "react";
import { staffApi } from "../../shared/sharedServer/staffApi.js";
import { serviceApi } from "../../shared/sharedServer/serviceApi.js";
import { registerSchema } from "../RegisterScreen/registerSchema.js";
import { useRequest } from "../../shared/hooks/useRequest.js";
import { useAction } from "../../shared/hooks/useAction.js";
import AP_Button from "../../components/ap_button.jsx";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_DatePicker from "../../components/ap_datepicker.jsx";
import AP_Select from "../../components/ap_select.jsx";
import AP_Table from "../../components/ap_table.jsx";
import AP_Modal from "../../components/ap_modal.jsx";
import AP_Feedback from "../../components/ap_feedback.jsx";
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
function clock(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
function minutes(value) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(value))
    throw new Error("Use HH:mm, for example 09:00 or 17:30.");
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
function StaffForm({ onSaved }) {
  const [form, setForm] = useState({
      fullName: "",
      email: "",
      phone: "",
      password: "",
    }),
    action = useAction();
  async function submit(event) {
    event.preventDefault();
    if (
      await action.run(async () =>
        staffApi.create(await registerSchema.validate(form)),
      )
    )
      onSaved();
  }
  return (
    <form onSubmit={submit}>
      {[
        ["fullName", "Full name", "text"],
        ["email", "Email", "email"],
        ["phone", "Phone", "tel"],
        ["password", "Initial password", "password"],
      ].map(([key, label, type]) => (
        <AP_Textbox
          key={key}
          id={`staff-${key}`}
          label={label}
          type={type}
          autoComplete={key === "password" ? "new-password" : "off"}
          value={form[key]}
          onChange={(event) => setForm({ ...form, [key]: event.target.value })}
          disabled={action.busy}
          required
        />
      ))}
      <AP_Feedback error={action.error} />
      <AP_Button type="submit" disabled={action.busy}>
        {action.busy ? "Creating…" : "Create staff account"}
      </AP_Button>
    </form>
  );
}
function ScheduleForm({ employee, services, onSaved }) {
  const [serviceIds, setServiceIds] = useState(
    employee.schedule?.serviceIds ?? [],
  );
  const [weekly, setWeekly] = useState(
    (employee.schedule?.weekly ?? []).map((row) => ({
      key: crypto.randomUUID(),
      weekday: row.weekday,
      start: clock(row.startMinute),
      end: clock(row.endMinute),
    })),
  );
  const [daysOff, setDaysOff] = useState(employee.schedule?.daysOff ?? []),
    [day, setDay] = useState("");
  const action = useAction();
  function change(key, field, value) {
    setWeekly((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }
  async function submit(event) {
    event.preventDefault();
    if (
      await action.run(() =>
        staffApi.saveSchedule(employee.id, {
          serviceIds,
          daysOff,
          weekly: weekly.map((row) => ({
            weekday: Number(row.weekday),
            startMinute: minutes(row.start),
            endMinute: minutes(row.end),
          })),
        }),
      )
    )
      onSaved();
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={action.busy}>
        <legend>Qualified services</legend>
        <div className="checkbox-grid">
          {services.map((service) => (
            <label key={service.id}>
              <input
                type="checkbox"
                checked={serviceIds.includes(service.id)}
                onChange={(event) =>
                  setServiceIds((ids) =>
                    event.target.checked
                      ? [...ids, service.id]
                      : ids.filter((id) => id !== service.id),
                  )
                }
              />
              {service.name}
              {!service.isActive && " (inactive)"}
            </label>
          ))}
        </div>
        {!services.length && (
          <p>Create services before assigning qualifications.</p>
        )}
      </fieldset>
      <fieldset disabled={action.busy}>
        <legend>Weekly working hours</legend>
        <p>
          Use 24-hour times. Add separate intervals for a lunch break. Closing
          at 24:00 means midnight.
        </p>
        {weekly.map((row) => (
          <div className="schedule-row" key={row.key}>
            <AP_Select
              id={`day-${row.key}`}
              label="Day"
              value={row.weekday}
              onChange={(event) =>
                change(row.key, "weekday", event.target.value)
              }
              options={weekdays.map((name, index) => ({
                value: index + 1,
                label: name,
              }))}
              placeholder={null}
            />
            <AP_Textbox
              id={`start-${row.key}`}
              label="Opens"
              value={row.start}
              onChange={(event) => change(row.key, "start", event.target.value)}
              placeholder="09:00"
              required
            />
            <AP_Textbox
              id={`end-${row.key}`}
              label="Closes"
              value={row.end}
              onChange={(event) => change(row.key, "end", event.target.value)}
              placeholder="17:00"
              required
            />
            <AP_Button
              onClick={() =>
                setWeekly((rows) => rows.filter((item) => item.key !== row.key))
              }
            >
              Remove interval
            </AP_Button>
          </div>
        ))}
        <AP_Button
          disabled={weekly.length >= 28}
          onClick={() =>
            setWeekly((rows) => [
              ...rows,
              {
                key: crypto.randomUUID(),
                weekday: 1,
                start: "09:00",
                end: "17:00",
              },
            ])
          }
        >
          Add working interval
        </AP_Button>
      </fieldset>
      <fieldset disabled={action.busy}>
        <legend>Days off</legend>
        <div className="form-row">
          <AP_DatePicker
            id="day-off"
            label="Date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
          <AP_Button
            disabled={!day}
            onClick={() => {
              setDaysOff((values) => [...new Set([...values, day])].sort());
              setDay("");
            }}
          >
            Add day off
          </AP_Button>
        </div>
        <div className="actions">
          {daysOff.map((date) => (
            <AP_Button
              key={date}
              aria-label={`Remove day off ${date}`}
              onClick={() =>
                setDaysOff((values) => values.filter((value) => value !== date))
              }
            >
              {date} ×
            </AP_Button>
          ))}
        </div>
      </fieldset>
      <p>
        Saving will be refused if these hours or qualifications conflict with
        existing appointments.
      </p>
      <AP_Feedback error={action.error} />
      <AP_Button type="submit" disabled={action.busy}>
        {action.busy ? "Saving…" : "Save schedule"}
      </AP_Button>
    </form>
  );
}
export default function StaffScreen() {
  const request = useRequest(
    useCallback(async (signal) => {
      const [employees, catalog] = await Promise.all([
        staffApi.list(undefined, signal),
        serviceApi.list(true, signal),
      ]);
      return { ...employees, ...catalog };
    }, []),
  );
  const [editor, setEditor] = useState(null),
    [success, setSuccess] = useState("");
  function saved() {
    setSuccess(
      editor === "new"
        ? "Staff account created. Add qualifications and working hours next."
        : "Schedule saved.",
    );
    setEditor(null);
    request.reload();
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Staff & schedules</h1>
          <p>
            Choose who can provide each service, and when they are available.
          </p>
        </div>
        <AP_Button onClick={() => setEditor("new")}>Add staff</AP_Button>
      </div>
      <AP_Feedback
        loading={request.loading}
        error={request.error}
        success={success}
        onRetry={request.reload}
      />
      {request.data && (
        <AP_Table
          caption="Staff directory"
          rows={request.data.staff}
          empty="No staff accounts yet."
          columns={[
            { key: "fullName", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "qualified",
              label: "Qualified services",
              render: (row) =>
                request.data.services
                  .filter((service) =>
                    row.schedule?.serviceIds.includes(service.id),
                  )
                  .map((service) => service.name)
                  .join(", ") || "None assigned",
            },
            {
              key: "hours",
              label: "Working intervals",
              render: (row) => row.schedule?.weekly.length ?? 0,
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <AP_Button onClick={() => setEditor(row)}>
                  Edit schedule
                </AP_Button>
              ),
            },
          ]}
        />
      )}
      <AP_Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={
          editor === "new"
            ? "Create staff account"
            : `Schedule: ${editor?.fullName ?? ""}`
        }
      >
        {editor === "new" ? (
          <StaffForm onSaved={saved} />
        ) : (
          editor &&
          request.data && (
            <ScheduleForm
              key={editor.id}
              employee={editor}
              services={request.data.services}
              onSaved={saved}
            />
          )
        )}
      </AP_Modal>
    </main>
  );
}
