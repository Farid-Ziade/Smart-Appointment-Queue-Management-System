import { useCallback, useState } from "react";
import * as yup from "yup";
import { serviceApi } from "../../shared/sharedServer/serviceApi.js";
import { useRequest } from "../../shared/hooks/useRequest.js";
import { useAction } from "../../shared/hooks/useAction.js";
import { useAuth } from "../../shared/hooks/useAuth.js";
import { money, priceToCents } from "../../shared/utils/dateTime.js";
import AP_Button from "../../components/ap_button.jsx";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_Table from "../../components/ap_table.jsx";
import AP_Modal from "../../components/ap_modal.jsx";
import AP_Feedback from "../../components/ap_feedback.jsx";
const schema = yup.object({
  name: yup.string().trim().required("Enter a service name.").max(120),
  description: yup.string().trim().required("Enter a description.").max(2000),
  durationMinutes: yup
    .number()
    .typeError("Enter a duration in minutes.")
    .integer()
    .min(1)
    .max(480)
    .required(),
  price: yup.string().required("Enter a price."),
});
function ServiceForm({ service, onSaved, currency }) {
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    durationMinutes: service?.durationMinutes ?? 30,
    price: service?.id ? (service.priceCents / 100).toFixed(2) : "0.00",
  });
  const action = useAction();
  function field(name) {
    return {
      value: form[name],
      onChange: (event) => setForm({ ...form, [name]: event.target.value }),
      disabled: action.busy,
    };
  }
  async function submit(event) {
    event.preventDefault();
    const result = await action.run(async () => {
      const data = await schema.validate(form);
      return serviceApi.save(service?.id, {
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes,
        priceCents: priceToCents(data.price),
      });
    });
    if (result) onSaved();
  }
  return (
    <form onSubmit={submit}>
      <AP_Textbox
        id="service-name"
        label="Service name"
        required
        maxLength={120}
        {...field("name")}
      />
      <AP_Textbox
        id="service-description"
        label="Description"
        required
        maxLength={2000}
        {...field("description")}
      />
      <div className="form-row">
        <AP_Textbox
          id="service-duration"
          label="Duration (minutes)"
          type="number"
          min="1"
          max="480"
          required
          {...field("durationMinutes")}
        />
        <AP_Textbox
          id="service-price"
          label={`Price (${currency})`}
          inputMode="decimal"
          required
          {...field("price")}
        />
      </div>
      <AP_Feedback error={action.error} />
      <AP_Button type="submit" disabled={action.busy}>
        {action.busy ? "Saving…" : "Save service"}
      </AP_Button>
    </form>
  );
}
export default function ServicesScreen() {
  const { settings } = useAuth(),
    request = useRequest(
      useCallback((signal) => serviceApi.list(true, signal), []),
    );
  const action = useAction(),
    [editor, setEditor] = useState(null);
  async function toggle(row) {
    if (
      await action.run(
        () => serviceApi.setActive(row.id, !row.isActive),
        row.isActive
          ? "Service deactivated. Existing bookings are preserved."
          : "Service activated.",
      )
    )
      request.reload();
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Services</h1>
          <p>Set the duration and price customers see when booking.</p>
        </div>
        <AP_Button onClick={() => setEditor({})}>Add service</AP_Button>
      </div>
      <AP_Feedback
        loading={request.loading}
        error={request.error}
        onRetry={request.reload}
      />
      <AP_Feedback error={action.error} success={action.success} />
      {request.data && (
        <AP_Table
          caption="Service catalog"
          rows={request.data.services}
          columns={[
            {
              key: "name",
              label: "Service",
              render: (row) => (
                <>
                  <strong>{row.name}</strong>
                  <small>{row.description}</small>
                </>
              ),
            },
            {
              key: "durationMinutes",
              label: "Duration",
              render: (row) => `${row.durationMinutes} min`,
            },
            {
              key: "priceCents",
              label: "Price",
              render: (row) => money(row.priceCents, settings.currency),
            },
            {
              key: "isActive",
              label: "Status",
              render: (row) => (
                <span className={`badge ${row.isActive ? "positive" : ""}`}>
                  {row.isActive ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="actions">
                  <AP_Button onClick={() => setEditor(row)}>Edit</AP_Button>
                  <AP_Button disabled={action.busy} onClick={() => toggle(row)}>
                    {row.isActive ? "Deactivate" : "Activate"}
                  </AP_Button>
                </div>
              ),
            },
          ]}
          empty="No services yet. Add your first service."
        />
      )}
      <AP_Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.id ? "Edit service" : "Add service"}
      >
        {editor && (
          <ServiceForm
            key={editor.id || "new"}
            service={editor}
            currency={settings.currency}
            onSaved={() => {
              setEditor(null);
              request.reload();
            }}
          />
        )}
      </AP_Modal>
    </main>
  );
}
