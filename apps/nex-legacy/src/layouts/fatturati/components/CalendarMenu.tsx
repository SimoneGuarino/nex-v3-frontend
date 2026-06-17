import React, { useMemo } from "react";
import { FDSelect, type FDSelectOption, FDButton, FDDate, type FDDateRangeValue} from "@nex/fd-ui";
import type { CompareMode } from "../fetchdata/admin/series";
import { useTour } from "tour/TourProvider";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export interface CalendarMenuProps {
    from: string;
    to: string;
    setRange: (v: FDDateRangeValue) => void;

    compareMode: CompareMode;
    setCompareMode: (m: CompareMode) => void;

    compareFrom: string;
    compareTo: string;
    setCompareRange: (v: FDDateRangeValue) => void;

    compareOptions: FDSelectOption[];

    onResetAll?: () => void;
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Restituisce la data odierna in formato YYYY-MM-DD (usata come max per il date picker)
 * @returns
 */
function getTodayISO(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pannello calendario: selezione intervallo principale e confronto (yoy/custom)
 * @param props
 * @returns
 */
const CalendarMenu: React.FC<CalendarMenuProps> = ({
    from,
    to,
    setRange,
    compareMode,
    setCompareMode,
    compareFrom,
    compareTo,
    setCompareRange,
    compareOptions,
    onResetAll,
}) => {
    const todayStr = useMemo(() => getTodayISO(), []); //max per il date picker

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 3);

    return (
        <div className="flex flex-col gap-3 min-w-[420px] p-1" data-tour="fatturati-topbar-intervallo-2">
            {lockInteractions && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: "auto",
                    }}
                    onClickCapture={(e) => e.stopPropagation()}
                />
            )}
            <span className="text-sm font-medium">Intervallo</span>

            <div className="flex flex-col">
                <div className="flex justify-between text-xs mx-2">
                    <span>Da</span>
                    <span>A</span>
                </div>

                <FDDate
                    range
                    fromLabel=""
                    toLabel=""
                    value={{ from, to }}
                    onChange={setRange}
                    fullWidth
                    size="sm"
                    color="dark"
                    clearable={false}
                    max={todayStr}
                    radius="md"
                />
            </div>

            <div className="flex flex-col">
                <span className="text-xs ml-2">Confronto</span>

                <FDSelect
                    options={compareOptions}
                    value={compareMode}
                    onChange={(v) => {
                        if (typeof v === "string") setCompareMode(v as CompareMode);
                    }}
                    fullWidth
                    color="dark"
                    variant="outline"
                    clearable={false}
                    size="sm"
                    radius="md"
                />
            </div>

            {compareMode === "custom" && (
                <div className="flex flex-col">
                    <div className="flex justify-between text-xs mx-2">
                        <span>Confronto da</span>
                        <span>Confronto a</span>
                    </div>

                    <FDDate
                        range
                        fromLabel=""
                        toLabel=""
                        value={{
                            from: compareFrom || undefined,
                            to: compareTo || undefined,
                        }}
                        onChange={setCompareRange}
                        fullWidth
                        color="dark"
                        max={todayStr}
                        size="sm"
                        radius="md"
                    />
                </div>
            )}

            <div className="flex justify-end pt-1">
                <FDButton
                    size="small"
                    radius="md"
                    variant="outline"
                    color="dark"
                    onClick={onResetAll}
                >
                    Reset
                </FDButton>
            </div>
        </div>
    );
};

export default CalendarMenu;
