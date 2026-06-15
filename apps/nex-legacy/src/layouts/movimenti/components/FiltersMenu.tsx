"use client";
import { FDDate, FDSelect, FDButton, FDSkeletonLayout, FDSkeletonSwitch } from "@nex/fd-ui";

import { LuTriangleAlert } from "react-icons/lu";

const LuTriangleAlertIcon = LuTriangleAlert as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface SelectOption {
    label: string;
    value: string | number;
};

interface FiltersMenuProps {
    causaliOptions: SelectOption[];
    loading: boolean;
    causale1?: string | number;
    setCausale1: (value: string | number | undefined) => void;
    causale2?: string | number;
    setCausale2: (value: string | number | undefined) => void;
    dataInizio?: string;
    setDataInizio: (value: string | undefined) => void;
    dataFine?: string;
    setDataFine: (value: string | undefined) => void;
    onReset?: () => void;
};

export interface ValidationErrors {
    causale1?: string;
    causale2?: string;
    dateRange?: string;
};

export interface FilterValues {
    causale1?: string | number;
    causale2?: string | number;
    dataInizio?: string;
    dataFine?: string;
};


// ——————————————————————————————————————————————————————————
// CONSTANTS & UTILS
// ——————————————————————————————————————————————————————————
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Parsa una stringa data in oggetto Date
 * @param dateStr 
 * @returns 
 */
function parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Valida i filtri e restituisce eventuali errori
 * @param filters 
 * @returns 
 */
function validateFilters(filters: FilterValues): ValidationErrors {
    const errors: ValidationErrors = {};

    // Causale 1 obbligatoria
    if (!filters.causale1) {
        errors.causale1 = "Causale 1 è obbligatoria";
    };

    // Validazione intervallo date - OBBLIGATORIO
    const hasStartDate = !!filters.dataInizio;
    const hasEndDate = !!filters.dataFine;

    if (!hasStartDate) {
        errors.dateRange = "Data inizio è obbligatoria";
    } else if (!hasEndDate) {
        errors.dateRange = "Data fine è obbligatoria";
    } else if (!DATE_FORMAT_REGEX.test(filters.dataInizio!) || !DATE_FORMAT_REGEX.test(filters.dataFine!)) {
        errors.dateRange = "Formato data non valido";
    } else {
        const startDate = parseDate(filters.dataInizio);
        const endDate = parseDate(filters.dataFine);

        if (!startDate || !endDate) {
            errors.dateRange = "Date non valide";
        } else if (startDate > endDate) {
            errors.dateRange = "Data inizio non può essere dopo data fine";
        } else if (endDate.getTime() - startDate.getTime() > ONE_YEAR_MS) {
            errors.dateRange = "Intervallo massimo: 1 anno";
        };
    };

    return errors;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Menu filtri per la ricerca movimenti
 */
export function FiltersMenu({
    causaliOptions,
    loading,
    causale1,
    setCausale1,
    causale2,
    setCausale2,
    dataInizio,
    setDataInizio,
    dataFine,
    setDataFine,
    onReset,
}: FiltersMenuProps) {
    // Valida filtri ad ogni modifica
    const filters: FilterValues = { causale1, causale2, dataInizio, dataFine };
    const errors = validateFilters(filters);

    // Data di oggi in formato YYYY-MM-DD (limite massimo per le date)
    const today = new Date().toISOString().split('T')[0];

    const layout = {
        type: "col",
        gap: 0.75,
        children: [
            { type: "block", className: "h-8 w-full" }, // titolo
            { type: "block", className: "h-8 w-full" },
        ],
    } as const;


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <div className="w-[360px] flex flex-col gap-2">
            {/* Header */}
            <div className="text-sm font-medium">Filtri</div>

            <FDSkeletonSwitch
                loading={loading}
                skeleton={<FDSkeletonLayout layout={layout} />}
            >
                <FDSelect
                    fullWidth
                    size="sm"
                    radius="md"
                    color="dark"
                    label={<span>Causale 1 <span className="text-red-500">*</span></span>}
                    animatedLabel={false}
                    searchable
                    options={causaliOptions}
                    value={causale1 ?? undefined}
                    onChange={(v) => setCausale1(v as string | number | undefined)}
                />

                <FDSelect
                    fullWidth
                    size="sm"
                    radius="md"
                    color="dark"
                    label="Causale 2"
                    animatedLabel={false}
                    searchable
                    options={causaliOptions}
                    value={causale2 ?? undefined}
                    onChange={(v) => setCausale2(v as string | number | undefined)}
                    disabled={!causale1}
                />
            </FDSkeletonSwitch>

            <div className="w-full flex flex-col">
                <span className="text-xs ml-1.5">
                    Range di date <span className="text-red-500">*</span>
                </span>
                <FDDate
                    range
                    fromLabel="Da"
                    toLabel="A"
                    value={{
                        from: dataInizio || undefined,
                        to: dataFine || undefined,
                    }}
                    onChange={(v) => {
                        setDataInizio(v.from ?? "");
                        setDataFine(v.to ?? "");
                    }}
                    fullWidth
                    color="dark"
                    max={today}
                    size="sm"
                    radius="md"
                />
            </div>

            {/* Information */}
            {(errors && Object.keys(errors).length > 0) && <div className="p-4 flex flex-col space-y-2
                bg-red-800/10 text-red-400
                border border-red-500 border-dashed 
                text-xs rounded-md"
            >
                <span><LuTriangleAlertIcon size={22} className="inline-block"/> I campi contrassegnati con (*) sono obbligatori e devono essere compilati correttamente.</span>
                <div className="flex flex-col mt-2">
                    {errors.causale1 && <span><strong>Causale 1:</strong> {errors.causale1}</span>}
                    {errors.causale2 && <span><strong>Causale 2:</strong> {errors.causale2}</span>}
                    {errors.dateRange && <span><strong>Intervallo date:</strong> {errors.dateRange}</span>}
                </div>
            </div>}

            <div className="w-full flex justify-end">
                <FDButton
                    size="small"
                    radius="md"
                    variant="outline"
                    color="dark"
                    onClick={onReset}
                >
                    Reset
                </FDButton>
            </div>
        </div >
    );
}

export default FiltersMenu