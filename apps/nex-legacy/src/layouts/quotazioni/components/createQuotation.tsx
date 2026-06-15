import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FDBackdrop, FDBox, FDSelect, FDInput, FDIconButton, FDButton, FDTextArea, FDDate, FDSwitch} from "@nex/fd-ui";
import { clsx } from "clsx";
import { mepaTypes, OnCreateRequestType, quotationTypes } from "../pages";
import { CustomerQuickDetailsDTO } from "layouts/quotazioni/types/customers";

//icons
import { MdClose } from "react-icons/md";
import { CiSquareInfo } from "react-icons/ci";
import { SearchCustomersAPI } from "../fetchdata/get/searchCustomers";
import { formatISODate, toLocalDateTimeInputValue } from "utils/date/getDate";
import { useTour } from "tour/TourProvider";
import { useAuthz } from "authz/useAuthz";


const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const CiInfoIcon = CiSquareInfo as React.FC<{ size?: number; className?: string }>;

const formDefaultState: FormStateProps = {
    isEndUser: false, // di default la quotazione è rivolta alla PA, l'utente può decidere di renderla valida per End User tramite switch
    type: {
        value: null, // va eliminato quando viene inviato nel al BE se la qts.state è diverso da PASSIVO & MEPA
        CIG: "",
        RDO: "",
        ACCORDO_QUADRO: "",
    },
    details: {
        nome: "",
        partitaIva: "",
        riferimento: "",
        telefono: "",
        email: "",
        sedeLegale: "",
    },
};


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
type Props = {
    open: boolean;
    loading?: boolean;
    isMEPAUser: boolean | undefined;
    onClose: () => void;
    onCreate: ({ titolo, note, type, customer, dateTo, extraForm, resetStates }: OnCreateRequestType & { resetStates: () => void }) => void;
};

type OptionType = {
    label: string;
    value: "RDO" | "CIG" | "ACCORDO_QUADRO";
};

type endUserFormProps = {
    key: string;
    label: string;
    isRequired: boolean;
    onlyNumber?: boolean;
    isEmail?: boolean;
    maxLength?: number;
};

export type FormStateProps = {
    isEndUser: boolean;
    type: {
        value: "RDO" | "CIG" | "ACCORDO_QUADRO" | "ND" | null;
        CIG?: string;
        RDO?: string;
        ACCORDO_QUADRO?: string;
    };
    details: {
        nome: string;
        partitaIva: string;
        riferimento?: string;
        telefono?: string;
        email?: string;
        sedeLegale?: string;
    };
};


/**
 * Controlla che se è stata selezionata una tipologia tra CIG, RDO o Accordo Quadro, allora il campo relativo non sia vuoto, altrimenti mostra errore.
 * @returns {boolean} true se il form è valido, false altrimenti
 */
function isValidateFormType(extraForm: FormStateProps): { status: boolean; message?: string } {
    if (extraForm.type.value === "CIG" && extraForm.type.CIG?.trim().length === 0) {
        return { status: false, message: "Il campo CIG non può essere vuoto se selezionato" };
    };
    if (extraForm.type.value === "RDO" && extraForm.type.RDO?.trim().length === 0) {
        return { status: false, message: "Il campo RDO non può essere vuoto se selezionato" };
    };
    if (extraForm.type.value === "ACCORDO_QUADRO" && extraForm.type.ACCORDO_QUADRO?.trim().length === 0) {
        return { status: false, message: "Il campo Accordo Quadro non può essere vuoto se selezionato" };
    };

    return { status: true };
};

/**
 * Controlla che i campi obbligatori su details (nome e partita IVA) siano presenti e validi, e che eventuali campi opzionali se presenti siano validi.
 * La validazione è semplice e si basa su regole di base (es. nome non vuoto, partita IVA non vuota, telefono con formato base, email con chiocciola, ecc).
 * @param details i dettagli da validare
 * @returns un oggetto con lo stato della validazione e un messaggio opzionale in caso di errore
 */
