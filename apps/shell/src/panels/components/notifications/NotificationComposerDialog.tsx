import React, { useCallback, useMemo, useState } from "react";
import {
    FiAlertCircle,
    FiCheck,
    FiClock,
    FiMail,
    FiPlus,
    FiRefreshCcw,
    FiSend,
    FiShield,
    FiUser,
    FiUsers,
    FiX,
} from "react-icons/fi";
import {
    FDBox,
    FDButton,
    FDDate,
    FDDialog,
    FDIconButton,
    FDInput,
    FDSelect,
    RichTextEditor,
} from "@nex/fd-ui";
import { createNotification } from "@nex/shared-platform";
import { useRealtimeSession } from "@nex/realtime-store";
import NotificationComposerSummary from "./NotificationComposerSummary";
import {
    API_USERS,
    MODALITY_OPTIONS,
    ROLES_ENV,
    TYPE_OPTIONS,
    USER_STATUS_OPTIONS,
    createDefaultDraft,
    cx,
    formatLocalDateTimeInput,
    getSenderOptions,
    safeParseRoles,
    type NotificationDraft,
    type NotificationModality,
    type NotificationType,
    type SenderOption,
    type UsersTargetStatus,
} from "./shared";

const CloseIcon = FiX as React.FC<{ size?: number; className?: string }>;
const AddIcon = FiPlus as React.FC<{ size?: number; className?: string }>;
const ResetIcon = FiRefreshCcw as React.FC<{ size?: number; className?: string }>;
const MailIcon = FiMail as React.FC<{ size?: number; className?: string }>;
const UserIcon = FiUser as React.FC<{ size?: number; className?: string }>;
const UsersIcon = FiUsers as React.FC<{ size?: number; className?: string }>;
const ShieldIcon = FiShield as React.FC<{ size?: number; className?: string }>;
const ClockIcon = FiClock as React.FC<{ size?: number; className?: string }>;
const SendIcon = FiSend as React.FC<{ size?: number; className?: string }>;
const CheckIcon = FiCheck as React.FC<{ size?: number; className?: string }>;
const AlertCircleIcon = FiAlertCircle as React.FC<{ size?: number; className?: string }>;

type SelectOption = { value: string; label: string };

function toOptions(values: string[]): SelectOption[] {
    return values.map((value) => ({ value, label: value }));
}

function toSingleValue(value: string | string[] | null | undefined) {
    return Array.isArray(value) ? value[0] : value ?? "";
}

function getAudienceLabel(draft: NotificationDraft) {
    if (draft.modality === "Singola") {
        return draft.user_target.length
            ? `${draft.user_target.length} destinatario${draft.user_target.length > 1 ? "i" : ""} selezionato${draft.user_target.length > 1 ? "i" : ""}`
            : "Nessun destinatario selezionato";
    }

    if (draft.modality === "Ruolo") {
        return draft.targetRole ? `Ruolo ${draft.targetRole}` : "Ruolo non selezionato";
    }

    return `Invio generale · ${draft.usersTargetStatus}`;
}

function ComposerHeader({
    onReset,
    onClose,
    sending,
}: {
    onReset: () => void;
    onClose: () => void;
    sending: boolean;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 
                text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                    Composer
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                    Nuova notifica
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    Componi un invio professionale verso utenti specifici, un ruolo o l&apos;intera piattaforma,
                    mantenendo una revisione chiara prima della consegna.
                </p>
            </div>

            <div className="flex items-center gap-2 self-end self-start">
                <FDIconButton
                    icon={<ResetIcon size={16} />}
                    variant="outline"
                    ariaLabel="Reset composizione"
                    onClick={onReset}
                    disabled={sending}
                />
                <FDIconButton
                    icon={<CloseIcon size={16} />}
                    variant="outline"
                    ariaLabel="Chiudi composer"
                    onClick={onClose}
                    disabled={sending}
                />
            </div>
        </div>
    );
}

