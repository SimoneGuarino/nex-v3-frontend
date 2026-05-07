import { useEffect } from "react";
import { ensureSingleSpaRuntimeStarted } from "../root-config";

/**
 * Starts the single-spa runtime only after React has committed the shell DOM.
 *
 * In development React.StrictMode intentionally mounts, unmounts and mounts the
 * tree again. Starting single-spa synchronously in the first effect can make an
 * MFE mount while the shell outlet is temporarily removed by StrictMode, causing
 * `mfe-content-root non trovato nella shell` and SKIP_BECAUSE_BROKEN.
 */
export default function SingleSpaRuntime() {
    useEffect(() => {
        let cancelled = false;
        let frameId = 0;
        let attempts = 0;

        const run = () => {
            if (cancelled) return;

            const started = ensureSingleSpaRuntimeStarted();
            if (started) return;

            attempts += 1;
            if (attempts <= 20) {
                frameId = window.requestAnimationFrame(run);
            }
        };

        frameId = window.requestAnimationFrame(run);

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    return null;
}