function isValidateFromDetails(details: FormStateProps["details"]): { status: boolean; message?: string } {
    // validazione semplice del campo nome: se è presente, non può essere vuoto e non puo contenere ( +, -, @, #, $, %, &, *, ecc).
    if ((details.nome && details.nome.trim().length === 0) || !details.nome || /[+@#$%^&*]/.test(details.nome)) {
        return { status: false, message: "Il campo Nome è obbligatorio per le quotazioni rivolte alla Pubblica Amministrazione e agli End User." };
    };

    // validazione semplice del campo partita IVA: se è presente, non può essere vuoto.
    if ((details.partitaIva && details.partitaIva.trim().length === 0) || !details.partitaIva) {
        return { status: false, message: "Il campo Partita IVA/C.F. è obbligatorio per le quotazioni rivolte alla Pubblica Amministrazione e agli End User." };
    };

    // validazione dei campi opzionali su details (riferimento, telefono, email, sedeLegale) se presenti
    if (details.riferimento && details.riferimento.trim().length === 0) {
        return { status: false, message: "Se presente, il campo Riferimento non può essere vuoto." };
    };

    // validazione semplice del formato telefono: se è presente, deve essere non vuoto e contenere solo numeri, spazi, +, -, (, )
    if (details.telefono && (details.telefono.trim().length === 0 || !/^[0-9+\-\s()]+$/.test(details.telefono))) {
        return { status: false, message: "Se presente, il campo Telefono non può essere vuoto e deve contenere solo numeri, spazi, +, -, (, )." };
    };

    // validazione semplice del formato email: se è presente, deve essere non vuota e contenere una chiocciola.
    if (details.email && (details.email.trim().length === 0 || !details.email.includes("@"))) {
        return { status: false, message: "Se presente, il campo Email non può essere vuoto e deve contenere una chiocciola." };
    };

    if (details.sedeLegale && details.sedeLegale.trim().length === 0) {
        return { status: false, message: "Se presente, il campo Sede Legale non può essere vuoto." };
    };

    return { status: true };
};


// ——————————————————————————————————————————————————————————
// MAIN FUNCTION
// ——————————————————————————————————————————————————————————
/** modale minimale, senza stile: input titolo + Crea/Chiudi */
export default function CreateQuotationModal({ open, loading, isMEPAUser, onClose, onCreate }: Props) {
    const { hasCap } = useAuthz();
    const [customer, setCustomer] = useState<CustomerQuickDetailsDTO | null>(null);

    const [customerOptions, setCustomerOptions] = useState<CustomerQuickDetailsDTO[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerLoading, setCustomerLoading] = useState(false);

    /** Stato che gestisce lo switch, se true allora l'opzione è valida per l'endUser, se false è Pubblica amministrazione. */
    const [formState, setFormState] = useState<FormStateProps>(formDefaultState);
    const endUserForm: endUserFormProps[] = [
        {
            key: "nome",
            label: "Nome",
            isRequired: true,
        },
        {
            key: "partitaIva",
            label: "Partita IVA/C.F.",
            isRequired: true,
            onlyNumber: true,
            maxLength: 11,
        },
        {
            key: "riferimento",
            label: "Riferimento",
            isRequired: false,
        },
        {
            key: "telefono",
            label: "Telefono",
            isRequired: false,
            onlyNumber: true,
            maxLength: 15,
        },
        {
            key: "email",
            label: "Email",
            isRequired: false,
            isEmail: true,
        },
        {
            key: "sedeLegale",
            label: "Sede Legale",
            isRequired: false,
        },
    ]

    const [titolo, setTitolo] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [localErr, setLocalErr] = useState<string | null>(null);
    const [q_type, setQ_Type] = useState<string>(""); //tipologia della quotazione (RDO, CIG, MEPA, BID PASSIVO, BID ATTIVO)
    const [dateTo, setDateTo] = useState<string>("");

    // Checkbox FE: per BID PASSIVO consente di proseguire senza cliente selezionato.
    // true  -> l'utente vuole collegare un cliente esistente (mostro FDSelect)
    // false -> l'utente prosegue senza cliente (il BE userà placeholder)
    const [hasExistingCustomer, setHasExistingCustomer] = useState<boolean>(true);

    // Applichiamo gli stessi filtri di compilazione a MEPA.
    // Il controllo autorizzativo user.isMEPA resta lato BE solo per tipologia MEPA.
    const isMepaType = q_type === "MEPA";
    const isLicenzeType = q_type === "LICENZE";
    const isBidPassivoType = q_type === "BID PASSIVO";
    const isBidAttivoType = q_type === "BID ATTIVO";

    // La select cliente è visibile solo in BID PASSIVO se l'utente vuole collegare un cliente esistente,
    // altrimenti è nascosta e non richiesta in nessun altro caso.
    const shouldShowCustomerSelect = (!isBidPassivoType || hasExistingCustomer) && !isMepaType ;

    //LockInteraction modale di creazione
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex >= 2 && tourIndex <= 4;

    const qTypes = React.useMemo(() =>
        [...quotationTypes, ...(isMEPAUser ? [mepaTypes] : [])]
        , [isMEPAUser]);

    useEffect(() => {
        if (open) {
            setTitolo("");
            setLocalErr(null);
            setHasExistingCustomer(true);
        }
    }, [open]);

    useEffect(() => {
        // La checkbox vale solo in BID PASSIVO.
        // Se l'utente cambia tipologia, torniamo al comportamento standard (cliente richiesto).
        if (!isBidPassivoType) {
            setHasExistingCustomer(true);
        }
    }, [isBidPassivoType]);

    /**
     * Effettua la ricerca clienti in base alla stringa di ricerca
     */
    useEffect(() => {
        // Se la select cliente non e visibile, evitiamo chiamate search inutili.
        if (!shouldShowCustomerSelect) {
            setCustomerOptions([]);
            return;
        }

        const q = customerSearch.trim();

        // non chiamare il BE se la stringa è troppo corta
        if (q.length < 2) {
            setCustomerOptions([]);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setCustomerLoading(true);
                /* const params = new URLSearchParams({
                    query: q,
                    context: "quotations",
                    limit: "20",
                });*/

                const items = await SearchCustomersAPI({
                    abortController: controller,
                    query: q,
                    context: "quotations",
                    limit: 20,
                    requestedModules: ["basic", "fido"],
                    hasCap,
                    ChangeLoadStatus: () => { },
                });
                if (!items) { return; }

                setCustomerOptions(items);
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("quick-details fetch error", err);
                }
            } finally {
                setCustomerLoading(false);
            }
        }, 300); // debounce 300ms

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [customerSearch, shouldShowCustomerSelect, hasCap]);

    
    if (!open) return null;

    // reset stati
    const resetStates = () => {
        setTitolo("");
        setNote("");
        setQ_Type("");
        setCustomer(null);
        setDateTo("");
        setCustomerSearch("");
        setCustomerOptions([]);
        setHasExistingCustomer(true);
        resetFormState();
    };

    /**
     * Reset stato formState ai valori iniziali (usato alla creazione quotazione per pulire i campi condizionali)
     */
    const resetFormState = () => {
        setFormState(formDefaultState);
    };

    /**
     * Gestione creazione nuova quotazione
     * @returns void
     */
    const handleCreate = () => {
        if (!titolo.trim()) {
            setLocalErr("Inserisci un titolo per la quotazione");
            return;
        };

        if (!q_type) {
            setLocalErr("Seleziona una tipologia di quotazione");
            return;
        };

        // Cliente obbligatorio in tutti i casi tranne BID PASSIVO senza checkbox.
        if (shouldShowCustomerSelect) {
            if (!customer || (customer && (!customer.codiceCliente || customer.codiceCliente.trim() === ""))) {
                setLocalErr("Seleziona un cliente valido");
                return;
            };
        }

        if (formState && formState.type.value) {
            const validationResult = isValidateFormType(formState);
            if (!validationResult.status) {
                return setLocalErr(validationResult.message as string);
            };
        };

        if (isBidAttivoType || isMepaType || isLicenzeType) {
            if (formState && formState.details) {
                if (isMepaType && formState.isEndUser) {
                    return setLocalErr("Per le quotazioni MEPA non è possibile selezionare End User, in quanto per definizione sono rivolte alla Pubblica Amministrazione.");
                };

                if (isLicenzeType && !formState.isEndUser) {
                    return setLocalErr("Per le quotazioni LICENZE è necessario selezionare End User.");
                };

                if (!isLicenzeType && !formState.isEndUser) {
                    const validationResult = isValidateFormType(formState);
                    if (!formState.type.value) {
                        return setLocalErr("Per le tipologie BID ATTIVO e MEPA è necessario specificare un valore tra CIG, RDO o Acccordo Quadro o inserire N/D per saltare l'inserimento.");
                    } else if (!validationResult.status) {
                        return setLocalErr(validationResult.message as string);
                    };
                };

                // validazione dei campi su extraParams.details
                const detailsValidationResult = isValidateFromDetails(formState.details);
                if (!detailsValidationResult.status) {
                    return setLocalErr(detailsValidationResult.message as string);
                };

            } else {
                return setLocalErr("Per le tipologie BID ATTIVO e MEPA è necessario specificare i dettagli obbigatori extra mostrati in visual quando si seleziona la tipologia di quotazione.");
            }
        };

        if (isMepaType) {
            //controlla se l'utente ha inserito il range di date
            if (!dateTo) {
                setLocalErr("Per questa tipologia di quotazione è necessario inserire una scadenza, che indicherà la durata di validità della quotazione.");
                return;
            };
        };

        //se dataTo è valorizzato, controlla che sia una data futurae non una data passata 
        // e aggiungi l'ora attuale alla data selezionata per evitare problemi di fuso orario e considerare la fine del giorno
        if (dateTo) {
            const now = new Date();
            const selectedDate = new Date(dateTo);
            selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            if (selectedDate.getTime() <= now.getTime()) {
                setLocalErr("La data di scadenza deve essere futura. Se vuoi creare una quotazione senza scadenza, lascia vuoto il campo della data.");
                return;
            };
        };

        onCreate({
            titolo,
            note,
            type: q_type,
            // Se il cliente non e richiesto (BID PASSIVO senza checkbox),
            // non inviamo il campo: il backend applica il placeholder.
            customer: shouldShowCustomerSelect ? customer?.codiceCliente : undefined,
            dateTo,
            extraForm: formState,
            resetStates,
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <FDBackdrop onClick={onClose} />
                    <motion.div
                        className="fixed inset-x-0 bottom-0 md:inset-0 z-[1100] grid place-items-end md:place-items-center p-0 md:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >{lockInteractions && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: "auto",
                            }}
                            onClickCapture={(e) => e.stopPropagation()}
                            onKeyDownCapture={(e) => {
                                if (e.key === "Tab") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                        />
                    )}
                        <FDBox
                            asMotion
                            radius="2xl"
                            shadow="2xl"
                            className="w-full 
                            md:w-[min(600px,92vw)] md:h-[min(1100px,92vh)] max-h-[1200px] flex flex-col items-center space-y-4"
                            pad="xs"
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 30 } }}
                            exit={{ y: 24, opacity: 0 }}
                            data-tour="quotazioni-create-quotation"
                        >
                            <div className="flex flex-col items-center border-b border-gray-200 dark:border-neutral-900 pb-4 w-full p-4">
                                <h1 className="text-xl font-bold">Crea una nuova quotazione</h1>
                                <h3 className="text-sm text-gray-500 text-center">Inizia compilando il modulo qui sotto per creare una nuova quotazione.</h3>
                                {/* Error Message */}
                                {localErr ? <span role="alert" className="flex mt-4 gap-2 p-2 items-center
                                    bg-red-500/20 dark:bg-red-800/40 w-full rounded-md text-xs">
                                    <CiInfoIcon size={25} className="text-red-500" />
                                    {localErr}</span> : null}
                            </div>

                            {/* Form Content */}
                            <div className="flex flex-col space-y-6 overflow-y-auto p-4 w-full" data-tour="quotazioni-create-obb">
                                {/* Informazioni + Cliente */}
                                <div className="space-y-2 w-full">
                                    <h3 className="opacity-80 text-sm">Informazioni Relative alla quotazione</h3>
                                    <motion.div
                                        // Wrapper visivo per il blocco "cliente":
                                        // aggiunge separazione e coerenza tra checkbox e select,
                                        // con una transizione leggera al cambio stato.
                                        className={`rounded-md p-0 transition-all duration-200 ${isBidPassivoType
                                            ? "p-2  border border-dashed border-blue-300/70 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-900/10"
                                            : "border border-transparent"}`}
                                        initial={false}
                                        animate={{ marginBottom: isBidPassivoType ? 12 : 4 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                    >
                                        {/* Questa checkbox compare solo in BID PASSIVO:
                                            consente di scegliere se legare la quotazione a un cliente esistente
                                            oppure proseguire senza cliente (fallback placeholder lato BE). */}
                                        {isBidPassivoType && (
                                            <label className="flex items-center gap-2 mb-3 text-xs cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded-xl border border-gray-300 dark:border-gray-600 accent-blue-500 cursor-pointer"
                                                    checked={hasExistingCustomer}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setHasExistingCustomer(checked);

                                                        // Se l'utente disattiva il cliente esistente,
                                                        // puliamo subito la selezione e la ricerca corrente.
                                                        if (!checked) {
                                                            setCustomer(null);
                                                            setCustomerSearch("");
                                                            setCustomerOptions([]);
                                                        }
                                                    }}
                                                />
                                                Quotazione per un cliente esistente?
                                            </label>
                                        )}

                                        <AnimatePresence mode="wait" initial={false}>
                                            {shouldShowCustomerSelect ? (
                                                <motion.div
                                                    key="existing-customer-select"
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.16 }}
                                                >
                                                    <span className="opacity-80 text-xs">(*) Seleziona un cliente</span>
                                                    <FDSelect
                                                        options={customerOptions.map(c => ({
                                                            value: c,
                                                            label: `${c.ragioneSociale} (${c.codiceCliente})`,
                                                        }))}
                                                        value={customer}
                                                        onChange={(v) => setCustomer(v as CustomerQuickDetailsDTO)}
                                                        placeholder="Cerca per ragione sociale, P.IVA, CF o codice…"
                                                        size="sm"
                                                        variant="outline"
                                                        radius="md"
                                                        fullWidth
                                                        searchable
                                                        loading={customerLoading}
                                                        onSearchChange={(text) => setCustomerSearch(text)}
                                                        menuMaxHeight={320}
                                                        virtualized={false} // disabilita rowH fisso + windowing
                                                        renderOption={(opt, selected) => {
                                                            const c = opt.value as CustomerQuickDetailsDTO;
                                                            return (
                                                                <div className="flex flex-col gap-1 leading-tight cursor-pointer">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-medium text-sm">
                                                                            {c.ragioneSociale}
                                                                        </span>
                                                                        <div>
                                                                            <span className={`inline-block mr-2 w-2 h-2 rounded-full ${selected ? "bg-yellow-500/80" : ""}`} />
                                                                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-500/20 text-blue-200">
                                                                                {c.codiceCliente}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                                                                        {c.partitaIVA && <span>P.IVA {c.partitaIVA}</span>}
                                                                        {c.codiceFiscale && <span>CF {c.codiceFiscale}</span>}
                                                                        {c.fido && (
                                                                            <span className="ml-auto font-medium text-xs">
                                                                                Fido: {c.fido.saldoCliente.toLocaleString("it-IT")} / {c.fido.fidoTotale.toLocaleString("it-IT")}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                </motion.div>
                                            ) : !isMepaType && (
                                                <motion.div
                                                    key="no-existing-customer-note"
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.16 }}
                                                    className="text-xs text-gray-500 dark:text-gray-400 p-2 rounded-md bg-gray-100/50 dark:bg-neutral-800/50"
                                                >
                                                    Cliente non selezionato: la quotazione verrà creata in BID PASSIVO con la dicitura “Cliente non ancora registrato”.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    <div>
                                        <label>
                                            <span className="opacity-80 text-xs">(*) Dai un Titolo a questa quotazione</span>
                                            <FDInput
                                                type="text"
                                                value={titolo}
                                                onChange={(e) => setTitolo(e.target.value)}
                                                variant="outline"
                                                size="sm"
                                                radius="md"
                                                disabled={loading || lockInteractions}
                                                placeholder="titolo.."
                                                fullWidth
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Divider */}
                                <span className="h-1 w-full pb-4 border-b border-gray-200 dark:border-neutral-900" />

                                {/* Tipologia Quotazione */}
                                <div
                                    className="space-y-2 w-full"
                                >
                                    <h3 className="opacity-80 text-xs">(*) Seleziona la tipologia di quotazione</h3>
                                    <FDSelect
                                        options={qTypes.map(type => ({ label: type.value, value: type.value }))}
                                        value={q_type}
                                        onChange={(v: any) => {
                                            setQ_Type(v); resetFormState();
                                            if (v === "LICENZE") {
                                                setFormState((prev) => ({ ...prev, isEndUser: true }))
                                            };
                                        }}
                                        placeholder="tipologia.."
                                        size="sm" variant="outline" radius="md" fullWidth searchable
                                        virtualized={false}
                                        menuMaxHeight={240}
                                        clearable={false}
                                    />

                                    {/* Descrizione tipologia selezionata */}
                                    {q_type ? (
                                        <div className="p-3 bg-yellow-200/40 dark:bg-yellow-800/40 rounded-md text-xs text-gray-600 dark:text-yellow-400 flex items-center gap-2">
                                            <CiInfoIcon className="w-12 h-12 text-yellow-500" />
                                            {qTypes.find(qt => qt.value === q_type)?.description || ""}
                                        </div>
                                    ) : null}

                                    {/** EXTRA FORM */}
                                    <div>
                                        {(isBidAttivoType || isMepaType || isLicenzeType) && <div className="flex flex-col items-center gap-4 mb-6">
                                            <span className="opacity-80 text-xs">(*) Quotazione valida per End User?, se disabilitata verrà considerata la pubblica Amministrazione</span>
                                            <div
                                                className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/80 dark:bg-neutral-900/50 px-2 py-1"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <button
                                                    type="button"
                                                    className={clsx(
                                                        "px-2 py-[3px] rounded-full text-[11px] font-medium transition",
                                                        !formState.isEndUser
                                                            ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                                                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                                                        isLicenzeType && "cursor-not-allowed opacity-50 line-through"
                                                    )}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setFormState((prev: FormStateProps) => ({
                                                            ...prev,
                                                            isEndUser: false,
                                                        }));
                                                    }}
                                                    disabled={loading || isMepaType || isLicenzeType}
                                                >
                                                    Pubblica Amministrazione
                                                </button>

                                                <FDSwitch
                                                    size="sm"
                                                    color="primary"
                                                    checked={formState.isEndUser}
                                                    ariaLabel="Mostra sconti categoria"
                                                    onClick={(event) => event.stopPropagation()}
                                                    onChange={(v: boolean) => setFormState((prev: FormStateProps) => ({
                                                        ...prev,
                                                        isEndUser: v,
                                                    }))}
                                                    disabled={loading || isMepaType || isLicenzeType}
                                                />

                                                <button
                                                    type="button"
                                                    className={clsx(
                                                        "px-2 py-[3px] rounded-full text-[11px] font-medium transition",
                                                        formState.isEndUser
                                                            ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                                                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                                                        isMepaType && "cursor-not-allowed opacity-50 line-through"
                                                    )}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setFormState((prev: FormStateProps) => ({
                                                            ...prev,
                                                            isEndUser: true,
                                                        }));
                                                    }}
                                                    disabled={loading || isMepaType || isLicenzeType}
                                                >
                                                    End User
                                                </button>
                                            </div>
                                        </div>}

                                        {/**
                                             * Se è Pubblica Amministrazione permetti la selezione di compilazione
                                             */
                                            !formState.isEndUser &&
                                            <div className="flex items-center gap-4 mt-2 justify-between">
                                                <span className="opacity-80 text-xs mr-4">{(!isBidAttivoType && !isMepaType) ? "[opzionale] Inserisci RDO o CIG " : "(*) Seleziona una valore tra RDO, CIG, Accordo Quadro o N/D"}</span>
                                                <FDSelect
                                                    options={[
                                                        { label: "RDO", value: "RDO" },
                                                        { label: "CIG", value: "CIG" },
                                                        ...(isBidAttivoType || isMepaType) ? [{ label: "Accordo Quadro", value: "ACCORDO_QUADRO" }, { label: "N/D", value: "ND" }] : [],
                                                    ] as OptionType[]}
                                                    value={formState.type.value ?? null}
                                                    onChange={(v: any) => setFormState((prev) => ({
                                                        ...prev,
                                                        type: {
                                                            value: v,
                                                            CIG: "",
                                                            RDO: "",
                                                            ACCORDO_QUADRO: "",
                                                        },
                                                    }))}
                                                    placeholder="Seleziona il tipo di cliente.."
                                                    size="sm" variant="outline" radius="md"
                                                    virtualized={false}
                                                    menuMaxHeight={240}
                                                    clearable={true}
                                                    searchable={false}
                                                    className="!w-38"
                                                />
                                            </div>
                                        }

                                        {/**
                                             * Se è End User mostra i campi di compilazione dinamici in base alla tipologia selezionata (CIG, RDO o Accordo Quadro)
                                             */}
                                        <div>
                                            {(((isBidAttivoType && !formState.isEndUser) || (isMepaType && !formState.isEndUser) || (!isBidAttivoType || !isMepaType)) && formState.type.value && formState.type.value !== "ND") &&
                                                <div className="grid grid-cols-[max-content_1fr] items-center gap-2 mt-2 justify-between sm:grid-cols-[150px_1fr]">
                                                    <span className="opacity-80 text-xs mr-4">{(!isBidAttivoType && !isMepaType) ? "[opzionale]" : "(*) Inserisci"} {`${formState.type.value}`}</span>
                                                    <FDInput
                                                        label={`Inserisci ${formState.type.value}..`}
                                                        onChange={(e) => setFormState((prev) => ({
                                                            ...prev,
                                                            type: {
                                                                ...prev.type,
                                                                [formState.type.value || ""]: e.target.value,
                                                            },
                                                        }))}
                                                        type="text"
                                                        value={(formState.type.value && formState.type.value) ? formState.type[formState.type.value] : ""}
                                                        variant="outline"
                                                        size="sm"
                                                        radius="md"
                                                        disabled={loading || !formState.type.value}
                                                        fullWidth
                                                        placeholder="esempio 123456"
                                                    />
                                                </div>
                                            }

                                            {/**
                                                 * Compilazione form dinamica nome, partita iva, email e sede legale per End User in BID ATTIVO, MEPA e LICENZE
                                                 */}
                                            {(isBidAttivoType || isMepaType || isLicenzeType) && endUserForm.map((key: endUserFormProps, index: number) => (
                                                <div key={key.key + index} className="grid grid-cols-[max-content_1fr] items-center gap-2 mt-2 justify-between sm:grid-cols-[150px_1fr]">
                                                    <span className="opacity-80 text-xs mr-4 w">{key.isRequired ? "(*)" : ""} {key.label}</span>
                                                    <FDInput
                                                        type="text"
                                                        value={formState.details[key.key as keyof FormStateProps["details"]] || ""}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const value = e.target.value;
                                                            if (key.onlyNumber && isNaN(Number(value))) {
                                                                return;
                                                            };
                                                            if (key.maxLength && value.length > key.maxLength) {
                                                                return;
                                                            }
                                                            setFormState((prev: FormStateProps) => {
                                                                const newForm = { ...prev };
                                                                newForm.details[key.key as keyof FormStateProps["details"]] = value;
                                                                return newForm;
                                                            });
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                        radius="md"
                                                        disabled={loading}
                                                        placeholder={`${key.label}..`}
                                                        fullWidth
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <span className="h-1 w-full pb-4 border-b border-gray-200 dark:border-neutral-900" />

                                {/* Date Range */}
                                <div className="w-full">
                                    <h3 className="opacity-80 text-xs">{isMepaType && "(*) "}Esplicita una scadenza per la validità della quotazione</h3>
                                    <FDDate
                                        type="datetime-local"
                                        value={toLocalDateTimeInputValue(dateTo) || undefined}
                                        onChange={(v) => { setDateTo(v ? new Date(v).toISOString() : ''); }}
                                        size="sm" variant="outline" radius="md" color="auto" fullWidth
                                        range={false}
                                        dataTooltipId="general-quotations-tooltip"
                                        dataTooltipContent={`${dateTo ?
                                            `Scadenza: ${formatISODate(dateTo)}` : "Nessuna scadenza impostata"}`}
                                    />
                                </div>

                                {/* Note */}
                                <div
                                    className="space-y-2 w-full"
                                >
                                    <h3 className="opacity-80 text-xs">Note Aggiuntive</h3>
                                    <FDTextArea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="min-h-50"
                                        variant="outline"
                                        size="sm"
                                        radius="md"
                                        disabled={loading || lockInteractions}
                                        placeholder="note.."
                                        fullWidth
                                    />
                                </div>
                            </div>

                            {/* Footers */}
                            <div className="p-4 space-y-4 w-full flex flex-col border-t border-gray-200 dark:border-neutral-900 mt-auto">
                                {/* Information */}
                                <div className="p-4 flex flex-col space-y-2
                                bg-blue-100/50 dark:bg-blue-800/10 text-blue-500 dark:text-blue-400
                                border border-blue-500 border-dashed 
                                text-xs rounded-md"
                                >
                                    <span>
                                        I campi contrassegnati con (*) sono obbligatori.
                                    </span>
                                    <span>
                                        Prima di effettuare la richiesta di quotazione verifica affidabilità
                                        ed eventuali modalità di pagamento applicabili al cliente
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-1 ml-auto">
                                    <FDButton onClick={onClose} disabled={loading || lockInteractions}>
                                        Chiudi
                                    </FDButton>
                                    <FDButton color="primary" onClick={handleCreate} disabled={loading || lockInteractions} data-tour="quotazioni-create">
                                        {loading ? "Creazione…" : "Crea una nuova quotazione"}
                                    </FDButton>
                                </div>
                            </div>

                            <FDIconButton
                                data-tour="create-chiudi"
                                icon={<MdCloseIcon size={18} />}
                                onClick={onClose}
                                disabled={lockInteractions}
                                className="absolute right-5"
                                variant="text"
                            />
                        </FDBox>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};