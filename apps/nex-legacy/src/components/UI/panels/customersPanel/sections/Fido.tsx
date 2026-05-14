import React from "react";
import type { AnyRecord, PanelMode } from "../types";
import { formatCurrencyIt, toDisplayText } from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

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
    mode: PanelMode;
    creditsProfile: AnyRecord | null;
    onOpenDetails?: () => void;
}> = ({ mode, creditsProfile, onOpenDetails }) => {
    const isSummary = mode === "summary";

    const rating = creditsProfile?.Generale?.Rating ?? null;
    const ratingDesc = creditsProfile?.Generale?.DescrizioneRating ?? null;
    const limiteCredito = creditsProfile?.Generale?.LimiteCredito ?? null;

    const foc = getFidiBlock(creditsProfile, "Focelda");
    const iot = getFidiBlock(creditsProfile, "IOT");

    const focSaldo = foc?.saldo ?? null;
    const focResiduo = foc?.fidoResiduo ?? null;

    return (
        <SectionContainer clickable={false} onActivate={onOpenDetails} dataTour="scheda-cliente-fido">
            <SectionHeader
                title="Fido"
                description={isSummary ? "Sintesi esposizione e rating" : "Dettaglio esposizione, tipi fido e assicurazione"}
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
                {isSummary ? (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <SectionPill tone="ok">
                                limite credito: <span className="ml-1 font-semibold">{formatCurrencyIt(limiteCredito)}</span>
                            </SectionPill>

                            {rating != null && (
                                <SectionPill>
                                    rating: <span className="ml-1 font-semibold">{toDisplayText(rating)}</span>
                                </SectionPill>
                            )}

                            {ratingDesc && <SectionPill>{toDisplayText(ratingDesc)}</SectionPill>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <SectionBlock>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">saldo focelda</p>
                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    {formatCurrencyIt(focSaldo)}
                                </p>
                            </SectionBlock>
                            <SectionBlock>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">residuo focelda</p>
                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    {formatCurrencyIt(focResiduo)}
                                </p>
                            </SectionBlock>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            <SectionPill tone="ok">
                                limite credito: <span className="ml-1 font-semibold">{formatCurrencyIt(limiteCredito)}</span>
                            </SectionPill>

                            {rating != null && (
                                <SectionPill>
                                    rating: <span className="ml-1 font-semibold">{toDisplayText(rating)}</span>
                                </SectionPill>
                            )}

                            {ratingDesc && <SectionPill>{toDisplayText(ratingDesc)}</SectionPill>}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h4 className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">focelda</h4>
                                    <SectionPill>
                                        totale: <span className="ml-1 font-semibold">{formatCurrencyIt(foc?.fidoTotale)}</span>
                                    </SectionPill>
                                </div>

                                {foc ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <SectionBlock>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">saldo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrencyIt(foc.saldo)}
                                                </p>
                                            </SectionBlock>
                                            <SectionBlock>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">residuo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrencyIt(foc.fidoResiduo)}
                                                </p>
                                            </SectionBlock>
                                        </div>

                                        <SectionBlock contentClassName="space-y-2">
                                            <SectionKeyValue k="a scadere" v={formatCurrencyIt(foc.aScadere)} />
                                            <SectionKeyValue k="scaduto" v={formatCurrencyIt(foc.scaduto)} />
                                            <SectionKeyValue k="insoluti" v={formatCurrencyIt(foc.insoluti)} />
                                        </SectionBlock>

                                        <SectionBlock contentClassName="space-y-2">
                                            <SectionKeyValue k="assicurato" v={formatCurrencyIt(foc.assicuratoValore)} />
                                            <SectionKeyValue k="esito" v={toDisplayText(foc.assicuratoEsito)} />
                                            <SectionKeyValue k="scadenza" v={toDisplayText(foc.assicuratoScadenza)} />
                                        </SectionBlock>

                                        <div className="flex flex-wrap gap-2">
                                            <SectionPill>OC: <span className="ml-1 font-semibold">{formatCurrencyIt(foc.valoreOC)}</span></SectionPill>
                                            <SectionPill>FB: <span className="ml-1 font-semibold">{formatCurrencyIt(foc.valoreFB)}</span></SectionPill>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Dati non disponibili.</p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <h4 className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">iot</h4>
                                    <SectionPill>
                                        totale: <span className="ml-1 font-semibold">{formatCurrencyIt(iot?.fidoTotale)}</span>
                                    </SectionPill>
                                </div>

                                {iot ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <SectionBlock>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">saldo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrencyIt(iot.saldo)}
                                                </p>
                                            </SectionBlock>
                                            <SectionBlock>
                                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">residuo</p>
                                                <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {formatCurrencyIt(iot.fidoResiduo)}
                                                </p>
                                            </SectionBlock>
                                        </div>

                                        <SectionBlock contentClassName="space-y-2">
                                            <SectionKeyValue k="a scadere" v={formatCurrencyIt(iot.aScadere)} />
                                            <SectionKeyValue k="scaduto" v={formatCurrencyIt(iot.scaduto)} />
                                            <SectionKeyValue k="insoluti" v={formatCurrencyIt(iot.insoluti)} />
                                        </SectionBlock>

                                        <div className="flex flex-wrap gap-2">
                                            <SectionPill>OC: <span className="ml-1 font-semibold">{formatCurrencyIt(iot.valoreOC)}</span></SectionPill>
                                            <SectionPill>FB: <span className="ml-1 font-semibold">{formatCurrencyIt(iot.valoreFB)}</span></SectionPill>
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
        </SectionContainer>
    );
};
