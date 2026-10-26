import { useCallback } from "react";
import { appointmentApi } from "../sharedServer/appointmentApi.js";
import { useRequest } from "./useRequest.js";
export function useAvailability(serviceId, staffId, date, appointmentId) {
  const load = useCallback(
    (signal) =>
      serviceId && staffId && date
        ? appointmentApi.availability(
            { serviceId, staffId, date, appointmentId },
            signal,
          )
        : Promise.resolve({ slots: [] }),
    [serviceId, staffId, date, appointmentId],
  );
  return useRequest(load);
}
