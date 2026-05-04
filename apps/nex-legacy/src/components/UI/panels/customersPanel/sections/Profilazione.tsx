import React, { useEffect, useState } from "react";
import FDSwitch from "components/UI/input/FDSwitch";
import FDButton from "components/UI/buttons/FDButton";
import { enqueueSnackbar } from "components/MessageBox";
import { TbLock, TbLockOpen2 } from "react-icons/tb";
import { BsBookmarkCheck } from "react-icons/bs";
import { useProfilazioneForm } from "../hooks/useProfilazioneForm";
import type { AnyRecord, PanelMode } from "../types";
import { cn } from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionContainer,
    SectionHeader,
    SectionPill,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
    <SectionPill tone={active ? "ok" : "neutral"}>
        {active ? "Attivo" : "Disattivo"}
    </SectionPill>
);

type SettingSubSwitch = {
    id: string;
    title: string;
    description?: string;
    disabled?: boolean;
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel: string;
};

type SettingTextarea = {
    id: string;
    name: string;
    label: string;
    disabled?: boolean;
    placeholder?: string;
    value: string;
    onChange: (next: string) => void;
};

type ProfilazioneSettingProps = {
    title: string;
    description?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel: string;
    textarea?: SettingTextarea;
    disabled?: boolean;
    subSwitches?: SettingSubSwitch[];
};

