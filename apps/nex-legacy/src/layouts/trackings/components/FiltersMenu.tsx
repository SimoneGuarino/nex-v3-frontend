import { useCallback, useMemo } from "react";

import FDButton from "components/UI/buttons/FDButton";
import FDDate from "components/UI/input/FDDate";
import FDInput from "components/UI/input/FDInput";
import FDSelect from "components/UI/input/FDSelect";
import ContextMenu from "components/UI/menu/ContextMenu";

import { IoFilter } from "react-icons/io5";
import { GetDate } from "utils";

import type { CustomerOption, TrackingsFiltersState } from "../types";

type FiltersMenuProps = {
    filters: TrackingsFiltersState;
};

/**
 * Bottone filtri + relativo context menu del layout trackings.
 */
export default function FiltersMenu({ filters }: FiltersMenuProps) {
    const {
        isOpen,
        anchorRef,
        fbNumber,
        setFbNumber,
        dateRange,
        setDateRange,
        clientFilterCodes,
        setClientFilterCodes,
        customerOptions,
        customerLoading,
        onCustomerSearchChange,
        openMenu,
        closeMenu,
        resetFilters,
    } = filters;

    /** Data massima selezionabile nel range filtri. */
    const today = useMemo(() => GetDate().today, []);

    /**
     * Calcola il numero di filtri attivi e il tooltip riepilogativo.
     */
    const { filtersCount, filtersTooltip } = useMemo(() => {
        let count = 0;
        const labels: string[] = [];

        const add = (condition: boolean, label: string) => {
            if (condition) {
                count++;
                labels.push(label);
            }
        };

        add(!!fbNumber?.trim(), "Numero FB");
        add(!!clientFilterCodes?.length, `Clienti (${clientFilterCodes?.length ?? 0})`);
        add(!!dateRange?.from || !!dateRange?.to, "Range di date");

        return {
            filtersCount: count,
            filtersTooltip: count
                ? `Filtri attivi: ${labels.join(" · ")}`
                : "Nessun filtro attivo",
        };
    }, [fbNumber, clientFilterCodes, dateRange]);

    /**
     * Normalizza il valore emesso da FDSelect nel formato atteso dal layout.
     */
    const handleClientsChange = useCallback(
        (value: unknown) => {
            const normalized = Array.isArray(value)
                ? (value as CustomerOption[])
                : value
                    ? [value as CustomerOption]
                    : [];

            setClientFilterCodes(normalized);
        },
        [setClientFilterCodes]
    );

    /**
     * Render personalizzato di una singola opzione cliente nel select filtri.
     */
    const renderCustomerOption = useCallback((option: any, selected: boolean) => {
        const customer = option.value as CustomerOption;

        return (
            <div className="flex flex-col gap-1 leading-tight cursor-pointer">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                        {customer.ragioneSociale}
                    </span>
                    <div>
                        <span
                            className={`inline-block mr-2 w-2 h-2 rounded-full ${selected ? "bg-yellow-500/80" : ""}`}
                        />
                        <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-500/20 text-blue-200">
                            {customer.codiceCliente}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    {customer.partitaIVA && <span>P.IVA {customer.partitaIVA}</span>}
                    {customer.codiceFiscale && <span>CF {customer.codiceFiscale}</span>}
                    {customer.fido && (
                        <span className="ml-auto font-medium text-xs">
                            Fido: {customer.fido.saldoCliente.toLocaleString("it-IT")} /{" "}
                            {customer.fido.fidoTotale.toLocaleString("it-IT")}
                        </span>
                    )}
                </div>
            </div>
        );
    }, []);

    return (
        <>
            <FDButton
                radius="md"
                size="small"
                color="neutral"
                variant="outline"
                rightIcon={IoFilter({})}
                ref={anchorRef}
                onClick={openMenu}
                dataTooltipId="trackings-tooltip"
                dataTooltipContent={filtersTooltip}
            >
                Filtri
            </FDButton>

            <ContextMenu
                openFor={isOpen}
                onClose={closeMenu}
                pos={anchorRef}
                placement="left-start"
                className="min-w-[360px]"
                panel={
                    <div className="flex flex-col gap-3">
                        {/* Header */}
                        <div className="text-sm font-medium">Filter</div>

                        <div className="flex flex-col">
                            <span className="text-xs ml-1.5">Numero FB</span>
                            <FDInput
                                type="text"
                                radius="md"
                                color="dark"
                                variant="outline"
                                size="sm"
                                value={fbNumber}
                                onChange={(event) => setFbNumber(event.target.value)}
                                placeholder="Inserisci il numero FB per trovare il tracking"
                            />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs ml-1.5">Clienti</span>
                            <FDSelect
                                options={customerOptions.map((customer) => ({
                                    id: customer.id,
                                    value: customer,
                                    label: `${customer.ragioneSociale} (${customer.codiceCliente})`,
                                }))}
                                value={clientFilterCodes}
                                onChange={handleClientsChange as any}
                                placeholder="Cerca per ragione sociale, P.IVA, CF o codice..."
                                size="sm"
                                variant="outline"
                                color="dark"
                                radius="md"
                                fullWidth
                                multiple
                                clearable
                                searchable
                                loading={customerLoading}
                                onSearchChange={onCustomerSearchChange}
                                menuMaxHeight={320}
                                virtualized={false}
                                renderOption={renderCustomerOption}
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs ml-1.5">Range di date</span>
                            <FDDate
                                range
                                value={dateRange}
                                onChange={setDateRange}
                                max={today}
                                variant="outline"
                                color="dark"
                                radius="md"
                                size="sm"
                            />
                        </div>

                        <div className="flex items-center justify-end pt-1">
                            <FDButton
                                size="small"
                                radius="md"
                                variant="outline"
                                color="dark"
                                onClick={resetFilters}
                            >
                                Reset
                            </FDButton>
                        </div>
                    </div>
                }
            />
        </>
    );
}
