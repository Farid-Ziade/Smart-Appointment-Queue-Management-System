import { useCallback, useEffect, useState } from "react";
export function useRequest(load) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({
    source: null,
    revision: -1,
    data: null,
    error: "",
  });
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ source: load, revision, data, error: "", loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            source: load,
            revision,
            data: null,
            error: error.userMessage || error.message || "Could not load data.",
            loading: false,
          });
      });
    return () => controller.abort();
  }, [load, revision]);
  const current =
    state.source === load && state.revision === revision
      ? state
      : { data: null, error: "", loading: true };
  return { ...current, reload };
}
