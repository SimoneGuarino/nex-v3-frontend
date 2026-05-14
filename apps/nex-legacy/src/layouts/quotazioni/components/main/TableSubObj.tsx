import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { IQuotationBuyerProgress, QuotazioneDTO, STATE_COLOR_STYLES } from "layouts/quotazioni/types/quotations";
import { BuyerProgressCell, GlobalProgressCell } from "./BuyerProgressCell";
import { MdMoreVert } from "react-icons/md";
import { UserAvatar } from "examples/Navbars/components/userInfo";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { useTour } from "tour/TourProvider";
import { useUserContext } from "context/UserContext";


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
const MdMoreVertIcon = MdMoreVert as React.FC<{ size?: number; className?: string }>;
const PAGE_SIZE = 50;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
interface TableSubObjProps {
    data: any;
    loading: { [key: string]: boolean };
    isBuyer: boolean;
    contextMenuRef: React.MutableRefObject<any>;
    inpagination: any;
    onLoadMore: () => Promise<any>;
    handleOpenSettings: (params: { indexRow: number; allData: any[] }) => void;
    isSelected: (q: QuotazioneDTO) => boolean;
    onSelect: (q: QuotazioneDTO, multi: boolean) => void;
    setData: React.Dispatch<React.SetStateAction<any>>;
};


// ——————————————————————————————————————————————————————————
// COMPONENTS
// ——————————————————————————————————————————————————————————
/**
 * Componente per visualizzare gli avatar dei buyer associati ai progressi delle quotazioni.
 * @param buyersProgress - Array di oggetti IQuotationBuyerProgress relativi ai buyer.
 * @returns 
 */
const BuyersAvatarCell: React.FC<{ buyersProgress: IQuotationBuyerProgress[] | null, isBuyer: boolean }> = ({ buyersProgress }) => {
    const { globalData } = useGeneralDataContext();
    const { buyers } = globalData;
    type AvatarUser = {
        id: string | number;
        nome?: string;
        cognome?: string;
        immagini?: { avatar?: string; cover?: string };
        biografia?: string;
    };

    //trasforma i IQuotationBuyerProgress[] | null in avatar utenti
    if (!buyersProgress || buyersProgress && Array.isArray(buyersProgress) && buyersProgress.length === 0) {
        return <span className='text-xs text-gray-400 dark:text-gray-600'>
            Nessun utente
        </span>;
    };

    const normalizeCode = (value: unknown) => String(value ?? "").trim().toUpperCase();

    const toAvatarUser = (entry: any, fallbackId?: string) => {
        if (!entry) return null;
        return {
            id: entry?._id ?? entry?.id ?? fallbackId ?? "",
            nome: entry?.nome,
            cognome: entry?.cognome,
            immagini: entry?.immagini,
            biografia: entry?.biografia,
        };
    };

    //prendi gli utenti unici dalla lista dei buyer progress e recupera le informazioni dal contesto globale buyers
    //recuperando nome, cognome, immagini, biografia
    const users = buyersProgress.map(bp => {
        const normalizedBuyerCode = normalizeCode(bp?.buyerCode);
        if (!normalizedBuyerCode) return null;

        const buyerInfo = buyers.find(b => normalizeCode(b?.codici?.buyer) === normalizedBuyerCode);
        if (buyerInfo) return toAvatarUser(buyerInfo, normalizedBuyerCode);

        // fallback: se il payload contiene già un sotto-oggetto buyer, usiamolo
        const embeddedBuyer = (bp as any)?.buyer;
        const embeddedUser = toAvatarUser(embeddedBuyer, normalizedBuyerCode);
        if (embeddedUser) return embeddedUser;

        // fallback finale: mostriamo almeno un avatar con codice buyer
        return {
            id: normalizedBuyerCode,
            nome: normalizedBuyerCode,
            cognome: "",
            immagini: undefined,
            biografia: "",
        };
    }).filter(u => u !== null) as AvatarUser[];

    const uniqueUsers = Array.from(
        new Map(users.map((u) => [String(u.id ?? `${u.nome ?? ""}-${u.cognome ?? ""}`), u])).values()
    );

    if (uniqueUsers.length === 0) {
        return <span className='text-xs text-gray-400 dark:text-gray-600'>
            Nessun utente
        </span>;
    }

    return <div className='flex -space-x-3 items-center justify-center'>
        {uniqueUsers.slice(0, 3).map((u, i) => (
            <UserAvatar key={i} src={u.immagini?.avatar} name={u.nome} textSize="xs"
                cognome={u.cognome} size={8} cover={{ src: u.immagini?.cover, active: true }} bio={u.biografia} />
        ))}
        {uniqueUsers.length > 3 && (
            <span className="text-xs p-1 ml-4">+{uniqueUsers.length - 3} altri</span>
        )}
    </div>
};

