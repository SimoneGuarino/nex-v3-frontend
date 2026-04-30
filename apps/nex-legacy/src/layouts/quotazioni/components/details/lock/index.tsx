import FDButton from "components/UI/buttons/FDButton";
import React, { useMemo, useState } from "react";
import { CAPS } from "authz/caps";
import { useAuthz } from "authz/useAuthz";
import FDTextArea from "components/UI/input/FDTextArea";

type QuoteType = "BID_PASSIVO" | string;

export type QuotazioneStatus =
    | "BOZZA"
    | "RICHIESTA"
    | "VALUTAZIONE"
    | "APPROVAZIONE"
    | "VALIDAZIONE"
    | "APERTA"
    | string;

export type QuotazioneLockProps = {
    quoteType?: QuoteType;
    status?: QuotazioneStatus;

    /**
     * True se l'utente corrente è un buyer con permessi speciali (abilitato all'unlock/decisione).
     */
    canManageUnlock?: boolean;

    /**
     * Capability richiesta per abilitare la gestione dell'unlock (default: quotazioni.look.moderate)
     */
    requiredCap?: string;

    /**
     * Callback quando il buyer autorizzato approva l'apertura definitiva della quotazione.
     */
    onApproveUnlock?: () => void | Promise<void>;

    /**
     * Callback quando il buyer autorizzato rifiuta l'apertura (con motivazione obbligatoria).
     */
    onRejectUnlock?: (reason: string) => void | Promise<void>;

    /**
     * Permette di personalizzare quali status richiedono decisione di unlock.
     * Default: ["VALUTAZIONE", "APPROVAZIONE"]
     */
    unlockPhaseStatuses?: QuotazioneStatus[];

    className?: string;
    style?: React.CSSProperties;
};

type BarTone = "info" | "warning" | "danger";

function Bar({
    tone,
    title,
    children,
    right,
    rightClassName,
}: {
    tone: BarTone;
    title?: string;
    children: React.ReactNode;
    right?: React.ReactNode;
    rightClassName?: string;
}) {
    return (
        <div
            style={{
                justifyContent: "space-between",
            }}
            className={`flex gap-2 p-3 border rounded-lg 
                ${tone === "info" ? "border-blue-300 text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700/30 dark:text-blue-300" : ""}
                ${tone === "warning" ? "border-yellow-300 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700/30 dark:text-yellow-300" : ""}
                ${tone === "danger" ? "border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-300" : ""}
            `}
            role={tone === "danger" ? "alert" : "status"}
            aria-live={tone === "danger" ? "assertive" : "polite"}
        >
            <div>
                {title ? (
                    <h2 className="font-semibold mb-1 text-sm">{title}</h2>
                ) : null}
                <div style={{ fontSize: 13, lineHeight: 1.35 }}>{children}</div>
            </div>
            {right ? <div className={`flex-auto ${rightClassName ?? ""}`}>{right}</div> : null}
        </div>
    );
};

