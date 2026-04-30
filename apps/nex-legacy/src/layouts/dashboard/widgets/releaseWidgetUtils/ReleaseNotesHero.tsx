import React from "react";
import type { ReleaseNote as RN } from "examples/Navbars/components/release/fetchdata/getReleaseNotes";
import { resolveAnteprimaUrl } from "./resolveAnteprimaUrl";

/**
 * Header grafico del widget Release Notes.
 * - Background di default sempre presente.
 * - Se "anteprima" esiste, la sovrappone sopra il preset.
 * - Prova a stimare se l'immagine è chiara/scura per scegliere testo e overlay.
 * - Se la lettura pixel fallisce (CORS / http esterno), fallback: testo bianco + overlay scuro.
 */


// Normalizza la luminanza in [0..1] nel caso arrivino valori fuori range per errori/edge-case.
function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

/** calcolo luminanza media (0..1) campionando una versione downscale dell'immagine */
async function computeImageLuminance(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        // Serve SOLO se il server dell'immagine manda CORS headers (Access-Control-Allow-Origin)
        // Nota: senza CORS l'immagine può comunque essere usata come background,
        // ma getImageData fallirà (canvas "tainted") e andremo in fallback.
        img.crossOrigin = "anonymous";

        img.onload = () => {
            try {
                const w = 64;
                const h = 64;

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;

                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("no-canvas-context"));

                ctx.drawImage(img, 0, 0, w, h);

                const data = ctx.getImageData(0, 0, w, h).data;

                // luminanza percepita: Rec. 709
                let sum = 0;
                const pxCount = w * h;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;
                    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
                }

                resolve(sum / pxCount);
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = () => reject(new Error("img-load-failed"));
        img.src = url;
    });
}

export default function ReleaseNotesHero({
    release,
    loading,
}: {
    release: RN | null;
    loading: boolean;
}) {
    const MONTHS_IT = [
        "GENNAIO",
        "FEBBRAIO",
        "MARZO",
        "APRILE",
        "MAGGIO",
        "GIUGNO",
        "LUGLIO",
        "AGOSTO",
        "SETTEMBRE",
        "OTTOBRE",
        "NOVEMBRE",
        "DICEMBRE",
    ] as const;

    const heroDateLabel =
        release?.dataCreazione instanceof Date &&
            !Number.isNaN(release.dataCreazione.getTime())
            ? `${String(release.dataCreazione.getDate()).padStart(2, "0")}_${MONTHS_IT[release.dataCreazione.getMonth()]
            }_${release.dataCreazione.getFullYear()}`
            : null;

    const version = release?.versione ? `v${release.versione}` : null;

    const bgUrl = resolveAnteprimaUrl(release?.anteprima ?? null);
    const hasBg = bgUrl.trim().length > 0;

    // --- auto contrast ---
    // "light" => testo scuro + overlay chiaro
    // "dark"  => testo chiaro + overlay scuro
    // default: dark (così non rompi in caso CORS)
    const [tone, setTone] = React.useState<"dark" | "light">("dark");

    React.useEffect(() => {
        // Evita setState dopo un unmount o dopo un cambio rapido di bgUrl (race condition).
        let cancelled = false;

        // Se non ho immagine, il preset è già dark-friendly: resta dark.
        if (!hasBg) {
            setTone("dark");
            return;
        }

        // Se ho immagine, provo a stimare luminanza.
        (async () => {
            try {
                const lum = clamp01(await computeImageLuminance(bgUrl));
                // soglia semplice (puoi tararla): >0.6 = immagine “chiara”
                const next: "dark" | "light" = lum > 0.6 ? "light" : "dark";
                if (!cancelled) setTone(next);
            } catch {
                // fallback: non posso leggere pixel (CORS/http esterno) o errore load
                if (!cancelled) setTone("dark");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [bgUrl, hasBg]);

    const isLight = tone === "light";

    // classi testo
    const titleTextClass = isLight ? "text-black" : "text-white";
    const metaTextClass = isLight ? "text-black/90" : "text-white";
    const badgeClass = isLight
        ? "bg-black text-white"
        : "bg-teal-600 text-white";

    // overlay: se immagine è chiara metto overlay chiaro leggero,
    // se scura overlay scuro come prima (serve a stabilizzare leggibilità)
    const overlayClass = isLight
        ? "bg-gradient-to-r from-white/55 via-white/25 to-white/10"
        : "bg-gradient-to-r from-black/55 via-black/25 to-black/10";

    return (
        <div className="relative h-full min-h-[150px] overflow-hidden rounded-t-2xl">
            {/* 1) preset di default SEMPRE presente */}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950" />
            <div className="absolute -top-15 -right-60 h-[220px] w-[380px] bg-teal-600 rotate-40 skew-x-[-12deg]" />

            {/* 2) immagine sopra al preset (se fallisce resta preset) */}
            {hasBg && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}

            {/* 3) overlay dinamico per leggibilità */}
            <div className={`absolute inset-0 ${overlayClass}`} />

            {/* contenuto */}
            <div className="relative h-full p-3 flex flex-col">
                <div className="mt-auto">
                    <div
                        className={[
                            titleTextClass,
                            "font-black tracking-tight",
                            "text-[26px] leading-[1.02]",
                            "drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
                            "translate-y-[-10px]",
                        ].join(" ")}
                    >
                        Release notes
                        {version && (
                            <span
                                className={[
                                    "font-semibold text-sm rounded-full py-1 px-2 ms-2 opacity-95",
                                    badgeClass,
                                ].join(" ")}
                            >
                                {version}
                            </span>
                        )}
                    </div>

                    <div
                        className={[
                            metaTextClass,
                            "text-[11px] font-extrabold tracking-[0.28em]",
                        ].join(" ")}
                    >
                        {heroDateLabel ?? (loading ? "" : "RELEASE NOTES")}
                    </div>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 grid place-items-center">
                    <div className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-[11px] text-white/90 backdrop-blur">
                        Caricamento…
                    </div>
                </div>
            )}
        </div>
    );
}