function ComposerRow({
    label,
    icon,
    children,
    helper,
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    helper?: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[88px,minmax(0,1fr)] lg:gap-5">
            <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {icon}
                    <span>{label}</span>
                </div>
                {helper ? <div className="text-xs text-neutral-400 dark:text-neutral-500">{helper}</div> : null}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function SenderPill({
    option,
    selected,
    onSelect,
}: {
    option: SenderOption;
    selected: boolean;
    onSelect: () => void;
}) {
    const initial = option.label.slice(0, 1).toUpperCase();

    return (
        <FDButton
            variant={selected ? "soft" : "ghost"}
            color={selected ? "primary" : "neutral"}
            size="small"
            radius="full"
            onClick={onSelect}
            className={cx(
                "!h-11 !justify-start !gap-3 !px-3.5",
                selected ? "ring-1 ring-sky-500/20" : "border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            )}
        >
            <span className={cx(
                "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                selected
                    ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            )}>
                {initial}
            </span>
            <span className="flex min-w-0 flex-col items-start">
                <span className="max-w-[180px] truncate text-sm font-medium">{option.label}</span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {option.system ? "Sistema" : "Utente"}
                </span>
            </span>
        </FDButton>
    );
}

function RecipientChip({ value, onRemove }: { value: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {value.slice(0, 1).toUpperCase()}
            </span>
            <span>{value}</span>
            <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                aria-label={`Rimuovi ${value}`}
            >
                <CloseIcon size={12} />
            </button>
        </span>
    );
}

function PlanningToggle({
    checked,
    onToggle,
}: {
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <FDButton
            type="button"
            variant={checked ? "soft" : "ghost"}
            color={checked ? "primary" : "neutral"}
            radius="full"
            size="small"
            onClick={onToggle}
            className="!h-11 !justify-start !gap-3 !px-3.5"
        >
            <span
                className={cx(
                    "relative h-5 w-9 rounded-full transition mr-1",
                    checked ? "bg-sky-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <span
                    className={cx(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                        checked ? "left-4" : "left-0.5"
                    )}
                />
            </span>
            <span className="text-sm font-medium">Pianifica invio</span>
        </FDButton>
    );
}

function AudienceHint({ draft }: { draft: NotificationDraft }) {
    const icon = draft.modality === "Singola"
        ? <UserIcon size={15} className="text-sky-500" />
        : draft.modality === "Ruolo"
            ? <ShieldIcon size={15} className="text-violet-500" />
            : <UsersIcon size={15} className="text-emerald-500" />;

    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            {icon}
            <span>{getAudienceLabel(draft)}</span>
        </div>
    );
}

export default function NotificationComposerDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const session = useRealtimeSession();
    const canSend = session?.details?.ruolo === "Dev" || session?.details?.ruolo === "Admin";
    const senderOptions = useMemo(() => getSenderOptions(session), [session]);
    const roleOptions = useMemo(() => safeParseRoles(ROLES_ENV), []);
    const [draft, setDraft] = useState<NotificationDraft>(() => createDefaultDraft());
    const [emailInput, setEmailInput] = useState("");
    const [sending, setSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedSender = senderOptions.find((option) => option.key === draft.senderKey) ?? senderOptions[0];

    const updateDraft = useCallback(<K extends keyof NotificationDraft>(key: K, value: NotificationDraft[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    }, []);

    const addEmailTag = useCallback(() => {
        const normalized = emailInput.trim().toLowerCase();
        if (!normalized) {
            setErrorMessage("Inserisci una email valida prima di aggiungerla.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalized)) {
            setErrorMessage("L'indirizzo email inserito non è valido.");
            return;
        }

        setDraft((prev) => {
            if (prev.user_target.includes(normalized)) return prev;
            return { ...prev, user_target: [...prev.user_target, normalized] };
        });
        setEmailInput("");
        setErrorMessage(null);
    }, [emailInput]);

    const resetComposer = useCallback(() => {
        setDraft(createDefaultDraft());
        setEmailInput("");
        setErrorMessage(null);
    }, []);

    const closeComposer = useCallback(() => {
        if (sending) return;
        resetComposer();
        onClose();
    }, [onClose, resetComposer, sending]);

    const validateDraft = useCallback(() => {
        if (!draft.desc || draft.desc.replace(/<[^>]+>/g, "").trim() === "") {
            return "Il corpo della notifica è obbligatorio.";
        }
        if (draft.modality === "Singola" && draft.user_target.length === 0) {
            return "In modalità Singola devi indicare almeno un destinatario.";
        }
        if (draft.modality === "Ruolo" && !draft.targetRole.trim()) {
            return "In modalità Ruolo devi selezionare il ruolo di destinazione.";
        }
        if (draft.timerMode && !draft.timer) {
            return "Se attivi il timer devi indicare data e ora di invio.";
        }
        return null;
    }, [draft]);

    const submit = useCallback(async () => {
        if (!session?.details?._id) {
            setErrorMessage("Sessione utente non disponibile.");
            return;
        }

        const validationError = validateDraft();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setSending(true);
        setErrorMessage(null);

        try {
            await createNotification({
                apiUsersEndpoint: API_USERS,
                token: session.token ?? undefined,
                body: {
                    user_from: String(session.details.username),
                    user_from_details: {
                        nome: selectedSender.nome,
                        fullName: selectedSender.fullName,
                        system: selectedSender.system,
                    },
                    user_target: draft.modality === "Singola" ? draft.user_target : [],
                    type: draft.type,
                    modality: draft.modality,
                    usersTargetStatus: draft.usersTargetStatus,
                    desc: draft.desc,
                    timerMode: draft.timerMode,
                    timer: draft.timerMode ? draft.timer : undefined,
                    targetRole: draft.modality === "Ruolo" ? draft.targetRole : undefined,
                },
            });

            resetComposer();
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Creazione notifica non riuscita.";
            setErrorMessage(message);
        } finally {
            setSending(false);
        }
    }, [draft, onClose, resetComposer, selectedSender.fullName, selectedSender.nome, selectedSender.system, session, validateDraft]);

    if (!canSend || !open) return null;

    return (
        <FDDialog
            open={open}
            onClose={closeComposer}
            hideActions
            disableBackdropClose={sending}
            size="full"
            className="max-w-[1180px] overflow-hidden border border-neutral-200 shadow-sm dark:border-neutral-800"
        >
                <ComposerHeader onReset={resetComposer} onClose={closeComposer} sending={sending} />

                <div className="grid min-h-0 xl:grid-cols-[minmax(0,1fr),320px]">
                    <div className="min-w-0 border-b border-neutral-200 dark:border-neutral-800 xl:border-b-0 xl:border-r">
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            <ComposerRow label="Da" icon={<MailIcon size={15} />} helper="Seleziona il mittente visibile nella notifica.">
                                <div className="flex flex-wrap gap-2">
                                    {senderOptions.map((option) => (
                                        <SenderPill
                                            key={option.key}
                                            option={option}
                                            selected={draft.senderKey === option.key}
                                            onSelect={() => updateDraft("senderKey", option.key)}
                                        />
                                    ))}
                                </div>
                            </ComposerRow>

                            <ComposerRow
                                label="A"
                                icon={<UsersIcon size={15} />}
                                helper="Definisci destinatari specifici oppure l'audience in base alla modalità di invio."
                            >
                                <div className="space-y-3">
                                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr),220px,220px]">
                                        <FDSelect
                                            options={toOptions(MODALITY_OPTIONS)}
                                            value={draft.modality}
                                            onChange={(value: any) => updateDraft("modality", toSingleValue(value) as NotificationModality)}
                                            label="Modalità"
                                            color="light"
                                            variant="outline"
                                            fullWidth
                                        />
                                        <FDSelect
                                            options={toOptions(USER_STATUS_OPTIONS)}
                                            value={draft.usersTargetStatus}
                                            onChange={(value: any) => updateDraft("usersTargetStatus", toSingleValue(value) as UsersTargetStatus)}
                                            label="Stato utenti"
                                            color="light"
                                            variant="outline"
                                            fullWidth
                                        />
                                        {draft.modality === "Ruolo" ? (
                                            <FDSelect
                                                options={toOptions(roleOptions)}
                                                value={draft.targetRole}
                                                onChange={(value: any) => updateDraft("targetRole", toSingleValue(value))}
                                                label="Ruolo"
                                                color="light"
                                                variant="outline"
                                                fullWidth
                                            />
                                        ) : (
                                            <div className="flex items-end">
                                                <AudienceHint draft={draft} />
                                            </div>
                                        )}
                                    </div>

                                    {draft.modality === "Singola" ? (
                                        <div className="space-y-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/60">
                                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),auto]">
                                                <FDInput
                                                    value={emailInput}
                                                    onChange={(event) => setEmailInput(event.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            event.preventDefault();
                                                            addEmailTag();
                                                        }
                                                    }}
                                                    label="Email target"
                                                    placeholder="nome@azienda.it"
                                                    color="light"
                                                    variant="outline"
                                                    fullWidth
                                                />
                                                <div className="flex items-end">
                                                    <FDButton
                                                        variant="outline"
                                                        color="neutral"
                                                        onClick={addEmailTag}
                                                        icon={<AddIcon size={16} />}
                                                        className="!h-11"
                                                    >
                                                        Aggiungi
                                                    </FDButton>
                                                </div>
                                            </div>

                                            {draft.user_target.length ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {draft.user_target.map((value) => (
                                                        <RecipientChip
                                                            key={value}
                                                            value={value}
                                                            onRemove={() => updateDraft("user_target", draft.user_target.filter((entry) => entry !== value))}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                                    Nessun destinatario inserito. Aggiungi almeno una email per l&apos;invio singolo.
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </ComposerRow>

                            <ComposerRow
                                label="Config"
                                icon={<ShieldIcon size={15} />}
                                helper="Scegli la tipologia della notifica e se desideri pianificare l'invio."
                            >
                                <div className="grid gap-3 xl:grid-cols-[220px,minmax(0,1fr)]">
                                    <FDSelect
                                        options={toOptions(TYPE_OPTIONS)}
                                        value={draft.type}
                                        onChange={(value: any) => updateDraft("type", toSingleValue(value) as NotificationType)}
                                        label="Tipologia"
                                        color="light"
                                        variant="outline"
                                        fullWidth
                                    />

                                    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Pianificazione invio</div>
                                                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                    Programma la notifica per una data e ora specifica, oppure inviala subito.
                                                </div>
                                            </div>
                                            <PlanningToggle
                                                checked={draft.timerMode}
                                                onToggle={() => {
                                                    const checked = !draft.timerMode;
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        timerMode: checked,
                                                        timer: checked ? prev.timer ?? formatLocalDateTimeInput(new Date()) : undefined,
                                                    }));
                                                }}
                                            />
                                        </div>

                                        {draft.timerMode ? (
                                            <FDDate
                                                type="datetime-local"
                                                value={draft.timer}
                                                onChange={(value) => updateDraft("timer", value)}
                                                label="Invia il"
                                                color="neutral"
                                                variant="outline"
                                                fullWidth
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </ComposerRow>
                        </div>

                        <div className="px-6 py-5">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                        Messaggio
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                        Il contenuto è il cuore della notifica: mantieni tono, chiarezza e contesto operativo.
                                    </div>
                                </div>
                                <AudienceHint draft={draft} />
                            </div>

                            <FDBox
                                variant="solid"
                                color="light"
                                radius="2xl"
                                pad="none"
                                className="min-h-[360px] overflow-hidden border border-neutral-200 dark:border-neutral-800"
                            >
                                <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Editor contenuto</div>
                                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                        Supporta formattazione base, elenchi, citazioni, link e pulizia rapida del testo.
                                    </div>
                                </div>
                                <div className="px-4 py-4">
                                    <RichTextEditor
                                        value={draft.desc || ""}
                                        onChange={(html) => updateDraft("desc", html)}
                                        placeholder="Scrivi il messaggio della notifica…"
                                        className="w-full"
                                        debounceMs={120}
                                        actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                                        maxHeight={420}
                                    />
                                </div>
                            </FDBox>
                        </div>
                    </div>

                    <aside className="min-w-0 p-5">
                        <div className="sticky top-0 space-y-4">
                            <FDBox
                                variant="ghost"
                                radius="2xl"
                                pad="md"
                                className="border border-sky-200/70 dark:border-sky-500/15"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm dark:bg-sky-500/10 dark:text-sky-300">
                                        <SendIcon size={18} />
                                    </span>
                                    <div>
                                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">Stato composer</div>
                                        <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                            {draft.timerMode ? "Invio pianificato" : "Invio immediato"} · {getAudienceLabel(draft)}
                                        </div>
                                    </div>
                                </div>
                            </FDBox>

                            <NotificationComposerSummary draft={draft} selectedSender={selectedSender} />
                        </div>
                    </aside>
                </div>

                <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                    <div
                        className={cx(
                            "flex min-h-[20px] items-center gap-2 text-sm",
                            errorMessage ? "text-rose-600 dark:text-rose-400" : "text-neutral-500 dark:text-neutral-400"
                        )}
                    >
                        {errorMessage ? <AlertCircleIcon size={16} /> : <CheckIcon size={16} />}
                        <span>
                            {errorMessage ?? "Composer pronto. Verifica contenuto, audience e pianificazione prima dell'invio."}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <FDButton variant="ghost" color="neutral" onClick={resetComposer} disabled={sending}>
                            Reset
                        </FDButton>
                        <FDButton variant="ghost" color="neutral" onClick={closeComposer} disabled={sending}>
                            Chiudi
                        </FDButton>
                        <FDButton
                            variant="solid"
                            color="primary"
                            onClick={submit}
                            loading={sending}
                            icon={<SendIcon size={16} />}
                            className="shadow-sm"
                        >
                            Invia notifica
                        </FDButton>
                    </div>
                </div>
        </FDDialog>
    );
};