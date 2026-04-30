//src\layouts\promozioni\extraBar\filtersBar.tsx
import { icon_download, icon_search } from "config/icons";
import React from "react";
import FDBox from "components/UI/box/FDBox";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDSelect, { FDSelectOption } from "components/UI/input/FDSelect";
import FDInput from "components/UI/input/FDInput";


interface UserChooseProps {
    cdp: string;
    cdl: string;
}

interface FiltersBarProps {
    userChoose: UserChooseProps;
    setUserChoose: (prev: any) => void;
    DwdExcel: () => void;
    filtersData: any;
    DataRetrive: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ userChoose,
    setUserChoose, DwdExcel, filtersData, DataRetrive }) => {

    const cdlOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const arr: string[] = Array.isArray(filtersData)
            ? filtersData
                .map((e: any) => (typeof e === "object" ? e?.val : e))
                .filter((v: unknown) => typeof v === "string" && v.trim() !== "")
            : [];
        const dedup = Array.from(new Set(arr));
        dedup.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
        return dedup.map(v => ({ value: v, label: v }));
    }, [filtersData]);

    const HandleChange = ({ from, value }: { from: string; value: string | null }) => {
        setUserChoose((prev: UserChooseProps) => {
            return { ...prev, [from]: value };
        })
    }

    function allSelected() {
        if (!userChoose.cdl || !userChoose.cdp) {
            return true
        }
    }

    const filterRender = React.useMemo(() => (
        <span data-tour="promo-list-search" className="flex gap-3 w-full flex-col sm:flex-row">
            <FDSelect
                size="sm"
                radius="lg"
                variant="outline"
                searchable
                clearable
                fullWidth
                placeholder="Listino"
                // label="Listino"
                options={cdlOptions}
                value={userChoose.cdl ?? undefined}
                onChange={(v) => {
                    const next = (typeof v === "string" ? v : undefined);
                    HandleChange({ from: "cdl", value: next ?? null });
                }}
            /></span>
    ), [userChoose?.cdl, cdlOptions]);

    return (
        <FDBox
            pad="md"
            radius="lg"
            fullWidth
            className="flex flex-col gap-2"
        >
            <h1 className="text-xl font-bold">Promozioni</h1>
            <div className="flex gap-3 w-full flex-col sm:flex-row">
                <FDInput
                    data-tour="promo-cod-search"
                    size="sm"
                    variant="outline"
                    // label="Codice promo"
                    placeholder="Codice promo*"
                    radius="lg"
                    value={userChoose.cdp}
                    onChange={e => HandleChange({ from: "cdp", value: e.target.value })}
                    fullWidth
                />
                {filterRender}
                <div className="flex gap-3 justify-end">
                    <FDIconButton
                        dataTour="promo-search"
                        dataTooltipId="general-obiettivi-stocks-tooltip"
                        dataTooltipContent={allSelected() ? "Compila prima i campi" : "Cerca"}
                        icon={icon_search({ width: 20, height: 20 })}
                        onClick={() => DataRetrive()}
                        disabled={allSelected()}
                    />
                    <FDIconButton
                        dataTour="promo-download"
                        data-tour-allow
                        dataTooltipId="general-obiettivi-stocks-tooltip"
                        dataTooltipContent={allSelected() ? "Compila prima i campi e cerca" : "Download Excel"}
                        icon={icon_download({ width: 20, height: 20 })}
                        onClick={() => DwdExcel()}
                        disabled={allSelected()}
                    />
                </div>
            </div>
        </FDBox>
    )

}
