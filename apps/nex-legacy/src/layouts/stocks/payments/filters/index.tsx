// src/layouts/stocks/payments/filters/index.tsx
import React from "react";
import { Skeleton } from "@mui/material";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { MainTheme } from "assets/settingsTheme";
import FDButton from "components/UI/buttons/FDButton";
import FDDate from "components/UI/input/FDDate";
import FDSelect, { FDSelectOption } from "components/UI/input/FDSelect";
import FDInput from "components/UI/input/FDInput";
import { icon_search } from "config/icons";
import type { UserChoose, Customer } from "../types";

/** --- Tipi --- */
// Customer è importato da ../types.ts ed è riesportato
export type { Customer };

type Permissions = unknown;
type UserDetails = {
    ruolo: string | number;
    permissions?: Permissions;
};
type UserContextT = { details: UserDetails };

type LoadStatus = { filters: boolean; search: boolean };

type Agent = {
    codici?: { agente?: string | null } | null;
    nome?: string;
    cognome?: string;
};
type GlobalData = { agents: Agent[] };

/* Helpers conversione data */
function isoToIt(iso?: string): string | null {
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return null;
    return `${d}/${m}/${y}`;
}
function itToIso(it?: string | null): string | undefined {
    if (!it) return undefined;
    const [d, m, y] = it.split("/");
    if (!d || !m || !y) return undefined;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function FiltersPanel({
    userContext,
    filtersData,
    userChoose,
    setUserChoose,
    loadStatus,
    onApply,
}: {
    userContext: UserContextT;
    filtersData: Customer[];
    userChoose: UserChoose;
    setUserChoose: React.Dispatch<React.SetStateAction<UserChoose>>;
    loadStatus: LoadStatus;
    onApply: () => void;
}) {
    const palette = MainTheme().palette;
    const { globalData } = useGeneralDataContext() as { globalData: GlobalData };

    const checkAdmin = CheckAdminPermissions({
        userRole: String(userContext.details.ruolo),
        permissions: userContext.details.permissions,
        panelToCheck: "pagamenti",
        where: 0,
    });

    // Consenti filtro agenti anche per "Amministrativo"
    const canFilterByAgent =
        checkAdmin || String(userContext.details.ruolo) === "Amministrativo";

    const handleFilterChange = React.useCallback(
        (type: "string" | "bool", from: keyof UserChoose, e: unknown) => {
            switch (type) {
                case "string": {
                    setUserChoose((prev) => ({ ...prev, [from]: (e as string) ?? null }));
                    break;
                }
                case "bool": {
                    setUserChoose((prev) => ({ ...prev, [from]: Boolean(e) }));
                    break;
                }
            }
        },
        [setUserChoose]
    );

    /* Opzioni AGENTI per FDSelect (normalizzate/deduplicate/ordinate) */
    const agentOptions: FDSelectOption<string>[] = React.useMemo(() => {
        const uniq = new Map<string, FDSelectOption<string>>();

        for (const a of globalData.agents || []) {
            const raw = a?.codici?.agente;
            if (raw == null) continue;

            const code = String(raw).trim().toUpperCase();
            if (!code) continue;

            const name = `${a.nome ?? ""} ${a.cognome ?? ""}`.trim();
            const label = name ? `${code} - ${name}` : code;

            if (!uniq.has(code)) {
                uniq.set(code, { value: code, label });
            }
        }

        const arr = Array.from(uniq.values());
        arr.sort((x, y) =>
            x.label.toUpperCase().localeCompare(y.label.toUpperCase(), "it", { sensitivity: "base" })
        );
        return arr;
    }, [globalData.agents]);

    /* Opzioni CLIENTI per FDSelect (filtrate per agente se presente) */
    const clientOptions: FDSelectOption<string>[] = React.useMemo(() => {
        const selectedAgent = userChoose.acd ? String(userChoose.acd).toUpperCase() : null;
        const base = selectedAgent
            ? (filtersData || []).filter(
                (e) => String(e.CodiceAgente).toUpperCase() === selectedAgent
            )
            : filtersData || [];

        return base
            .map((c) => ({
                value: c.CodiceCliente,
                label: `${c.CodiceCliente} - ${c.RagioneSociale}`,
            }))
            .sort((a, b) => a.label.toUpperCase().localeCompare(b.label.toUpperCase()));
    }, [filtersData, userChoose.acd]);

    /* Valore range per FDDate (accetta ISO), noi convertiamo da/verso dd/MM/yyyy */
    const rangeValue = React.useMemo(
        () => ({
            from: itToIso(userChoose.ird),  // ird = data inizio (DA)
            to: itToIso(userChoose.erd),    // erd = data fine (A)
        }),
        [userChoose.erd, userChoose.ird]
    );

    return (
        <div className="w-[min(92vw,520px)] max-w-full space-y-4 p-1">
            {/* Header */}
            <div className="flex w-full justify-between items-center">
                <div className="text-sm font-medium">Filtri</div>
                <FDButton
                    variant="outline"
                    color="dark"
                    size="small"
                    dataTour="payments-filters-reset"
                    onClick={() =>
                        setUserChoose((prev) => ({
                            ...prev,
                            nmv: "",
                            acd: null,
                            ccd: null,
                            dateRange: false,
                            ird: null,
                            erd: null,
                        }))
                    }
                >
                    Reset
                </FDButton>
            </div>

            {/* titolo / descrizione */}
            <div className="mb-3" data-tour="payments-filters-mov">
                <p className="text-xs mb-3">
                    Cerca gli elementi per codice di movimento, con possibilità di combinare gli altri filtri per avere una ricerca più specifica.
                </p>
                <FDInput
                    placeholder="Cerca qui un n. di movimento specifico"
                    variant="outline"
                    color="dark"
                    size="sm"
                    rightIcon={icon_search()}
                    fullWidth
                    onChange={(e) => handleFilterChange("string", "nmv", e.target.value)}
                    radius="md"
                />
            </div>

            {/* commerciale (solo admin e amministrativo) -> FDSelect */}
            {canFilterByAgent && (
                <div className="mb-3 flex w-full flex-col gap-1" data-tour="payments-filters-comm">
                    <p className="text-xs">
                        Seleziona il commerciale di interesse o lascia vuoto per selezionarli tutti
                    </p>

                    <FDSelect
                        options={agentOptions}
                        value={userChoose.acd ? String(userChoose.acd).toUpperCase() : undefined}
                        onChange={(v) => {
                            const raw = v as string | undefined;
                            const val = raw ? raw.toUpperCase() : null;
                            setUserChoose((prev) => ({ ...prev, acd: val }));
                            // se cambi agente, reset cliente se non appartiene al nuovo agente
                            if (val === null || prevClientNoLongerMatches(val, userChoose.ccd, filtersData)) {
                                setUserChoose((prev) => ({ ...prev, ccd: null }));
                            }
                        }}
                        searchable
                        placeholder="Commerciali"
                        fullWidth
                        variant="outline"
                        color="dark"
                        size="sm"
                        radius="md"
                    />
                </div>
            )}

            {/* cliente -> FDSelect */}
            {!loadStatus.filters ? (
                <div className="mb-3 flex w-full flex-col gap-1" data-tour="docs-filters-cust">
                    <p className="text-xs">
                        Seleziona il cliente di interesse o lascia vuoto per selezionarli tutti
                    </p>

                    <FDSelect
                        options={clientOptions}
                        value={userChoose.ccd ?? undefined}
                        onChange={(v) => {
                            const val = (v as string | undefined) ?? null;
                            setUserChoose((prev) => ({ ...prev, ccd: val }));
                        }}
                        searchable
                        placeholder="Cliente"
                        fullWidth
                        variant="outline"
                        color="dark"
                        size="sm"
                        radius="md"
                    />
                </div>
            ) : (
                <Skeleton sx={{ width: "100%", height: 100 }} />
            )}

            {/* range date (con FDDate range) */}
            <div className="mb-3 flex w-full flex-col gap-2" data-tour="docs-filters-check">
                <p className="text-xs">
                    Seleziona un range di date per vedere i pagamenti in quell’arco temporale, ad es. (12/07/2023 a Oggi)
                </p>

                <div className="flex flex-row items-center gap-2">
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={Boolean(userChoose.dateRange)}
                        onChange={(e) => {
                            const enabled = e.target.checked;
                            handleFilterChange("bool", "dateRange", enabled);
                            setUserChoose((prev) => ({
                                ...prev,
                                // quando attivi il range, svuota entrambi
                                ird: enabled ? null : prev.ird,
                                erd: enabled ? null : prev.erd,
                            }));
                        }}
                    />
                    <span className="text-xs font-medium text-[#979797]">Attiva filtro date range</span>
                </div>

                {userChoose.dateRange && (
                    <div className="mt-3 flex w-full flex-col gap-2">
                        <FDDate
                            range
                            fromLabel="DA"
                            toLabel="A"
                            value={rangeValue}
                            onChange={(v) =>
                                setUserChoose((prev) => ({
                                    ...prev,
                                    ird: isoToIt(v.from) ?? null,  // ird = data inizio (DA)
                                    erd: isoToIt(v.to) ?? null,    // erd = data fine (A)
                                }))
                            }
                            fullWidth
                            size="sm"
                            variant="outline"
                            color="dark"
                            radius="md"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/* Helper: se cambio agente, ed era selezionato un cliente non appartenente a quell’agente, lo resetto (case-insensitive) */
function prevClientNoLongerMatches(
    newAgent: string | null,
    currentClient: string | null | undefined,
    allCustomers: Customer[]
) {
    if (!newAgent || !currentClient) return false;
    const agent = String(newAgent).toUpperCase();
    const client = String(currentClient);
    return !allCustomers.some(
        (c) => String(c.CodiceAgente).toUpperCase() === agent && String(c.CodiceCliente) === client
    );
}