export default function QuotazioneLock(props: QuotazioneLockProps) {
    const {
        quoteType,
        status,
        onApproveUnlock,
        onRejectUnlock,
        className,
        requiredCap,
        style,
    } = props;

    const { hasCap, isReady } = useAuthz();
    const effectiveRequiredCap = requiredCap ?? CAPS.QUOTAZIONI_LOOK_MODERATE;

    // Se canManageUnlock non viene passato esplicitamente, lo calcoliamo tramite AuthZ (caps dal BE)
    const canManageUnlockEffective = Boolean(isReady && hasCap(effectiveRequiredCap));

    const isBidPassivo = quoteType === "BID_PASSIVO";
    const isInValidazione = status === "VALIDAZIONE";

    const needsUnlockDecision = useMemo(() => {
        if (!isBidPassivo) return false;
        if (!status) return false;
        return status === "VALIDAZIONE";
    }, [isBidPassivo, status]);

    const showBidPassivoInfo = isBidPassivo && !isInValidazione;
    const showValidazioneWarning = isInValidazione;

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [approveLoading, setApproveLoading] = useState(false);
    const [rejectLoading, setRejectLoading] = useState(false);

    const canApprove = canManageUnlockEffective && needsUnlockDecision && !!onApproveUnlock;
    const canReject = canManageUnlockEffective && needsUnlockDecision && !!onRejectUnlock;

    const handleApprove = async () => {
        if (!onApproveUnlock || approveLoading || rejectLoading) return;
        try {
            setApproveLoading(true);
            await onApproveUnlock();
        } finally {
            setApproveLoading(false);
        }
    };

    const handleReject = async () => {
        if (!onRejectUnlock || approveLoading || rejectLoading) return;
        const reason = rejectReason.trim();
        if (!reason) return;
        try {
            setRejectLoading(true);
            await onRejectUnlock(reason);
            setRejectOpen(false);
            setRejectReason("");
        } finally {
            setRejectLoading(false);
        }
    };

    if (!showBidPassivoInfo && !showValidazioneWarning && !needsUnlockDecision) {
        return null;
    };

    return (
        <div
            className={className}
            style={{ display: "grid", gap: 10, ...style }}
            data-testid="quotazione-lock"
        >
            {showBidPassivoInfo ? (
                <Bar
                    tone="info"
                    title="Quotazione BID passivo"
                    right={
                        canManageUnlockEffective && needsUnlockDecision ? (
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    background: "rgba(96,165,250,0.18)",
                                    border: "1px solid rgba(96,165,250,0.55)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                In valutazione
                            </span>
                        ) : null
                    }
                >
                    <span className="text-xs">Questa quotazione è in modalità <b>BID_PASSIVO</b>. Quando verrà richiesta
                        ufficialmente, passerà in una fase di <b>valutazione</b> da parte di un buyer con permessi speciali.
                        Una volta aperta, seguirà il flusso
                        normale: ogni buyer quoterà i prodotti assegnati.</span>
                </Bar>
            ) : null}

            {showValidazioneWarning ? (
                <Bar tone="danger" title="Quotazione in VALIDAZIONE">
                    La quotazione è in stato <b>VALIDAZIONE</b>: non è possibile effettuare ulteriori
                    operazioni. È necessario attendere il completamento della fase in corso.
                </Bar>
            ) : null}

            {canManageUnlockEffective && needsUnlockDecision ? (
                <Bar
                    tone="warning"
                    title="Decisione richiesta (buyer autorizzato)"
                    rightClassName="gap-2 flex flex-wrap justify-end items-center"
                    right={!rejectOpen && <>
                        {canApprove ? (
                            <FDButton
                                color="primary"
                                className="h-fit"
                                size="small"
                                onClick={handleApprove}
                                disabled={approveLoading || rejectLoading}
                            >
                                {approveLoading ? "Apertura..." : "Apri quotazione"}
                            </FDButton>
                        ) : null}

                        {canReject ? (
                            <FDButton
                                color="error"
                                className="h-fit"
                                size="small"
                                onClick={() => setRejectOpen((v) => !v)}
                                disabled={approveLoading || rejectLoading}
                            >
                                Rifiuta
                            </FDButton>
                        ) : null}
                    </>
                    }
                >
                    Per le quotazioni <b>BID_PASSIVO</b> è necessaria una decisione del buyer autorizzato:
                    è possibile aprire definitivamente la quotazione oppure rifiutarla indicando una
                    motivazione.
                    {canReject && rejectOpen ? (
                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            <label style={{ display: "grid", gap: 6 }}>
                                <span className="text-[11px]">Motivazione rifiuto</span>
                                <FDTextArea value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    disabled={approveLoading || rejectLoading}
                                    placeholder="Inserisci una motivazione..."
                                    className="min-h-20 max-h-50"
                                    variant="outline"
                                    size="sm"
                                    radius="md"
                                />
                            </label>

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <FDButton
                                    variant="outline"
                                    color="neutral"
                                    onClick={() => {
                                        setRejectOpen(false);
                                        setRejectReason("");
                                    }}
                                    loading={rejectLoading || approveLoading}
                                >
                                    Annulla
                                </FDButton>

                                <FDButton
                                    color="error"
                                    onClick={handleReject}
                                    loading={rejectLoading || approveLoading}
                                    disabled={!rejectReason.trim()}
                                >
                                    {rejectLoading ? "Invio..." : "Conferma rifiuto"}
                                </FDButton>
                            </div>
                        </div>
                    ) : null}
                </Bar>
            ) : null}
        </div>
    );
};