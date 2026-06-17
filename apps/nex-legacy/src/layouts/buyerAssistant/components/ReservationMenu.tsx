import * as React from "react";
// UI
import { FDButton, FDDate, FDSelect, type FDSelectOption, FDSelectValue} from "@nex/fd-ui";
// icons
import { IoCalendarOutline } from "react-icons/io5";
import { RiResetLeftFill } from "react-icons/ri";
// fetch
import { MakeReservationAPI } from "../fetchData/makeReservation";
// types
import { BrandDoc, PROFONDITA_OPTIONS } from "../types/types";
// utils
import { safeArray } from "../utils/utils";
import { GetDate } from "utils";
import { daysBetween } from "utils/date/getDate";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export interface ReservationMenuProps {
    brands: BrandDoc[];
    brandsLoading: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
}


// ——————————————————————————————————————————————————————————
// SMALL UTILS (pure)
// ——————————————————————————————————————————————————————————
function sortOpts(opts: FDSelectOption<string>[]): FDSelectOption<string>[] {
    return [...opts].sort((a, b) =>
        String(a.label).localeCompare(String(b.label), "it", { sensitivity: "base" })
    );
};

function asString(v: FDSelectValue<string>): string | null {
    return typeof v === "string" ? v : null;
};

function asNumber(v: FDSelectValue<number>): number | null {
    return typeof v === "number" ? v : null;
};


// ——————————————————————————————————————————————————————————
// PRESENTATIONAL (memoized) BUILDING BLOCKS
// ——————————————————————————————————————————————————————————
type FieldShellProps = {
    label: React.ReactNode;
    required?: boolean;
    rightLabel?: React.ReactNode;
    children: React.ReactNode;
    errorText?: string | null;
};

const FieldShell = React.memo(function FieldShell({
    label,
    required,
    rightLabel,
    children,
    errorText,
}: FieldShellProps) {
    return (
        <div className="flex flex-col w-full gap-1">
            <div className="flex items-center justify-between">
                <span className="text-xs pl-1.5">
                    {label}{" "}
                    {required ? <span className="text-red-500">*</span> : null}
                </span>
                {rightLabel ? <span className="text-xs pr-1.5">{rightLabel}</span> : null}
            </div>

            {children}

            {errorText ? (
                <div className="text-xs text-red-500 pl-1.5">{errorText}</div>
            ) : null}
        </div>
    );
});

type SelectFieldProps<T> = {
    label: React.ReactNode;
    required?: boolean;
    loading?: boolean;

    options: FDSelectOption<T>[];
    value?: FDSelectValue<T>;
    onChange: (v: FDSelectValue<T>) => void;

    disabled?: boolean;
    searchable?: boolean;
    clearable?: boolean;
};

const SelectField = React.memo(function SelectField<T>({
    label,
    required,
    loading,
    options,
    value,
    onChange,
    disabled,
    searchable,
    clearable,
}: SelectFieldProps<T>) {
    return (
        <FieldShell label={label} required={required}>
            {loading ? (
                <div className="h-8 w-full bg-neutral-700 rounded animate-pulse" />
            ) : (
                <FDSelect
                    options={options}
                    value={value}
                    onChange={onChange as any}
                    size="sm"
                    radius="md"
                    color="dark"
                    searchable={searchable}
                    clearable={clearable}
                    fullWidth
                    disabled={disabled}
                />
            )}
        </FieldShell>
    );
}) as <T>(p: SelectFieldProps<T>) => JSX.Element;

// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function ReservationMenu({ brands, brandsLoading, onClose, onSuccess }: ReservationMenuProps) {
    // Form state
    const [brandSel, setBrandSel] = React.useState<string | null>(null); // required
    const [lineaSel, setLineaSel] = React.useState<string | null>(null);
    const [gruppoSel, setGruppoSel] = React.useState<string | null>(null);
    const [famigliaSel, setFamigliaSel] = React.useState<string | null>(null);
    const [prefissoSel, setPrefissoSel] = React.useState<string | null>(null);

    const [profondita, setProfondita] = React.useState<number | null>(null); // required
    const [dataEsecuzione, setDataEsecuzione] = React.useState<string | undefined>(undefined); // required
    const [isInterval, setIsInterval] = React.useState(false);
    const [dataFine, setDataFine] = React.useState<string | undefined>(undefined); // required if interval

    const [loading, setLoading] = React.useState(false);

    // Abort controller per la chiamata (riusato)
    const abortRef = React.useRef(new AbortController());

    // ─── Options a cascata (brand => linea => gruppo => famiglia) ───
    const brandOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        safeArray(brands).forEach((b) => {
            const m = b.Marca?.trim();
            if (!m || seen.has(m)) return;
            seen.add(m);
            opts.push({ value: m, label: m });
        });
        return sortOpts(opts);
    }, [brands]);

    const filteredBrands = React.useMemo(
        () => (brandSel ? safeArray(brands).filter((b) => b.Marca === brandSel) : safeArray(brands)),
        [brands, brandSel]
    );

    const lineaOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        filteredBrands.forEach((b) =>
            safeArray(b.Categories).forEach((cat) => {
                if (!cat.Linea || seen.has(cat.Linea)) return;
                seen.add(cat.Linea);
                opts.push({ value: cat.Linea, label: cat.DescrizioneLinea || cat.Linea });
            })
        );
        return sortOpts(opts);
    }, [filteredBrands]);

    const gruppoOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        filteredBrands.forEach((b) =>
            safeArray(b.Categories)
                .filter((cat) => !lineaSel || cat.Linea === lineaSel)
                .forEach((cat) =>
                    safeArray(cat.SubCategory).forEach((sub) => {
                        if (!sub.Gruppo || seen.has(sub.Gruppo)) return;
                        seen.add(sub.Gruppo);
                        opts.push({ value: sub.Gruppo, label: sub.DescrizioneGruppo || sub.Gruppo });
                    })
                )
        );
        return sortOpts(opts);
    }, [filteredBrands, lineaSel]);

    const famigliaOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        filteredBrands.forEach((b) =>
            safeArray(b.Categories)
                .filter((cat) => !lineaSel || cat.Linea === lineaSel)
                .forEach((cat) =>
                    safeArray(cat.SubCategory)
                        .filter((sub) => !gruppoSel || sub.Gruppo === gruppoSel)
                        .forEach((sub) =>
                            safeArray(sub.famiglie).forEach((fam) => {
                                if (!fam.famiglia || seen.has(fam.famiglia)) return;
                                seen.add(fam.famiglia);
                                opts.push({
                                    value: fam.famiglia,
                                    label: fam.descrizioneFamiglia || fam.famiglia,
                                });
                            })
                        )
                )
        );
        return sortOpts(opts);
    }, [filteredBrands, lineaSel, gruppoSel]);

    // Prefisso options (raccoglie PrefissiFornitore da brand filtrati)
    const prefissoOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const seen = new Set<string>();
        const opts: FDSelectOption<string>[] = [];
        filteredBrands.forEach((b) => {
            safeArray<string>((b as any).PrefissiFornitore).forEach((p) => {
                const code = (p || "").trim();
                if (!code || seen.has(code)) return;
                seen.add(code);
                opts.push({ value: code, label: code });
            });
        });
        return sortOpts(opts);
    }, [filteredBrands]);

    // ─── Min date: domani ───
    const minDate = React.useMemo(() => GetDate().tomorrow, []);

    // ─── Validazione date (memoized) ───
    const { dateError, isValid } = React.useMemo(() => {
        const de = dataEsecuzione || "";
        const df = dataFine || "";

        let err: string | null = null;
        if (!de) {
            err = "Seleziona la data di esecuzione (obbligatoria).";
        } else if (isInterval) {
            if (!df) {
                err = "Hai selezionato l'intervallo: inserisci la data di fine.";
            } else {
                const diff = daysBetween(de, df);
                if (diff === null) err = "Formato data non valido.";
                else if (diff < 0) err = "La data di fine deve essere uguale o successiva alla data iniziale.";
                else if (diff > 30) err = "L'intervallo non può superare i 30 giorni.";
            }
        }

        const ok =
            !!brandSel &&
            profondita != null &&
            !!de &&
            (!isInterval || !!df) &&
            !err;

        return { dateError: err, isValid: ok };
    }, [brandSel, profondita, dataEsecuzione, dataFine, isInterval]);


    // ——————————————————————————————————————————————————————————
    // HANDLERS (stable)
    // ——————————————————————————————————————————————————————————
    const handleReset = React.useCallback(() => {
        setBrandSel(null);
        setLineaSel(null);
        setGruppoSel(null);
        setFamigliaSel(null);
        setPrefissoSel(null);

        setProfondita(null);
        setDataEsecuzione(undefined);
        setIsInterval(false);
        setDataFine(undefined);
    }, []);

    const handleBrandChange = React.useCallback((v: FDSelectValue<string>) => {
        console.log("Brand changed:", v);
        setBrandSel(asString(v));

        // reset cascade
        setLineaSel(null);
        setGruppoSel(null);
        setFamigliaSel(null);
        setPrefissoSel(null);
    }, []);

    const handlePrefissoChange = React.useCallback((v: FDSelectValue<string>) => {
        setPrefissoSel(asString(v));
    }, []);

    const handleLineaChange = React.useCallback((v: FDSelectValue<string>) => {
        setLineaSel(asString(v));
        // reset cascade
        setGruppoSel(null);
        setFamigliaSel(null);
    }, []);

    const handleGruppoChange = React.useCallback((v: FDSelectValue<string>) => {
        setGruppoSel(asString(v));
        // reset cascade
        setFamigliaSel(null);
    }, []);

    const handleFamigliaChange = React.useCallback((v: FDSelectValue<string>) => {
        setFamigliaSel(asString(v));
    }, []);

    const handleProfonditaChange = React.useCallback((v: FDSelectValue<number>) => {
        setProfondita(asNumber(v));
    }, []);

    const handleIntervalToggle = React.useCallback(() => {
        setIsInterval((prev) => !prev);
        setDataFine(undefined);
    }, []);

    const handleConfirm = React.useCallback(() => {
        if (!isValid || loading) return;

        MakeReservationAPI({
            abortController: abortRef.current,
            payload: {
                brand: brandSel!,
                ...(lineaSel ? { linea: lineaSel } : {}),
                ...(gruppoSel ? { gruppo: gruppoSel } : {}),
                ...(famigliaSel ? { famiglia: famigliaSel } : {}),
                ...(prefissoSel ? { prefisso: prefissoSel } : {}),
                orizz_temporale: profondita!,
                data_esecuzione: dataEsecuzione!,
                ...(isInterval && dataFine ? { data_fine: dataFine } : {}),
            },
            setLoading,
            onSuccess: () => {
                handleReset();
                onSuccess?.();
            },
        });
    }, [
        isValid,
        loading,
        brandSel,
        lineaSel,
        gruppoSel,
        famigliaSel,
        prefissoSel,
        profondita,
        dataEsecuzione,
        isInterval,
        dataFine,
        handleReset,
        onSuccess,
    ]);


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <div className="w-full max-w-[420px] sm:w-[350px] max-h-full flex flex-col gap-2 p-3">
            {/* Header - InfoBox */}
            <div className="p-4 flex flex-col space-y-2
            bg-blue-800/10 text-blue-400
            border border-blue-500 border-dashed 
            text-xs rounded-md mb-4"
            >
                <span>
                    Prenota i prodotti che vuoi per i giorni successivi!, partendo da domani.
                    Scegli i filtri che preferisci, la profondità (30 o 60 giorni) e conferma: 
                    il sistema prenoterà per te tutti i prodotti che rispettano i criteri selezionati, 
                    per i giorni a venire fino alla profondità scelta.
                </span>
            </div>

            <SelectField
                label="Brand"
                required
                loading={brandsLoading}
                options={brandOptions}
                value={brandSel}
                onChange={handleBrandChange}
                searchable
                clearable
            />

            <SelectField
                label="Prefisso"
                loading={brandsLoading}
                options={prefissoOptions}
                value={prefissoSel}
                onChange={handlePrefissoChange}
                clearable
                disabled={!brandSel}
            />

            <SelectField
                label="Linea"
                loading={brandsLoading}
                options={lineaOptions}
                value={lineaSel}
                onChange={handleLineaChange}
                searchable
                clearable
            />

            <SelectField
                label="Gruppo"
                loading={brandsLoading}
                options={gruppoOptions}
                value={gruppoSel}
                onChange={handleGruppoChange}
                searchable
                clearable
            />

            <SelectField
                label="Famiglia"
                loading={brandsLoading}
                options={famigliaOptions}
                value={famigliaSel}
                onChange={handleFamigliaChange}
                searchable
                clearable
            />

            <FieldShell
                label={isInterval ? "Da" : "Data"}
                required
                rightLabel="Intervallo"
                errorText={dateError}
            >
                <div className="flex items-center justify-between gap-2 w-full">
                    <FDDate
                        size="sm"
                        radius="md"
                        color="dark"
                        value={dataEsecuzione}
                        min={minDate}
                        onChange={setDataEsecuzione}
                        fullWidth
                    />
                    <input
                        type="checkbox"
                        className="w-4 h-4 mr-1.5 cursor-pointer"
                        checked={isInterval}
                        onChange={handleIntervalToggle}
                        aria-label="Attiva intervallo date"
                    />
                </div>
            </FieldShell>

            {isInterval ? (
                <FieldShell label="A" required>
                    <FDDate
                        size="sm"
                        radius="md"
                        color="dark"
                        value={dataFine}
                        min={dataEsecuzione || minDate}
                        onChange={setDataFine}
                        fullWidth
                    />
                </FieldShell>
            ) : null}

            <SelectField<number>
                label="Profondità"
                required
                options={PROFONDITA_OPTIONS}
                value={profondita}
                onChange={handleProfonditaChange}
                clearable
            />

            {/* Footer */}
            <div className="flex w-full items-center justify-between mt-1 gap-2">
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

                <div className="flex items-center gap-2">
                    {onClose ? (
                        <FDButton
                            size="small"
                            radius="md"
                            variant="outline"
                            color="dark"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Chiudi
                        </FDButton>
                    ) : null}

                    <FDButton
                        variant="solid"
                        color="primary"
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
        </div>
    );
}

export default ReservationMenu;