const ProfilazioneSetting: React.FC<ProfilazioneSettingProps> = ({
    title,
    description,
    checked,
    onChange,
    ariaLabel,
    textarea,
    disabled,
    subSwitches = [],
}) => {
    return (
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-3 flex flex-col gap-2">
            <div className="flex w-full justify-between items-center gap-2">
                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                    {title}
                </p>

                <div className="shrink-0 flex items-center gap-2">
                    <StatusPill active={checked} />
                    <FDSwitch checked={checked} onChange={onChange} ariaLabel={ariaLabel} disabled={disabled} />
                </div>
            </div>

            {description && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {description}
                </p>
            )}

            {checked && textarea && (
                <div className="w-full mt-1 flex flex-col gap-1.5">
                    <label htmlFor={textarea.id} className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {textarea.label}
                    </label>
                    <textarea
                        id={textarea.id}
                        name={textarea.name}
                        value={textarea.value}
                        onChange={(e) => textarea.onChange(e.target.value)}
                        rows={4}
                        disabled={disabled}
                        placeholder={textarea.placeholder}
                        className={cn(
                            "w-full rounded-lg border px-3 py-2.5 text-[12px] leading-5",
                            "bg-white/95 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-100",
                            "border-neutral-300 dark:border-neutral-700",
                            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                            "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500",
                            "resize-y min-h-[96px] max-h-[120px] overflow-y-auto",
                        )}
                    />
                </div>
            )}

            {checked && subSwitches.length > 0 && (
                <div className="mt-1 flex flex-col gap-2">
                    {subSwitches.map((sub) => (
                        <div key={sub.id} className="rounded-lg border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/50 p-2.5 flex flex-col gap-1.5">
                            <div className="flex w-full justify-between items-center gap-2">
                                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    {sub.title}
                                </p>
                                <div className="shrink-0 flex items-center gap-2">
                                    <StatusPill active={sub.checked} />
                                    <FDSwitch checked={sub.checked} onChange={sub.onChange} ariaLabel={sub.ariaLabel} disabled={disabled} />
                                </div>
                            </div>
                            {sub.description && (
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    {sub.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Profilazione: React.FC<{
    mode: PanelMode;
    report?: AnyRecord | null;
    customerCode?: string | number;
    onSave?: (payload: AnyRecord) => Promise<any> | any;
    onOpenDetails?: () => void;
}> = ({ mode, report = null, customerCode, onSave, onOpenDetails }) => {
    const isSummary = mode === "summary";
    const [locked, setLocked] = useState(true);
    const [saving, setSaving] = useState(false);

    const {
        values,
        setMotivazioneCambioAgente,
        setTextProdottiNonTrattati,
        setTextModPagamento,
        setTextPrezziNonCompetitivi,
        setDiffEconomiche,
        setClienteRischioso,
        setClientNonRedditizio,
        setMargineMiglioramento,
        setClienteDiscontinuo,
        setProblemaResi,
        setProblemaTrasporto,
        setProblemiAmministrativi,
        handleCambioAgenteToggle,
        handleModPagamentoToggle,
        handleProdottiNonTrattatiToggle,
        handlePrezziNonCompetitiviToggle,
        buildSaveData,
    } = useProfilazioneForm(report);

    const {
        cambioAgente,
        motivazioneCambioAgente,
        diffEconomiche,
        clienteRischioso,
        prodottiNonTrattati,
        textProdottiNonTrattati,
        clientNonRedditizio,
        margineMiglioramento,
        prezziNonCompetitivi,
        textPrezziNonCompetitivi,
        problemaResi,
        problemaTrasporto,
        problemiAmministrativi,
        clienteDiscontinuo,
        modPagamento,
        textModPagamento,
    } = values;
    const formDisabled = locked || saving;

    const activeSummarySignals = React.useMemo(
        () =>
            [
                cambioAgente ? "Cambio agente" : null,
                modPagamento ? "Modifica pagamento" : null,
                diffEconomiche ? "Difficolta economiche" : null,
                clienteRischioso ? "Cliente rischioso" : null,
                prodottiNonTrattati ? "Prodotti non trattati" : null,
                clientNonRedditizio ? "Cliente non redditizio" : null,
                margineMiglioramento ? "Margine miglioramento" : null,
                prezziNonCompetitivi ? "Prezzi non competitivi" : null,
                problemaResi ? "Problema resi" : null,
                problemaTrasporto ? "Problema trasporto" : null,
                problemiAmministrativi ? "Problemi amministrativi" : null,
                clienteDiscontinuo ? "Cliente discontinuo" : null,
            ].filter((v): v is string => Boolean(v)),
        [
            cambioAgente,
            modPagamento,
            diffEconomiche,
            clienteRischioso,
            prodottiNonTrattati,
            clientNonRedditizio,
            margineMiglioramento,
            prezziNonCompetitivi,
            problemaResi,
            problemaTrasporto,
            problemiAmministrativi,
            clienteDiscontinuo,
        ]
    );
    const hasActiveSummarySignals = activeSummarySignals.length > 0;

    const handleSave = async () => {
        if (locked || saving) return;
        if (typeof onSave !== "function") {
            enqueueSnackbar("Salvataggio non disponibile", { title: "Attenzione", type: "warning" });
            return;
        }

        const { resolvedCustomerCode, missingText, payload } = buildSaveData(customerCode);

        if (!resolvedCustomerCode) {
            enqueueSnackbar("Codice cliente non valido", { title: "Ops..", type: "error" });
            return;
        }

        if (missingText.length) {
            enqueueSnackbar(`Compila i campi testuali: ${missingText.join(", ")}`, {
                title: "Attenzione",
                type: "warning",
            });
            return;
        }

        try {
            setSaving(true);
            const res = await onSave(payload);
            const operation = String((res as any)?.operation ?? "").toLowerCase();

            enqueueSnackbar(
                operation === "created"
                    ? "Profilazione creata correttamente"
                    : "Profilazione salvata correttamente",
                { title: "Ok", type: "success" }
            );
            setLocked(true);
        } catch (e: any) {
            if (e?.name === "AbortError") return;
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        setLocked(true);
    }, [customerCode]);

    return (
        <SectionContainer
            clickable={false}
            onActivate={onOpenDetails}
            className={
                isSummary && hasActiveSummarySignals
                    ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-300/45 dark:ring-amber-700/35 bg-amber-50/40 dark:bg-amber-950/10"
                    : ""
            }
            clickableClassName={
                isSummary && hasActiveSummarySignals
                    ? "cursor-pointer hover:bg-amber-50/70 dark:hover:bg-amber-950/25 transition"
                    : "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition"
            }
        >
            <SectionHeader
                title="Profilazione"
                description={isSummary ? "Scheda profilazione cliente" : "Dettaglio profilazione cliente"}
                dotClassName={isSummary && hasActiveSummarySignals ? "bg-amber-500 animate-pulse" : "bg-sky-500"}
                rightContent={
                    isSummary ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <SectionPill tone={hasActiveSummarySignals ? "warn" : "neutral"}>
                                {hasActiveSummarySignals
                                    ? activeSummarySignals.length === 1
                                        ? "1 report"
                                        : `${activeSummarySignals.length} report`
                                    : "Nessun campo valorizzato"}
                            </SectionPill>
                            <SectionActionButton
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenDetails?.();
                                }}
                                rightIcon={FaPlus({})}
                            >
                                <span>Dettagli</span>
                            </SectionActionButton>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <FDButton
                                variant={locked ? "soft" : "outline"}
                                color={locked ? "error" : "neutral"}
                                size="small"
                                radius="md"
                                onClick={() => setLocked((prev) => !prev)}
                                disabled={saving}
                                rightIcon={locked ? TbLockOpen2({}) : TbLock({})}
                            >
                                {locked ? "Sblocca" : "Blocca"}
                            </FDButton>

                            <FDButton
                                variant="solid"
                                color="success"
                                radius="md"
                                size="small"
                                loading={saving}
                                disabled={formDisabled || typeof onSave !== "function"}
                                onClick={handleSave}
                                rightIcon={BsBookmarkCheck({})}
                            >
                                Salva
                            </FDButton>
                        </div>
                    )
                }
            />

            <div className="p-4 space-y-3">
                {isSummary ? (
                    hasActiveSummarySignals ? (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-3">
                            <p className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">
                                Report con segnalazioni attive
                            </p>
                            <p className="mt-1 text-[11px] text-amber-800/90 dark:text-amber-200/90">
                                Sono presenti uno o piu campi valorizzati.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {activeSummarySignals.slice(0, 4).map((signal) => (
                                    <span
                                        key={signal}
                                        className="inline-flex items-center rounded-full border border-amber-300 dark:border-amber-700 px-2 py-[2px] text-[10px] font-medium text-amber-900 dark:text-amber-200 bg-white/75 dark:bg-amber-950/25"
                                    >
                                        {signal}
                                    </span>
                                ))}
                                {activeSummarySignals.length > 4 && (
                                    <span className="inline-flex items-center rounded-full border border-amber-300 dark:border-amber-700 px-2 py-[2px] text-[10px] font-medium text-amber-900 dark:text-amber-200 bg-white/75 dark:bg-amber-950/25">
                                        +{activeSummarySignals.length - 4} altri
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                            <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                Nessuna segnalazione attiva
                            </p>
                            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                Apri i dettagli per aggiornare la profilazione.
                            </p>
                        </div>
                    )
                ) : (
                    <>
                        {/* textarea */}
                        <ProfilazioneSetting
                            title="Cambio Agente"
                            disabled={formDisabled}
                            description="Abilita la richiesta di cambio agente per il cliente."
                            checked={cambioAgente}
                            onChange={handleCambioAgenteToggle}
                            ariaLabel="Profilazione - Cambio Agente"
                            textarea={{
                                id: "motivazioneCambioAgente",
                                name: "motivazioneCambioAgente",
                                label: "Inserisci il motivo della richiesta",
                                placeholder: "Scrivi qui la motivazione...",
                                value: motivazioneCambioAgente,
                                onChange: setMotivazioneCambioAgente,
                            }}
                        />

                        {/* textarea */}
                        <ProfilazioneSetting
                            title="Modifica Modalità Di Pagamento"
                            disabled={formDisabled}
                            description="Abilita se il cliente sta chiedendo di modificare la sua modalità di pagamento."
                            checked={modPagamento}
                            onChange={handleModPagamentoToggle}
                            ariaLabel="Profilazione - Modifica Pagamento"
                            textarea={{
                                id: "motivazioneModificaPagamento",
                                name: "motivazioneModificaPagamento",
                                label: "Descrivi la richiesta del cliente",
                                placeholder: "Scrivi qui la richiesta...",
                                value: textModPagamento,
                                onChange: setTextModPagamento,
                            }}
                        />

                        {/* subwitch */}
                        <ProfilazioneSetting
                            title="Difficolta Economiche"
                            disabled={formDisabled}
                            description="Segnala se il cliente ha difficolta economiche."
                            checked={diffEconomiche}
                            onChange={setDiffEconomiche}
                            ariaLabel="Profilazione - Difficolta Economiche"
                        />

                        <ProfilazioneSetting
                            title="Cliente Rischioso"
                            disabled={formDisabled}
                            description="Abilita se il cliente è rischioso."
                            ariaLabel="Profilazione - Cliente Rischioso"
                            checked={clienteRischioso}
                            onChange={setClienteRischioso}
                        />

                        <ProfilazioneSetting
                            title="Cliente Non Redditizio"
                            disabled={formDisabled}
                            description="Abilita se il cliente non è redditizio."
                            ariaLabel="Profilazione - Cliente Non Redditizio"
                            checked={clientNonRedditizio}
                            onChange={setClientNonRedditizio}
                        />

                        <ProfilazioneSetting
                            title="Margine Miglioramento"
                            disabled={formDisabled}
                            description="Abilita se il cliente ha del margine di miglioramento sul fatturato."
                            ariaLabel="Profilazione - Margine Miglioramento"
                            checked={margineMiglioramento}
                            onChange={setMargineMiglioramento}
                        />

                        <ProfilazioneSetting
                            title="Cliente Discontinuo"
                            disabled={formDisabled}
                            description="Abilita se il cliente effettua solo acquisti spot."
                            ariaLabel="Profilazione - Cliente Discontinuo"
                            checked={clienteDiscontinuo}
                            onChange={setClienteDiscontinuo}
                        />

                        {/* textarea */}
                        <ProfilazioneSetting
                            title="Prodotti Non Trattati"
                            disabled={formDisabled}
                            description="Abilita se il cliente è interessato a dei prodotti non trattati dall'azienda."
                            checked={prodottiNonTrattati}
                            onChange={handleProdottiNonTrattatiToggle}
                            ariaLabel="Profilazione - Prodotti Non Trattati"
                            textarea={{
                                id: "textProdottiNonTrattati",
                                name: "textProdottiNonTrattati",
                                label: "Descrivi a cosa è interessato il cliente.",
                                placeholder: "Scrivi qui i prodotti...",
                                value: textProdottiNonTrattati,
                                onChange: setTextProdottiNonTrattati,
                            }}
                        />

                        {/* textarea */}
                        <ProfilazioneSetting
                            title="Prezzi Non Competetivi"
                            disabled={formDisabled}
                            description="Abilita se il cliente non compra perchè i nostri prezzi sono maggiori di altri competitor."
                            checked={prezziNonCompetitivi}
                            onChange={handlePrezziNonCompetitiviToggle}
                            ariaLabel="Profilazione - Prezzi Non Competetivi"
                            textarea={{
                                id: "textPrezziNonCompetitivi",
                                name: "textPrezziNonCompetitivi",
                                label: "Descrivi in cosa non siamo stati competitivi.",
                                placeholder: "Scrivi qui la motivazione...",
                                value: textPrezziNonCompetitivi,
                                onChange: setTextPrezziNonCompetitivi,
                            }}
                        />

                        <ProfilazioneSetting
                            title="Problema Resi"
                            disabled={formDisabled}
                            description="Abilita se il cliente ha dei problemi sui resi."
                            ariaLabel="Profilazione - Problema Resi"
                            checked={problemaResi}
                            onChange={setProblemaResi}
                        />

                        <ProfilazioneSetting
                            title="Problema Trasporto"
                            disabled={formDisabled}
                            description="Abilita se il cliente ha dei problemi con il trasporto."
                            ariaLabel="Profilazione - Problema Trasporto"
                            checked={problemaTrasporto}
                            onChange={setProblemaTrasporto}
                        />

                        <ProfilazioneSetting
                            title="Problemi Amministrativi"
                            disabled={formDisabled}
                            description="Abilita se il cliente ha dei problemi amministrativi."
                            ariaLabel="Profilazione - Problemi Amministrativi"
                            checked={problemiAmministrativi}
                            onChange={setProblemiAmministrativi}
                        />

                    </>
                )}
            </div>
        </SectionContainer>
    );
};
