// src/layouts/queryAS400/components/header-bar.tsx
/**
 * descrizione: header della pagina con titolo, toggle viste (salvate/adhoc), refresh e ricerca.
 * layout:
 * - md+: una riga (titolo | pulsanti+refresh | search che cresce).
 * - xs/sm: due righe. riga1 = titolo + pulsanti; riga2 = search + refresh.
 */
import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import { FDIconButton, FDButton, FDBox } from "@nex/fd-ui";
import { useSurfaceTokens } from "../hooks/use-surface-tokens";
import { MdRefresh, MdSearch } from "react-icons/md";
import type { IconType } from "react-icons";
import { Tooltip } from "@mui/material";

// wrapper icona
const RI: React.FC<{ as: IconType; size?: number | string; title?: string; className?: string }> = ({
    as: Icon,
    size = 18,
    ...rest
}) => React.createElement(Icon as React.ComponentType<any>, { size, ...rest });

export default function HeaderBar({
    activeView,
    canAdhoc,
    onChangeView,
    onRefresh,
    refreshDisabled,
    filter,
    onFilterChange,
    className,
}: {
    activeView: "saved" | "adhoc";
    canAdhoc: boolean;
    onChangeView: (v: "saved" | "adhoc") => void;
    onRefresh: () => void;
    refreshDisabled: boolean;
    filter: string;
    onFilterChange: (v: string) => void;
    className?: string;
}) {
    const { paperBg, borderColor } = useSurfaceTokens();

    const ButtonsGroup = (
        <div className="flex items-center gap-2 shrink-0">
            <FDButton
                variant={activeView === "saved" ? "solid" : "outline"}
                color="primary"
                size="small"
                onClick={() => onChangeView("saved")}
                className="!px-3"
            >
                Salvate
            </FDButton>

            {canAdhoc && (
                <FDButton
                    variant={activeView === "adhoc" ? "solid" : "outline"}
                    color="purple"
                    size="small"
                    onClick={() => onChangeView("adhoc")}
                    className="!px-3"
                >
                    Query diretta
                </FDButton>
            )}
        </div>
    );

    const RefreshButton = (
        <Tooltip title="ricarica elenco">
            <span>
                <FDIconButton
                    variant="general"
                    size="medium"
                    ariaLabel="ricarica elenco"
                    onClick={onRefresh}
                    disabled={refreshDisabled}
                    dataTooltipContent="ricarica elenco"
                    icon={<RI as={MdRefresh} size={18} />}
                />
            </span>
        </Tooltip>);

    const SearchField = (
        <TextField
            size="small"
            placeholder="cerca tra le queries salvate…"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            fullWidth
            sx={{ minWidth: 0 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <RI as={MdSearch} size={18} />
                    </InputAdornment>
                ),
            }}
        />
    );

    return (
        <FDBox
            radius="2xl"
            shadow="sm"
            className={`rounded-2xl border overflow-hidden ${className ?? ""}`}
            style={{ background: paperBg, borderColor: String(borderColor) }}
        >
            <div className="p-4">
                {/* md+ : layout su una riga */}
                <div className="hidden md:flex items-center gap-4">
                    <h2 className="m-0 text-lg font-semibold shrink-0">Queries AS400</h2>

                    <div className="flex items-center gap-2 shrink-0 mr-2">
                        {ButtonsGroup}
                        {RefreshButton}
                    </div>

                    <div className="ml-auto min-w-0 grow basis-0">{SearchField}</div>
                </div>

                {/* xs/sm : due righe */}
                <div className="flex md:hidden flex-col gap-3">
                    {/* riga 1: titolo + pulsanti */}
                    <div className="flex items-center gap-4">
                        <h2 className="m-0 text-lg font-semibold shrink-0">Queries AS400</h2>
                        <div className="shrink-0">{ButtonsGroup}</div>
                    </div>

                    {/* riga 2: search + refresh */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="min-w-0 grow shrink">{SearchField}</div>
                        {RefreshButton}
                    </div>
                </div>
            </div>
        </FDBox>
    );
}
