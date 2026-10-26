import { useCallback } from "react";
import { appointmentApi } from "../sharedServer/appointmentApi.js";
import { useRequest } from "./useRequest.js";
export function useAppointments(from, to, search, page) {
  return useRequest(
    useCallback(
      (signal) => appointmentApi.list({ from, to, search, page }, signal),
      [from, to, search, page],
    ),
  );
}
