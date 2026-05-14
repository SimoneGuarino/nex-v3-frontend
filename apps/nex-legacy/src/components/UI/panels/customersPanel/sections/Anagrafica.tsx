import React from "react";
import type { AnyRecord, PanelMode } from "../types";
import {
    formatYyyymmddToItalian,
    isEmptyValue,
    pickFirstNonEmpty,
    toDisplayText,
} from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

export const Anagrafica: React.FC<{
    mode: PanelMode;
    anagrafica: AnyRecord | null;
    creditsProfile?: AnyRecord | null;
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

    const ragione = toDisplayText(pickFirstNonEmpty(cAna.RagioneSociale, anagrafica.RAGIONE_SOCIALE));
    const piva = toDisplayText(pickFirstNonEmpty(cAna.PartitaIVA, anagrafica.PARTITA_IVA));
    const cf = toDisplayText(pickFirstNonEmpty(cAna.CodiceFiscale, anagrafica.CODICE_FISCALE));

    const indirizzo = toDisplayText(cAna.Indirizzo);
    const provincia = toDisplayText(cAna.Provincia);
    const nazione = toDisplayText(cAna.Nazione);

    const telefono = toDisplayText(cAna.Telefono);
    const pec = toDisplayText(cAna.PecEmail);

    const dipendenti = pickFirstNonEmpty(cAna.Dipendenti, null);
    const forma = toDisplayText(cAna.FormaGiuridica);
    const costituzione = toDisplayText(cAna.Costituzione);
    const statoSoc = toDisplayText(cAna.Stato);
    const canale = toDisplayText(cAna.Canale);

    const codiceCliente = toDisplayText(pickFirstNonEmpty(cAna.CodiceCliente, anagrafica.CODICE_CLIENTE));
    const codiceIot = toDisplayText(cAna.CodiceClienteIOT);
    const gruppo = toDisplayText(cAna.Gruppo);

    const statoAmm = toDisplayText(anagrafica.STATO_AMMINISTRATIVO);
    const statoComm = toDisplayText(anagrafica.STATO_COMMERCIALE);

    const lastContact = formatYyyymmddToItalian(anagrafica.DATA_ULTIMO_CONTATTO);
    const lastContactDesc = toDisplayText(anagrafica.DESCR_ULTIMO_CONTATTO);

    const statoTone: "neutral" | "ok" | "warn" =
        statoSoc && statoSoc !== "-" && /attiv/i.test(statoSoc) ? "ok" : statoSoc && statoSoc !== "-" ? "warn" : "neutral";

    return (
        <SectionContainer clickable={false} onActivate={onOpenDetails} dataTour="scheda-cliente-anagrafica">
            <SectionHeader
                title="Anagrafica"
                description={
                    isSummary
                        ? "Sede, contatti e identificativi"
                        : "Dettaglio completo (azienda, sede, contatti, canale, gruppo)"
                }
                rightContent={
                    isSummary ? (
                        <SectionActionButton
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenDetails?.();
                            }}
                            rightIcon={FaPlus({})}
                        >
                            <span>Dettagli</span>
                        </SectionActionButton>
                    ) : null
                }
            />

            <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <SectionPill>
                        codice: <span className="ml-1 font-semibold">{codiceCliente}</span>
                    </SectionPill>
                    {statoSoc && statoSoc !== "-" && (
                        <SectionPill tone={statoTone}>
                            stato: <span className="ml-1 font-semibold">{statoSoc}</span>
                        </SectionPill>
                    )}
                    {canale && canale !== "-" && (
                        <SectionPill>
                            canale: <span className="ml-1 font-semibold">{canale}</span>
                        </SectionPill>
                    )}
                </div>

                {isSummary ? (
                    <>
                        <SectionBlock contentClassName="space-y-2">
                            <SectionKeyValue k="Ragione sociale" v={ragione} />
                            <SectionKeyValue k="Partita IVA" v={piva} />
                            <SectionKeyValue k="Codice fiscale" v={cf} />
                            <SectionKeyValue
                                k="Sede"
                                v={
                                    indirizzo !== "-"
                                        ? `${indirizzo}${provincia !== "-" ? ` (${provincia})` : ""}${nazione !== "-" ? ` | ${nazione}` : ""}`
                                        : "-"
                                }
                            />
                        </SectionBlock>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <SectionBlock title="contatti" className="bg-white/70 dark:bg-neutral-900/40" contentClassName="space-y-2">
                                <SectionKeyValue k="Telefono" v={telefono} />
                                <SectionKeyValue k="PEC" v={pec} />
                            </SectionBlock>

                            <SectionBlock title="stati interni" className="bg-white/70 dark:bg-neutral-900/40">
                                <div className="flex flex-wrap gap-2">
                                    <SectionPill>amm.: <span className="ml-1 font-semibold">{statoAmm}</span></SectionPill>
                                    <SectionPill>comm.: <span className="ml-1 font-semibold">{statoComm}</span></SectionPill>
                                </div>
                            </SectionBlock>
                        </div>
                    </>
                ) : (
                    <>
                        <SectionBlock title="identificativi" contentClassName="space-y-2">
                            <SectionKeyValue k="Ragione sociale" v={ragione} />
                            <SectionKeyValue k="Codice cliente" v={codiceCliente} />
                            <SectionKeyValue k="Codice cliente iot" v={codiceIot} />
                            <SectionKeyValue k="Gruppo" v={gruppo} />
                            <SectionKeyValue k="Partita IVA" v={piva} />
                            <SectionKeyValue k="Codice fiscale" v={cf} />
                        </SectionBlock>

                        <SectionBlock title="sede e contatti" contentClassName="space-y-2">
                            <SectionKeyValue k="Indirizzo" v={indirizzo} />
                            <SectionKeyValue k="Provincia" v={provincia} />
                            <SectionKeyValue k="Nazione" v={nazione} />
                            <SectionKeyValue k="Telefono" v={telefono} />
                            <SectionKeyValue k="PEC" v={pec} />
                        </SectionBlock>

                        <SectionBlock title="azienda" contentClassName="space-y-2">
                            <SectionKeyValue k="Forma giuridica" v={forma} />
                            <SectionKeyValue k="Costituzione" v={costituzione} />
                            <SectionKeyValue k="Dipendenti" v={!isEmptyValue(dipendenti) ? String(dipendenti) : "-"} />
                            <SectionKeyValue k="Canale" v={canale} />
                            <SectionKeyValue k="Stato" v={statoSoc} />
                        </SectionBlock>

                        <SectionBlock title="stati e attivita interne" contentClassName="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                <SectionPill>amm.: <span className="ml-1 font-semibold">{statoAmm}</span></SectionPill>
                                <SectionPill>comm.: <span className="ml-1 font-semibold">{statoComm}</span></SectionPill>
                            </div>
                            <div className="pt-1">
                                <SectionKeyValue k="Ultimo contatto" v={lastContact} />
                                <SectionKeyValue k="Descrizione" v={lastContactDesc} />
                            </div>
                        </SectionBlock>
                    </>
                )}
            </div>
        </SectionContainer>
    );
};