/**
 * Componente per visualizzare l'avatar dell'agente proprietario della quotazione.
 * Usa prima i dati già presenti sulla riga, con fallback su globalData.agents tramite agenteId.
 */
const AgentAvatarCell: React.FC<{ agenteId?: string | null, agente?: any }> = ({ agenteId, agente }) => {
    const { globalData } = useGeneralDataContext();
    const { agents } = globalData;

    const agentData = React.useMemo(() => {
        const normalize = (value: unknown) => String(value ?? "").trim();
        const normalizedCandidates = Array.from(new Set([
            normalize(agenteId),
            normalize(agente?._id),
            normalize(agente?.id),
            normalize(agente?.username),
            normalize(agente?.codici?.agente),
            typeof agente === "string" ? normalize(agente) : "",
        ].filter(Boolean)));

        const toAvatarUser = (entry: any) => {
            if (!entry) return null;
            return {
                id: entry?._id ?? entry?.id ?? normalizedCandidates[0] ?? "",
                nome: entry?.nome,
                cognome: entry?.cognome,
                immagini: entry?.immagini,
                biografia: entry?.biografia,
            };
        };

        const inlineAgent =
            agente && typeof agente === "object" && Object.keys(agente).length > 0
                ? toAvatarUser(agente)
                : null;

        if (normalizedCandidates.length === 0) return inlineAgent;

        const agentInfo = (Array.isArray(agents) ? agents : []).find((a: any) => {
            const candidateKeys = [
                normalize(a?._id),
                normalize(a?.id),
                normalize(a?.username),
                normalize(a?.codici?.agente),
            ].filter(Boolean);

            return candidateKeys.some((key) => normalizedCandidates.includes(key));
        });

        // Preferiamo il record "ricco" da globalData quando trovato,
        // altrimenti manteniamo i dati presenti sulla riga.
        return toAvatarUser(agentInfo) ?? inlineAgent;
    }, [agents, agente, agenteId]);

    if (!agentData) {
        const fallbackName =
            [agente?.nome, agente?.cognome].filter(Boolean).join(" ").trim() ||
            String(agente?.username ?? agenteId ?? (typeof agente === "string" ? agente : "Agente")).trim() ||
            "Agente";

        return <div className='flex items-center justify-center'>
            <UserAvatar
                name={fallbackName}
                textSize="xs"
                size={8}
                cover={{ src: null, active: false }}
            />
        </div>;
    }

    return <div className='flex items-center justify-center'>
        <UserAvatar
            src={agentData.immagini?.avatar}
            name={agentData.nome}
            textSize="xs"
            cognome={agentData.cognome}
            size={8}
            cover={{ src: agentData.immagini?.cover, active: true }}
            bio={agentData.biografia}
        />
    </div>;
};


// ——————————————————————————————————————————————————————————
// HELPER FUNCTIONS
// ——————————————————————————————————————————————————————————
/**
 * Calcola stato scadenza partendo da finestraValidita.fine (o fallback legacy).
 * Usiamo solo la data (no ora) per evitare falsi positivi dovuti al timezone.
 */
