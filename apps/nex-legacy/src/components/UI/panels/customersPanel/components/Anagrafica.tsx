import React from "react";

type AnyRecord = Record<string, any>;

function cn(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function cleanStr(val: any): string {
    const s = String(val ?? "").replace(/\s+/g, " ").trim();
    return s || "-";
}

function isEmpty(v: any) {
    return v === null || v === undefined || String(v).trim() === "";
}

function pickFirst(...vals: any[]) {
    for (const v of vals) if (!isEmpty(v)) return v;
    return null;
}

function formatYyyymmdd(val: any): string {
    const s = String(val ?? "").trim();
    if (!/^\d{8}$/.test(s)) return s || "-";
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    return `${d}/${m}/${y}`;
}

const KV: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{k}</span>
        <span className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100 text-right break-words max-w-[65%]">
            {v}
        </span>
    </div>
);

const Pill: React.FC<{ tone?: "neutral" | "ok" | "warn"; children: React.ReactNode }> = ({
    tone = "neutral",
    children,
}) => {
    const cls =
        tone === "ok"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200"
            : tone === "warn"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300";

    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium", cls)}>
            {children}
        </span>
    );
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
            {title}
        </p>
        <div className="mt-2 space-y-2">{children}</div>
    </div>
);

export const Anagrafica: React.FC<{
    mode: "summary" | "details";
    anagrafica: AnyRecord | null; // customers/anagrafica
    creditsProfile?: AnyRecord | null; // gt-cpd
    onOpenDetails?: () => void;
}> = ({ mode, anagrafica, creditsProfile = null, onOpenDetails }) => {
    if (!anagrafica) {
        return (
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 p-4">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Dati anagrafica non disponibili.</p>
            </div>
        );
    }

    const isSummary = mode === "summary";

    const cAna = creditsProfile?.Anagrafica ?? {};

    // preferisci sempre gt-cpd se presente (più completo e già pulito)
    const ragione = cleanStr(pickFirst(cAna.RagioneSociale, anagrafica.RAGIONE_SOCIALE));
    const piva = cleanStr(pickFirst(cAna.PartitaIVA, anagrafica.PARTITA_IVA));
    const cf = cleanStr(pickFirst(cAna.CodiceFiscale, anagrafica.CODICE_FISCALE));

    const indirizzo = cleanStr(cAna.Indirizzo);
    const provincia = cleanStr(cAna.Provincia);
    const nazione = cleanStr(cAna.Nazione);

    const telefono = cleanStr(cAna.Telefono);
    const pec = cleanStr(cAna.PecEmail);

    const dipendenti = pickFirst(cAna.Dipendenti, null);
    const forma = cleanStr(cAna.FormaGiuridica);
    const costituzione = cleanStr(cAna.Costituzione);
    const statoSoc = cleanStr(cAna.Stato);
    const canale = cleanStr(cAna.Canale);

    const codiceCliente = cleanStr(pickFirst(cAna.CodiceCliente, anagrafica.CODICE_CLIENTE));
    const codiceIot = cleanStr(cAna.CodiceClienteIOT);
    const gruppo = cleanStr(cAna.Gruppo);

    const statoAmm = cleanStr(anagrafica.STATO_AMMINISTRATIVO);
    const statoComm = cleanStr(anagrafica.STATO_COMMERCIALE);

    const lastContact = formatYyyymmdd(anagrafica.DATA_ULTIMO_CONTATTO);
    const lastContactDesc = cleanStr(anagrafica.DESCR_ULTIMO_CONTATTO);

    // tone stato azienda
    const statoTone =
        statoSoc && statoSoc !== "-" && /attiv/i.test(statoSoc) ? "ok" : statoSoc && statoSoc !== "-" ? "warn" : "neutral";

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
                        <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">Anagrafica</h3>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {isSummary ? "Sede, contatti e identificativi" : "Dettaglio completo (azienda, sede, contatti, canale, gruppo)"}
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
                {/* header pills (sia summary che details) */}
                <div className="flex flex-wrap items-center gap-2">
                    <Pill>
                        codice: <span className="ml-1 font-semibold">{codiceCliente}</span>
                    </Pill>
                    {statoSoc && statoSoc !== "-" && (
                        <Pill tone={statoTone as any}>
                            stato: <span className="ml-1 font-semibold">{statoSoc}</span>
                        </Pill>
                    )}
                    {canale && canale !== "-" && (
                        <Pill>
                            canale: <span className="ml-1 font-semibold">{canale}</span>
                        </Pill>
                    )}
                </div>

                {/* summary: più completa ma compatta */}
                {isSummary ? (
                    <>
                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3 space-y-2">
                            <KV k="Ragione sociale" v={ragione} />
                            <KV k="Partita IVA" v={piva} />
                            <KV k="Codice fiscale" v={cf} />
                            <KV
                                k="Sede"
                                v={
                                    indirizzo !== "-"
                                        ? `${indirizzo}${provincia !== "-" ? ` (${provincia})` : ""}${nazione !== "-" ? ` · ${nazione}` : ""}`
                                        : "-"
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-3 space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                    contatti
                                </p>
                                <KV k="Telefono" v={telefono} />
                                <KV k="PEC" v={pec} />
                            </div>

                            <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-3 space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                    stati interni
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Pill>amm.: <span className="ml-1 font-semibold">{statoAmm}</span></Pill>
                                    <Pill>comm.: <span className="ml-1 font-semibold">{statoComm}</span></Pill>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* details: completo */
                    <>
                        <Card title="identificativi">
                            <KV k="Ragione sociale" v={ragione} />
                            <KV k="Codice cliente" v={codiceCliente} />
                            <KV k="Codice cliente iot" v={codiceIot} />
                            <KV k="Gruppo" v={gruppo} />
                            <KV k="Partita IVA" v={piva} />
                            <KV k="Codice fiscale" v={cf} />
                        </Card>

                        <Card title="sede e contatti">
                            <KV k="Indirizzo" v={indirizzo} />
                            <KV k="Provincia" v={provincia} />
                            <KV k="Nazione" v={nazione} />
                            <KV k="Telefono" v={telefono} />
                            <KV k="PEC" v={pec} />
                        </Card>

                        <Card title="azienda">
                            <KV k="Forma giuridica" v={forma} />
                            <KV k="Costituzione" v={costituzione} />
                            <KV k="Dipendenti" v={!isEmpty(dipendenti) ? String(dipendenti) : "-"} />
                            <KV k="Canale" v={canale} />
                            <KV k="Stato" v={statoSoc} />
                        </Card>

                        <Card title="stati e attività interne">
                            <div className="flex flex-wrap gap-2">
                                <Pill>amm.: <span className="ml-1 font-semibold">{statoAmm}</span></Pill>
                                <Pill>comm.: <span className="ml-1 font-semibold">{statoComm}</span></Pill>
                            </div>
                            <div className="pt-1">
                                <KV k="Ultimo contatto" v={lastContact} />
                                <KV k="Descrizione" v={lastContactDesc} />
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};
