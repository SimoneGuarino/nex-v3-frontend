// modules/documents/hooks/usePdfDocument.ts
// Native PDF viewer hook (no pdfjs-dist).
// It resolves a PdfSource into a URL for <iframe>/<object> with proper cleanup and abort handling.

import * as React from "react";
import type { PdfSource, OpenPdfOptions, ResolvedPdfSrc } from "../lib/openPdf";
import { resolvePdfSource } from "../lib/openPdf";

type State = {
  viewerSrc: string | null;
  isObjectUrl: boolean;
  loading: boolean;
  error: string | null;
};

export function usePdfDocument(src: PdfSource | null, opt?: OpenPdfOptions) {
  const [state, setState] = React.useState<State>({
    viewerSrc: null,
    isObjectUrl: false,
    loading: false,
    error: null,
  });

  const cleanupRef = React.useRef<(() => void) | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const cleanup = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (cleanupRef.current) {
      try {
        cleanupRef.current();
      } catch {
        // ignore
      }
      cleanupRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    cleanup();

    if (!src) {
      setState((s) => ({ ...s, viewerSrc: null, isObjectUrl: false, loading: false, error: null }));
      return () => {
        mounted = false;
        cleanup();
      };
    }

    const ac = new AbortController();
    abortRef.current = ac;

    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const resolved: ResolvedPdfSrc = await resolvePdfSource(src, opt ?? {}, ac.signal);
        if (!mounted) {
          resolved.cleanup();
          return;
        }
        cleanupRef.current = resolved.cleanup;
        setState({ viewerSrc: resolved.url, isObjectUrl: resolved.isObjectUrl, loading: false, error: null });
      } catch (e: any) {
        if (!mounted) return;
        const aborted = e?.name === "AbortError";
        if (aborted) return;
        setState((s) => ({ ...s, loading: false, error: e?.message ?? "Errore PDF" }));
      }
    })();

    return () => {
      mounted = false;
      cleanup();
    };
    // Important: src is an object; using JSON.stringify is fragile.
    // We rely on reference changes from caller. If you need stable behavior, pass a stable "key" and rebuild src when key changes.
  }, [src, opt, cleanup]);

  return {
    viewerSrc: state.viewerSrc,
    isObjectUrl: state.isObjectUrl,
    loading: state.loading,
    error: state.error,
    cleanup,
  };
}