function getExpiryMeta(row: any) {
    const raw = row?.finestraValidita?.fine ?? row?.scadenza ?? row?.dateTo;
    if (!raw) return { label: "-", daysToExpiry: null as number | null, isExpired: false, isExpiringSoon: false };

    const expiry = new Date(raw);
    if (Number.isNaN(expiry.getTime())) {
        return { label: "-", daysToExpiry: null as number | null, isExpired: false, isExpiringSoon: false };
    }

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Confronto a livello giorno (00:00) per evitare che "ieri" venga letto come 0 giorni rimanenti.
    const startExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysToExpiry = Math.ceil((startExpiry.getTime() - startToday.getTime()) / msPerDay);

    return {
        label: expiry.toLocaleDateString("it-IT"),
        daysToExpiry,
        isExpired: daysToExpiry < 0,
        isExpiringSoon: daysToExpiry >= 0 && daysToExpiry <= 5, // soglia 3-5 giorni
    };
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const TableSubObj: React.FC<TableSubObjProps> = ({ data, loading, isBuyer, contextMenuRef, inpagination, onLoadMore,
    handleOpenSettings, isSelected, onSelect, setData }) => {

    //Lock interazioni tabella quotazioni durante il tour (differenziato per ruolo) [qui isBuyer è già definito sopra]
    const [userContext] = useUserContext() as any;
    const ruolo = userContext.details.ruolo as string;
    //Lock interazioni menu filtri durante il tour (differenziato per ruolo)
    const { isOpen, index: tourIndex } = useTour();

    const isCad = ruolo === "Commerciale" || ruolo === "Admin" || ruolo === "Dev";

    const lockInteractions =
        isOpen && (
            (isCad && tourIndex === 13) ||
            (isBuyer && tourIndex === 8)
        );
    //

    // Normalizzazione semplice del campo cliente per la tabella:
    // - BID_PASSIVO: testo business leggibile
    // - altre tipologie: codice cliente reale
    const normalizedData = React.useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.map((row: any) => ({
            ...row,
            // Unifichiamo il calcolo della scadenza in un solo helper,
            // poi deriviamo la classe del "tag data" con lo stesso look di Tipologia.
            ...(() => {
                const expiryMeta = getExpiryMeta(row);
                const scadenza_validita_badge = expiryMeta.isExpired
                    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                    : expiryMeta.isExpiringSoon
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                        : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300";

                return {
                    scadenza_validita: expiryMeta.label,
                    // Se non c'e una data valida, non coloriamo la cella.
                    scadenza_validita_badge: expiryMeta.label === "-" ? "" : scadenza_validita_badge,
                };
            })(),
            // BID_PASSIVO: mostriamo la label placeholder solo se il backend indica
            // che il cliente è ancora tecnico/non registrato.
            // Se il commerciale ha già sostituito il placeholder con cliente reale,
            // qui deve comparire il codice cliente effettivo.
            cliente: (() => {
                const rawCliente = typeof row?.cliente === "string" ? row.cliente.trim() : "";
                const isPlaceholder =
                    Boolean(row?.clienteIsPlaceholder) ||
                    rawCliente === "__BID_PASSIVO_CLIENT_PLACEHOLDER__" ||
                    rawCliente === "Cliente non ancora registrato";

                if (row?.tipologia === "BID_PASSIVO" && isPlaceholder) {
                    return "Cliente non ancora registrato";
                }
                return rawCliente || "-";
            })(),
            //label ID progressivo
            prog_num_label: (() => {
                const n = row?.prog_num;
                if (typeof n !== "number" || !Number.isFinite(n)) return "-";
                // Formato business: minimo 4 cifre (1 -> 0001, 25 -> 0025, 2345 -> 2345)
                return String(n).padStart(4, "0");
            })(),

        }));
    }, [data]);


    const [columns, setColumns] = React.useState<any>([
        {
            key: [], fieldToTake: [
                {
                    key: 'Settings', type: 'button', title: 'Impostazioni Riga', ariaLabel: 'impostazioni', icon: <MdMoreVertIcon />, dataTour: "quotazione-details", funcAction: (i: any, data: any, e: any) => {
                        contextMenuRef.current = e.currentTarget;
                        handleOpenSettings({ indexRow: i, allData: data });
                    }
                },
            ], label: ' ', type: 'info', excludeLogic: true,
        },
        { key: 'prog_num_label', label: 'ID', type: 'default', sort: true, sortType: 'number', width: 100, sx: { alignItems: 'center' } },
        {
            label: "Agente", key: "agenteId",
            width: 130,
            sx: { justifyContent: "center" },
            render: ({ row }: { row: any }) => <AgentAvatarCell agenteId={row.agenteId} agente={row.agente} />,
        },
        {
            // Sort dedicato "expiry": calcolo business su date reali del record (non su stringa visualizzata).
            key: 'scadenza_validita', label: 'Scadenza validità', type: 'default', sort: true, sortType: 'expiry', width: 200, sx: { alignItems: 'center' },
            // Reimpieghiamo il look del tag di Tipologia (stesse utility class base),
            // ma il colore cambia in base allo stato della scadenza.
            render: ({ row }: { row: any }) => (
                row.scadenza_validita === "-"
                    ? <span>-</span>
                    : (
                        <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${row.scadenza_validita_badge}`}>
                            {row.scadenza_validita}
                        </span>
                    )
            ),
        },
        {
            label: "Per te", key: "myBuyerProgress",
            width: 200,
            sx: { justifyContent: "center" },
            render: ({ row }: { row: any }) => (
                isBuyer ? <BuyerProgressCell progress={row.myBuyerProgress} /> : <GlobalProgressCell buyersProgress={row.buyersProgress} />
            ),
        },
        {
            label: "Buyers", key: "buyersProgress",
            width: 130,
            sx: { justifyContent: "center" },
            render: ({ row }: { row: any }) => <BuyersAvatarCell buyersProgress={row.buyersProgress} isBuyer={isBuyer} />,
        },
        { key: 'stato', label: 'Stato', type: 'tag', tableOfColors: STATE_COLOR_STYLES, pointOfColor: true, sort: true, sortType: 'string', width: 200, sx: { alignItems: 'center' } },
        { key: 'tipologia', label: 'Tipologia', type: 'tag', sort: true, sortType: 'string', width: 200, sx: { alignItems: 'center' } },
        { key: 'valore', label: 'Valore', type: 'eur', sort: true, sortType: 'string', width: 200, sx: { alignItems: 'center' } },
        { key: 'titolo', label: 'Titolo', type: 'default', sort: true, sortType: 'string', width: 200, sx: { alignItems: 'center' } },
        { key: 'cliente', label: 'Cliente', type: 'default', sort: true, sortType: 'string', width: 200, sx: { alignItems: 'center' } },
        // Queste due colonne devono restare indipendenti con ordinamento data.
        { key: 'updated_at', label: 'Ultimo Aggiornamento', type: 'date', sort: true, sortType: 'date', width: 200, sx: { alignItems: 'center' } },
        { key: 'created_at', label: 'Creato il', type: 'date', sort: true, sortType: 'date', width: 200, sx: { alignItems: 'center' } },
    ]);

    return (
        !loading.general_data ? normalizedData && <div className="w-full h-full min-h-0 flex flex-col gap-4">
            {/* Pannello filtri */}
            <div className="w-full flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800" data-tour="quotazioni-table">
                {lockInteractions && (
                    <div
                        aria-hidden="true"
                        style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "auto" }}
                        onClickCapture={(e) => e.stopPropagation()}
                    />
                )}
                <TableVirtualized
                    className='h-full'
                    height='100%'
                    tableType='grid'
                    results={inpagination?.total || 0} // totale elementi (non quelli caricati finora)
                    data={normalizedData || []}
                    setData={setData}
                    columns={columns}
                    setColumns={setColumns}
                    loadStatus={loading.general_data}
                    whereToFindData={false}
                    footer={false}
                    headerSettings={{
                        className: {
                            main_container: 'z-20 border-b border-gray-200 dark:border-neutral-800'
                        }
                    }}
                    bodySettings={{
                        variant: 'striped',
                        isSelected,
                        onSelect,
                    }}
                    infiniteScroll={{
                        func: () => onLoadMore(),
                        loadStatus: loading.general_data,
                        numberToFetch: PAGE_SIZE,
                    }}
                />
            </div>
        </div> : <div className="min-h-[600px] lg:w-3/4 sm:w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
    );
};

export default TableSubObj;

