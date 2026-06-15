// src/layouts/sellout/components/FiltersPanel.tsx
import React, { useRef, useState, useMemo, useEffect } from "react";
import FDSelect, {
    type FDSelectOption,
} from "components/UI/input/FDSelect";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { FDBox } from "@nex/fd-ui";
import FDDate, { type FDDateSingleValue } from "components/UI/input/FDDate";
import { icon_filter, icon_search } from "config/icons";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import FDButton from "components/UI/buttons/FDButton";
import { fetchSelloutFilters } from "layouts/sellout/fetchdata/filters";
import { Tooltip } from "react-tooltip";
//icons
import { IoFilter, IoSearch } from "react-icons/io5";


export type FilterValues = {
    prfor: string | null;
    anno: string | null;
    settimana: string | null;
    da: string | null;
    a: string | null;
    inviato: "S" | "N" | null;
};

export type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

type Props = {
    values?: FilterValues;
    onChange?: (v: FilterValues) => void;
    onApply?: (v: FilterValues) => void;
    onReset?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    shouldIgnoreClose?: (reason?: CloseReason) => boolean;
};

export function FiltersPanel({ values, onChange, onApply, onReset, open, onOpenChange, shouldIgnoreClose }: Props) {
    const [localOpen, setLocalOpen] = useState(false);

    const isOpen = open ?? localOpen;
    const setOpen = onOpenChange ?? setLocalOpen;

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [fornitoriOpts, setFornitoriOpts] = useState<FDSelectOption[]>([]);
    const [anniOpts, setAnniOpts] = useState<FDSelectOption[]>([]);
    const [settimaneOpts, setSettimaneOpts] = useState<FDSelectOption[]>([]);
    const [loading, setLoading] = useState(false);

    const statoInvioOpts = useMemo<FDSelectOption[]>(
        () => [
            { label: "Inviato", value: "S" },
            { label: "Non inviato", value: "N" },
        ],
        []
    );



    const toOptions = (arr: Array<string | number>): FDSelectOption[] =>
        arr.map((v) => ({ label: String(v), value: String(v) }));

    const [localValues, setLocalValues] = useState<FilterValues>({
        prfor: null,
        anno: null,
        settimana: null,
        da: null,
        a: null,
        inviato: null,
    });

    const v = values ?? localValues;
    const setV = onChange ?? setLocalValues;

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchSelloutFilters(abortRef)
            .then((res) => {
                if (!mounted) return;
                if (!res.ok) {
                    console.error(res.error || "Errore nel recupero dei filtri");
                    setFornitoriOpts([]);
                    setAnniOpts([]);
                    setSettimaneOpts([]);
                    return;
                }
                setFornitoriOpts(toOptions(res.prfor));
                setAnniOpts(toOptions(res.anni));
                setSettimaneOpts(toOptions(res.settimane));
            })
            .catch((e) => {
                if (!mounted) return;
                console.error(e);
                setFornitoriOpts([]);
                setAnniOpts([]);
                setSettimaneOpts([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
            abortRef.current?.abort();
        };
    }, []);

    // ---- handlers coerenti con onChange: (v: unknown) => void ----
    const handleSelect =
        (key: keyof FilterValues) =>
            (val: unknown) => {
                let next: string | null = null;
                if (typeof val === "string") {
                    next = val;                          // valore singolo OK
                } else if (Array.isArray(val)) {
                    next = null;                          // non usiamo multiple
                } else if (val != null) {
                    next = String(val);                   // fallback prudente
                }
                setV({ ...v, [key]: next });
            };

    const handleDate =
        (key: "da" | "a") =>
            (val: FDDateSingleValue) => {
                setV({ ...v, [key]: val ?? null });
            };

    const handleReset = () => {
        if (onReset) onReset();
        else setLocalValues({ prfor: null, anno: null, settimana: null, da: null, a: null, inviato: null });
    };

    const handleApply = () => {
        onApply?.(v);
        if (open) setOpen(false);
    };

    const panelContent = useMemo(
        () => (
            <div className="flex flex-col gap-2 p-1">
                <div className="text-sm font-medium">Filtri</div>
                
                <div className="flex flex-col gap-1 w-full">
                    <div className="flex flex-col w-full">
                        <span className="text-xs pl-1.5">Fornitore</span>
                        <FDSelect
                            dataTour="sell-filters-forn"
                            options={fornitoriOpts}
                            size="sm"
                            variant="outline"
                            radius="md"
                            fullWidth
                            value={v.prfor ?? undefined}
                            onChange={handleSelect("prfor")}
                            disabled={loading}
                            color="dark"
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <span className="text-xs pl-1.5">Anno</span>
                        <FDSelect
                            dataTour="docs-filters-year"
                            options={anniOpts}
                            size="sm"
                            variant="outline"
                            radius="md"
                            fullWidth
                            value={v.anno ?? undefined}
                            onChange={handleSelect("anno")}
                            disabled={loading}
                            color="dark"
                        />
                    </div>

                    <div className="flex flex-col w-full">
                        <span className="text-xs pl-1.5">Settimana</span>
                        <FDSelect
                            dataTour="docs-filters-week"
                            options={settimaneOpts}
                            size="sm"
                            variant="outline"
                            radius="md"
                            fullWidth
                            value={v.settimana ?? undefined}
                            onChange={handleSelect("settimana")}
                            disabled={loading}
                            color="dark"
                        />
                    </div>

                    <div className="flex flex-col w-full">
                        <span className="text-xs pl-1.5">Stato Invio</span>
                        <FDSelect
                            dataTour="docs-filters-stat"
                            options={statoInvioOpts}
                            size="sm"
                            variant="outline"
                            radius="md"
                            fullWidth
                            value={v.inviato ?? undefined}
                            onChange={handleSelect("inviato")}
                            color="dark"
                        />
                    </div>
                </div>

                <div className="flex flex-col w-full gap-1">
                    <div className="flex flex-col w-full" data-tour="docs-filters-date-from">
                        <span className="text-xs pl-1.5">Da</span>
                        <FDDate

                            radius="md"
                            size="sm"
                            variant="outline"
                            color="dark"
                            fullWidth
                            value={v.da ?? undefined}
                            onChange={handleDate("da")}
                        />
                    </div>

                    <div className="flex flex-col w-full" data-tour="docs-filters-date-to">
                        <span className="text-xs pl-1.5">A</span>
                        <FDDate
                            radius="md"
                            size="sm"
                            variant="outline"
                            color="dark"
                            fullWidth
                            value={v.a ?? undefined}
                            onChange={handleDate("a")}
                            max=""
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="w-full flex justify-end">
                    <FDButton
                        dataTour="docs-filters-reset"
                        variant="outline"
                        color="dark"
                        size="small"
                        onClick={handleReset}
                    >
                        Reset
                    </FDButton>
                </div>
            </div>
        ),
        [fornitoriOpts, anniOpts, settimaneOpts, statoInvioOpts, loading, v, open]
    );

    return (
        <>
            <FDBox radius="2xl" className="flex items-center justify-between" pad="sm">
                <h1 className="ml-3">Sellout</h1>
                <div className="flex items-center gap-4">
                    <FDButton
                        onClick={() => setOpen(true)}
                        variant="outline"
                        size="small"
                        color="neutral"
                        radius="md"
                        rightIcon={IoFilter({})}
                        ref={triggerRef}
                        dataTooltipId="filters-panel-tooltip"
                        dataTooltipContent="filtri attivi.."
                    >
                        Filtri
                    </FDButton>

                    <FDButton
                        variant="solid"
                        color="primary"
                        size="small"
                        radius="md"
                        onClick={handleApply}
                        dataTour="docs-filters-app"
                        rightIcon={IoSearch({})}
                    >
                        Cerca
                    </FDButton>
                </div>
            </FDBox>

            <ContextMenu
                openFor={isOpen}
                pos={triggerRef}
                //onClose={() => setOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose && shouldIgnoreClose(reason)) return;
                    setOpen(false);
                }}
                panel={panelContent}
                placement="auto"
                offset={8}
                viewportPadding={8}
                portal
                className="min-w-[320px] max-w-[700px] rounded-lg"
                style={{}}
            />

            <Tooltip
                id="filters-panel-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </>
    );
}

export default FiltersPanel;
