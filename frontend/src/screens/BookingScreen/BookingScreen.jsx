import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../../shared/hooks/useAuth.js";
import { useRequest } from "../../shared/hooks/useRequest.js";
import { useAvailability } from "../../shared/hooks/useAvailability.js";
import { useBooking } from "../../shared/hooks/useBooking.js";
import { serviceApi } from "../../shared/sharedServer/serviceApi.js";
import { staffApi } from "../../shared/sharedServer/staffApi.js";
import { appointmentApi } from "../../shared/sharedServer/appointmentApi.js";
import {
  businessDate,
  addDays,
  displayTime,
  displayDateTime,
  money,
} from "../../shared/utils/dateTime.js";
import AP_Select from "../../components/ap_select.jsx";
import AP_DatePicker from "../../components/ap_datepicker.jsx";
import AP_Button from "../../components/ap_button.jsx";
import AP_Feedback from "../../components/ap_feedback.jsx";
function BookingForm({ original, services }) {
  const { session, settings } = useAuth(),
    today = businessDate(settings.timeZone);
  const [serviceId, setServiceId] = useState(original?.serviceId ?? ""),
    [staffId, setStaffId] = useState(original?.staffId ?? "");
  const [date, setDate] = useState(
    original
      ? businessDate(settings.timeZone, new Date(original.startAt))
      : today,
  );
  const [startAt, setStartAt] = useState(""),
    [saved, setSaved] = useState(null);
  const staff = useRequest(
    useCallback(
      (signal) =>
        serviceId
          ? staffApi.list(serviceId, signal)
          : Promise.resolve({ staff: [] }),
      [serviceId],
    ),
  );
  const available = useAvailability(serviceId, staffId, date, original?.id),
    booking = useBooking();
  const choices = useMemo(
    () =>
      (staff.data?.staff ?? []).filter(
        (employee) =>
          session.user.role !== "staff" || employee.id === session.user.id,
      ),
    [staff.data, session.user],
  );
  const selected = services.find((service) => service.id === serviceId),
    slot = available.data?.slots.find((value) => value.startAt === startAt);
  const listPath =
    session.user.role === "customer" ? "/my-appointments" : "/appointments";
  async function submit(event) {
    event.preventDefault();
    if (!slot) return;
    const appointment = await booking.submit(
      { serviceId, staffId, startAt },
      original?.id,
      () => {
        setStartAt("");
        available.reload();
      },
    );
    if (appointment) setSaved(appointment);
  }
  if (saved)
    return (
      <section className="success-card">
        <span className="badge positive">Pending confirmation</span>
        <h2>
          {original
            ? "Appointment rescheduled"
            : "Your booking has been received"}
        </h2>
        <p className="reference">{saved.reference}</p>
        <p>
          {saved.serviceName} ·{" "}
          {displayDateTime(saved.startAt, settings.timeZone)}
        </p>
        <p>
          Keep this reference for check-in. Staff will confirm your appointment.
        </p>
        <Link className="button-link" to={listPath}>
          View appointments
        </Link>
      </section>
    );
  return (
    <form onSubmit={submit} className="booking-form">
      <fieldset disabled={booking.loading}>
        <legend>1. Choose your appointment</legend>
        {original ? (
          <p>
            <strong>{original.serviceName}</strong> · {original.durationMinutes}{" "}
            minutes · {money(original.priceCents, settings.currency)}
            <br />
            Your original duration and price are preserved.
          </p>
        ) : (
          <AP_Select
            id="booking-service"
            label="Service"
            required
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setStaffId("");
              setStartAt("");
            }}
            options={services.map((service) => ({
              value: service.id,
              label: `${service.name} · ${service.durationMinutes} min · ${money(service.priceCents, settings.currency)}`,
            }))}
          />
        )}
        {!services.length && <p>No active services are available yet.</p>}
        <AP_Feedback
          loading={staff.loading && Boolean(serviceId)}
          error={staff.error}
          onRetry={staff.reload}
        />
        <div className="form-row">
          <AP_Select
            id="booking-staff"
            label="Staff member"
            value={staffId}
            onChange={(event) => {
              setStaffId(event.target.value);
              setStartAt("");
            }}
            disabled={!serviceId || staff.loading}
            required
            options={choices.map((employee) => ({
              value: employee.id,
              label: employee.fullName,
            }))}
          />
          <AP_DatePicker
            id="booking-date"
            label="Date"
            value={date}
            min={today}
            max={addDays(today, 365)}
            required
            onChange={(event) => {
              setDate(event.target.value);
              setStartAt("");
            }}
          />
        </div>
        {serviceId && staff.data && !choices.length && (
          <p>No qualified staff are available for this service.</p>
        )}
      </fieldset>
      <fieldset disabled={booking.loading}>
        <legend>2. Pick an available time</legend>
        <p>
          Times are shown in {settings.timeZone}. Availability is checked again
          when you submit.
        </p>
        {staffId && date ? (
          <>
            <AP_Feedback
              loading={available.loading}
              error={available.error}
              onRetry={available.reload}
            />
            <div className="slot-grid">
              {available.data?.slots.map((value) => (
                <AP_Button
                  className={value.startAt === startAt ? "selected" : ""}
                  key={value.startAt}
                  aria-pressed={value.startAt === startAt}
                  onClick={() => setStartAt(value.startAt)}
                >
                  {displayTime(value.startAt, settings.timeZone)}
                </AP_Button>
              ))}
            </div>
            {available.data && !available.data.slots.length && (
              <p>
                No available times on this date. Choose another day or staff
                member.
              </p>
            )}
          </>
        ) : (
          <p>Choose a service, staff member, and date first.</p>
        )}
      </fieldset>
      <section className="review">
        <h2>3. Review & submit</h2>
        {slot ? (
          <p>
            <strong>{original?.serviceName ?? selected?.name}</strong>
            <br />
            {
              choices.find((employee) => employee.id === staffId)?.fullName
            } · {displayDateTime(slot.startAt, settings.timeZone)}
            <br />
            {original?.durationMinutes ?? selected?.durationMinutes} minutes ·{" "}
            {money(
              original?.priceCents ?? selected?.priceCents ?? 0,
              settings.currency,
            )}
          </p>
        ) : (
          <p>Select a time to review your appointment.</p>
        )}
        <AP_Feedback error={booking.error} />
        <div className="actions">
          <AP_Button type="submit" disabled={!slot || booking.loading}>
            {booking.loading
              ? "Submitting…"
              : original
                ? "Save new appointment time"
                : "Request appointment"}
          </AP_Button>
          <Link to={listPath}>Back to appointments</Link>
        </div>
      </section>
    </form>
  );
}
export default function BookingScreen() {
  const [params] = useSearchParams(),
    appointmentId = params.get("appointmentId");
  const { session } = useAuth();
  const request = useRequest(
    useCallback(
      async (signal) => {
        const [catalog, booking] = await Promise.all([
          serviceApi.list(false, signal),
          appointmentId
            ? appointmentApi.get(appointmentId, signal)
            : Promise.resolve({ appointment: null }),
        ]);
        return { ...catalog, ...booking };
      },
      [appointmentId],
    ),
  );
  if (!appointmentId && session.user.role !== "customer")
    return (
      <main>
        <h1>Customer booking</h1>
        <p>Use a customer account to create an appointment.</p>
      </main>
    );
  return (
    <main>
      <p className="eyebrow">Appointments</p>
      <h1>
        {appointmentId ? "Reschedule appointment" : "Book an appointment"}
      </h1>
      <p>
        {appointmentId
          ? "Your current booking is kept if the new time cannot be reserved."
          : "Find a service and a time that work for you."}
      </p>
      <AP_Feedback
        loading={request.loading}
        error={request.error}
        onRetry={request.reload}
      />
      {request.data && (
        <BookingForm
          key={appointmentId ?? "new"}
          original={request.data.appointment}
          services={request.data.services}
        />
      )}
    </main>
  );
}
