import { useRef, useState, useMemo } from "react";
// Context
import { useUserContext } from "context/UserContext";
import { useGeneralDataContext } from "context/GeneralDataContext";
// UI
import { FDButton, FDSelect, type FDSelectOption } from "@nex/fd-ui";

// Icons
import { IoCalendarOutline } from "react-icons/io5";
import { RiResetLeftFill } from "react-icons/ri";
// API
import { MakeReservationBuyerAPI } from "../fetchData/makeReservationBuyer";
// Utils
import { CheckRoleAdmin } from "utils/checkAdminPermissions";
//types
import { PROFONDITA_OPTIONS } from "../types/types";
import { GetDate } from "utils";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export interface QuickReservationMenuProps {
    onClose?: () => void;
    onSuccess?: () => void;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function QuickReservationMenu({ onClose, onSuccess }: QuickReservationMenuProps) {
    const [userContext] = useUserContext(); //user context
    const details = userContext?.details; //dettagli utente

    const { globalData } = useGeneralDataContext(); //global data (per retrive della lista dei buyers)

    // ruolo è string, usa CheckRoleAdmin per controllare se è admin/dev
    // Dev/Admin: ruolo number 0 o 1
    const ruolo = details?.ruolo;
    const isAdmin = CheckRoleAdmin({ role: ruolo || "", rolesToCheck: [0, 1] });

    // codice buyer dell'utente corrente (default)
    const userBuyer: string = (details as any)?.codici?.buyer || "";

    // Costruisci le option dei buyer dal contesto globale
    const buyerOptions: FDSelectOption<string>[] = useMemo(() => {
        return (
            globalData.buyers
                ?.filter((b) => b.codici?.buyer)
                .map((b) => ({
                    value: b.codici!.buyer!,
                    label: b.codici!.buyer!,
                })) || []
        );
    }, [globalData.buyers]);

    const [buyerCode, setBuyerCode] = useState<string | undefined>(userBuyer || undefined); //codice buyer passato (o proprio se utente ha ruolo buyer)
    const [profondita, setProfondita] = useState<number | undefined>(); //state per la profondità
    const [loading, setLoading] = useState(false); //state per il loading

    const abortRef = useRef(new AbortController());

    const isValid = profondita != null && (isAdmin ? (buyerCode?.trim().length ?? 0) > 0 : true); //validazione dati
    const date = GetDate();
    const tomorrow = date?.tomorrow; //data di domani per il testo informativo

    /** handler reset filtri */
    const handleReset = () => {
        setBuyerCode(userBuyer || undefined);
        setProfondita(undefined);
    };

    /** handler per confermare i dati */
    const handleConfirm = () => {
        if (!isValid || loading) return;

        MakeReservationBuyerAPI({
            abortController: abortRef.current,
            payload: {
                orizz_temporale: profondita!,
                ...(isAdmin && buyerCode ? { buyer: buyerCode.trim() } : {}),
            },
            setLoading,
            onSuccess: () => {
                handleReset();
                onSuccess?.();
            },
        });
    };


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <div className="w-[300px] flex flex-col gap-2 p-2">
            {/* InfoBox */}
            <div className="p-4 flex flex-col space-y-2
            bg-blue-800/10 text-blue-400
            border border-blue-500 border-dashed 
            text-xs rounded-md mb-4"
            >
                <span>
                    Prenota tutti i tuoi prodotti per domani ({tomorrow}).
                    Scegli la profondità (30 o 60 giorni) e conferma:
                    il sistema prenoterà per te tutti i prodotti,
                    per i giorni a venire fino alla profondità scelta.
                </span>
            </div>

            {/* Buyer (solo per admin/dev) */}
            {isAdmin && (
                <div className="flex flex-col w-full">
                    <span className="text-xs pl-1.5">Codice Buyer <span className="text-red-500">*</span></span>
                    <FDSelect
                        options={buyerOptions}
                        value={buyerCode}
                        onChange={(v) => setBuyerCode(typeof v === "string" ? v : undefined)}
                        size="sm"
                        radius="md"
                        color="dark"
                        fullWidth
                        clearable
                        placeholder="Seleziona buyer"
                    />
                </div>
            )}

            {/* Profondità (orizz_temporale) */}
            <div className="flex flex-col w-full">
                <span className="text-xs pl-1.5">Profondità <span className="text-red-500">*</span></span>
                <FDSelect
                    options={PROFONDITA_OPTIONS}
                    value={profondita}
                    onChange={(v) => setProfondita(typeof v === "number" ? v : undefined)}
                    size="sm"
                    radius="md"
                    color="dark"
                    fullWidth
                    clearable
                />
            </div>

            {/* Azioni */}
            <div className="flex w-full items-center justify-between mt-2">
                <FDButton
                    size="small"
                    radius="md"
                    variant="outline"
                    color="dark"
                    rightIcon={RiResetLeftFill({})}
                    onClick={handleReset}
                >
                    Reset
                </FDButton>
                <FDButton
                    variant="solid"
                    color="success"
                    size="small"
                    radius="md"
                    rightIcon={IoCalendarOutline({})}
                    onClick={handleConfirm}
                    disabled={!isValid || loading}
                    loading={loading}
                >
                    Conferma
                </FDButton>
            </div>
        </div>
    );
};

export default QuickReservationMenu;