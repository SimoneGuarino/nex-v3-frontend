import React from "react";
import LatestRelease from "examples/Navbars/components/release/LatestRelease";
import {
    LoadLatestReleaseNoteAPI,
    normalizeReleaseNoteDates,
    type ReleaseNote as RN,
} from "examples/Navbars/components/release/fetchdata/getReleaseNotes";
import { FDButton } from "@nex/fd-ui";
import ReleaseNotesHero from "./releaseWidgetUtils/ReleaseNotesHero";

/**
 * Widget "Release notes"
 * 1) carica la release pubblica più recente (/release_notes/latest)
 * 2) mostra una preview (hero + titolo + descrizione breve)
 * 3) al click apre la lettura completa (LatestRelease)
 */

export default function ReleaseNotesWidget() {
    const [openLatestNotes, setOpenLatestNotes] = React.useState(false);

    const [loading, setLoading] = React.useState(true);
    const [release, setRelease] = React.useState<RN | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const abort = new AbortController();

        setLoading(true);
        setError(null);

        LoadLatestReleaseNoteAPI({
            abortLike: abort,
            onComplete: (data) => {
                const parsed = data ? (normalizeReleaseNoteDates(data) as RN) : null;
                setRelease(parsed);
                setLoading(false);
            },
            onError: () => {
                setError("Impossibile caricare le release notes.");
                setRelease(null);
                setLoading(false);
            },
        });

        return () => abort.abort();
    }, []);

    const canOpen = !loading;
    const title = release?.titolo?.trim() || "Release notes";
    const desc = release?.descrizione?.trim() || "";

    function truncate(text: string, maxLength: number) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength).trimEnd() + "…";
    };
    const shortDesc = desc ? truncate(desc, 103) : "";

    return (
        <>
            <div className="h-full flex flex-col gap-3
                rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-neutral-900/40">
                <ReleaseNotesHero release={release} loading={loading} />

                <div className="p-3 flex flex-col">
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                        {title}
                    </h4>

                    {error ? (
                        <div className="mt-2 text-xs text-red-600/90 dark:text-red-300">{error}</div>
                    ) : (
                        <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3">
                            {shortDesc || (!loading ? "Apri per leggere i dettagli della release." : "")}
                        </p>
                    )}

                    <FDButton
                        type="button"
                        color="none"
                        onClick={() => canOpen && setOpenLatestNotes(true)}
                        disabled={!canOpen}
                        variant="solid"
                        className={[
                            "w-fit mt-3 text-xs text-left font-semibold bg-teal-600 text-white",
                            "focus:outline-none",
                            "disabled:cursor-not-allowed disabled:opacity-70",
                        ].join(" ")}
                        title="Apri ultimo rilascio"
                    >
                        Leggi
                    </FDButton>
                </div>
            </div>

            {openLatestNotes && <LatestRelease onClose={() => setOpenLatestNotes(false)} />}
        </>
    );
}
