import React from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import type { WorkspaceTab } from "../../domain/workspace.types";

type WorkspaceTabErrorBoundaryProps = {
    tab: WorkspaceTab;
    children: React.ReactNode;
};

/**
 * Minimal state owned by the class boundary.
 *
 * Error boundaries must be class components in React 18. The state intentionally
 * stores only a user-safe message and not the full Error object, avoiding large
 * non-serializable structures in React state.
 */
type WorkspaceTabErrorBoundaryState = {
    hasError: boolean;
    message: string | null;
};

/**
 * Local error boundary for lazy workspace tabs.
 *
 * A single tab failure must not crash the whole MEPA workspace. Keeping the
 * boundary at tab level makes runtime failures recoverable for the user and
 * preserves the tender context, selected tab navigation and global page shell.
 */
export class WorkspaceTabErrorBoundary extends React.Component<WorkspaceTabErrorBoundaryProps, WorkspaceTabErrorBoundaryState> {
    // Initial healthy state. Keeping this explicit helps future maintainers see the
    // only two values that can affect the boundary render branch.
    state: WorkspaceTabErrorBoundaryState = {
        hasError: false,
        message: null,
    };

    // React calls this during render error recovery. It must be pure: no logging,
    // no telemetry calls and no state reads from `this`.
    static getDerivedStateFromError(error: unknown): WorkspaceTabErrorBoundaryState {
        return {
            hasError: true,
            message: error instanceof Error ? error.message : "Errore non previsto nella sezione.",
        };
    }

    // Side-effect phase for diagnostics. Today we log to console; if NEX later adds
    // FE telemetry/Sentry, this is the correct integration point.
    componentDidCatch(error: unknown, info: React.ErrorInfo) {
        console.error("MEPA workspace tab render failed", {
            tab: this.props.tab,
            error,
            componentStack: info.componentStack,
        });
    }

    // Changing tab should give the new tab a clean render attempt. Without this reset
    // a failed Products tab would keep the Dossier tab hidden behind the old error.
    componentDidUpdate(prevProps: WorkspaceTabErrorBoundaryProps) {
        if (prevProps.tab !== this.props.tab && this.state.hasError) {
            this.setState({ hasError: false, message: null });
        }
    }

    // Manual retry lets the user recover after transient lazy-load or render errors
    // without losing the current tender/workspace context.
    private handleRetry = () => {
        this.setState({ hasError: false, message: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div
                role="alert"
                className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-red-900 shadow-sm dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-100 sm:p-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-200">
                            <FiAlertTriangle />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-bold">La sezione MEPA non e' stata renderizzata correttamente.</p>
                            <p className="mt-1 text-sm leading-6 text-red-800/80 dark:text-red-100/75">
                                Il workspace resta disponibile: cambia tab oppure riprova il render della sezione corrente. Questo boundary evita che un errore locale blocchi l'intera gara.
                            </p>
                            {this.state.message ? (
                                <p className="mt-3 break-words rounded-2xl bg-white/70 px-3 py-2 font-mono text-xs text-red-700 dark:bg-red-950/30 dark:text-red-100">
                                    {this.state.message}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={this.handleRetry}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100 dark:hover:bg-red-950/50"
                    >
                        <FiRefreshCw />
                        Riprova
                    </button>
                </div>
            </div>
        );
    }
}
