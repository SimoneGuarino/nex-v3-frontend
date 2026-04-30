// src/components/UI/panels/customersPanel/components/Fido.tsx
import React from "react";

type AnyRecord = Record<string, any>;

function cn(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function formatCurrency(val: any): string {
    const n = Number(val);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function cleanStr(val: any): string {
    const s = String(val ?? "").replace(/\s+/g, " ").trim();
    return s || "-";
}

const KV: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{k}</span>
        <span className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100 text-right break-words max-w-[65%]">
            {v}
        </span>
    </div>
);

function getFidiBlock(creditsProfile: AnyRecord | null, key: "Focelda" | "IOT") {
    const f = creditsProfile?.Fidi?.[key];
    if (!f) return null;

    const det = f?.Dettagli ?? {};
    const tipi = f?.Tipi ?? {};
    const assicurato = tipi?.Assicurato ?? null;

    return {
        saldo: det?.SaldoCliente,
        aScadere: det?.AScadere,
        scaduto: det?.Scaduto,
        insoluti: det?.Insoluti,
        fidoTotale: f?.FidoTotale,
        fidoResiduo: f?.FidoResiduo,
        assicuratoValore: assicurato?.Valore,
        assicuratoEsito: assicurato?.Esito,
        assicuratoScadenza: assicurato?.Scadenza,
        valoreOC: f?.Valori?.ValoreOC,
        valoreFB: f?.Valori?.ValoreFB,
    };
}

export const Fido: React.FC<{
    mode: "summary" | "details";
    creditsProfile: AnyRecord | null;
    onOpenDetails?: () => void;
}> = ({ mode, creditsProfile, onOpenDetails }) => {
    const isSummary = mode === "summary";

    const rating = creditsProfile?.Generale?.Rating ?? null;
    const ratingDesc = creditsProfile?.Generale?.DescrizioneRating ?? null;
    const limiteCredito = creditsProfile?.Generale?.LimiteCredito ?? null;

    const foc = getFidiBlock(creditsProfile, "Focelda");
    const iot = getFidiBlock(creditsProfile, "IOT");

    // nel summary vogliamo pochissimo: limite credito + saldo/residuo focelda + rating
    const focSaldo = foc?.saldo ?? null;
    const focResiduo = foc?.fidoResiduo ?? null;

    return (
        <div
            className={cn(
                "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80",
                "bg-white/80 dark:bg-neutral-900/60 shadow-sm",
                isSummary ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition" : "",
            )}
            onClick={() => isSummary && onOpenDetails?.()}
            role={isSummary ? "button" : undefined}
            tabIndex={isSummary ? 0 : undefined}
            onKeyDown={(e) => {
                if (!isSummary) return;
                if (e.key === "Enter" || e.key === " ") onOpenDetails?.();
            }}
        >
            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                        <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">Fido</h3>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {isSummary ? "Sintesi esposizione e rating" : "Dettaglio esposizione, tipi fido e assicurazione"}
                    </p>
                </div>

                {isSummary && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetails?.();
                        }}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                    >
                        <span>Dettagli</span>
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {isSummary ? (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200">
                                limite credito: <span className="ml-1 font-semibold">{formatCurrency(limiteCredito)}</span>
                            </span>

                            {rating != null && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    rating: <span className="ml-1 font-semibold">{cleanStr(rating)}</span>
                                </span>
                            )}

                            {ratingDesc && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    {cleanStr(ratingDesc)}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">saldo focelda</p>
                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    {formatCurrency(focSaldo)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">residuo focelda</p>
                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    {formatCurrency(focResiduo)}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200">
                                limite credito: <span className="ml-1 font-semibold">{formatCurrency(limiteCredito)}</span>
                            </span>

                            {rating != null && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    rating: <span className="ml-1 font-semibold">{cleanStr(rating)}</span>
                                </span>
                            )}

                            {ratingDesc && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    {cleanStr(ratingDesc)}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* focelda */}
                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h4 className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">focelda</h4>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                        totale: <span className="ml-1 font-semibold">{formatCurrency(foc?.fidoTotale)}</span>
                                    </span>
                                </div>

                                {foc ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">saldo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrency(foc.saldo)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">residuo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrency(foc.fidoResiduo)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                            <KV k="a scadere" v={formatCurrency(foc.aScadere)} />
                                            <KV k="scaduto" v={formatCurrency(foc.scaduto)} />
                                            <KV k="insoluti" v={formatCurrency(foc.insoluti)} />
                                        </div>

                                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                            <KV k="assicurato" v={formatCurrency(foc.assicuratoValore)} />
                                            <KV k="esito" v={cleanStr(foc.assicuratoEsito)} />
                                            <KV k="scadenza" v={cleanStr(foc.assicuratoScadenza)} />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                OC: <span className="ml-1 font-semibold">{formatCurrency(foc.valoreOC)}</span>
                                            </span>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                FB: <span className="ml-1 font-semibold">{formatCurrency(foc.valoreFB)}</span>
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Dati non disponibili.</p>
                                )}
                            </div>

                            {/* iot */}
                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h4 className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">iot</h4>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                        totale: <span className="ml-1 font-semibold">{formatCurrency(iot?.fidoTotale)}</span>
                                    </span>
                                </div>

                                {iot ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">saldo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrency(iot.saldo)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">residuo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrency(iot.fidoResiduo)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                                            <KV k="a scadere" v={formatCurrency(iot.aScadere)} />
                                            <KV k="scaduto" v={formatCurrency(iot.scaduto)} />
                                            <KV k="insoluti" v={formatCurrency(iot.insoluti)} />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                OC: <span className="ml-1 font-semibold">{formatCurrency(iot.valoreOC)}</span>
                                            </span>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                FB: <span className="ml-1 font-semibold">{formatCurrency(iot.valoreFB)}</span>
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Dati non disponibili.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
