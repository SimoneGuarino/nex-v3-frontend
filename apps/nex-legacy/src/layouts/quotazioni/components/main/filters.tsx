import React, { memo } from "react";
import FDSelect, { FDSelectOption } from "components/UI/input/FDSelect";
import FDDate from "components/UI/input/FDDate";
import { filterStateOptions, filterTypeOptions } from "layouts/quotazioni/types/quotations";
import FDInput from "components/UI/input/FDInput";
import { useUserContext } from "context/UserContext";
import { useTour } from "tour/TourProvider";


const stateOptions: FDSelectOption<string>[] = [
    { value: 'TUTTE', label: 'Tutte' },
    ...filterStateOptions.map(t => ({ value: t, label: t }))
];

const typeOptions: FDSelectOption<string>[] = [
    { value: 'TUTTE', label: 'Tutte' },
    ...filterTypeOptions.map(t => ({ value: t, label: t }))
];



const Filters: React.FC<{
    dateFrom: string; setDateFrom: (d: string) => void;
    dateTo: string; setDateTo: (d: string) => void;
    filterType: string; setFilterType: (t: string) => void;
    filterId: string; setFilterId: (i: string) => void;
    filterState: string; setFilterState: (s: string) => void;
    priceFrom: string; setPriceFrom: (v: string) => void;
    priceTo: string; setPriceTo: (v: string) => void;
    filterBuyerCode: string; setFilterBuyerCode: (v: string) => void;
    filterAgenteId: string; setFilterAgenteId: (v: string) => void;
    buyerOptions: FDSelectOption<string>[];
    agentOptions: FDSelectOption<string>[];
}> = ({
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filterType, setFilterType,
    filterState, setFilterState,
    filterId, setFilterId,
    priceFrom, setPriceFrom,
    priceTo, setPriceTo,
    filterBuyerCode, setFilterBuyerCode,
    filterAgenteId, setFilterAgenteId,
    buyerOptions,
    agentOptions,
}) => {
        const [userContext] = useUserContext() as any;
        const ruolo = userContext.details.ruolo as string;
        //Lock interazioni menu filtri durante il tour (differenziato per ruolo)
        const { isOpen, index: tourIndex } = useTour();

        const isCad = ruolo === "Commerciale" || ruolo === "Admin" || ruolo === "Dev";
        const isBuyer = ruolo === "Buyer";

        const lockInteractions =
            isOpen && (
                (isCad && tourIndex === 7) ||   // step "quotazioni-filter-2" per Comm/Admin/Dev
                (isBuyer && tourIndex === 2)    // step "quotazioni-filter-2" per Buyer
            );


        return (
            <div className="relative w-[360px] max-w-full space-y-4" data-tour="quotazioni-filter-2">
                {lockInteractions && (
                    <div
                        aria-hidden="true"
                        style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "auto" }}
                        onClickCapture={(e) => e.stopPropagation()}
                    />
                )}
                {/* Header */}
                <div className="text-sm font-medium">Filter</div>

                {/* Date range */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Select Date</span>
                        <button
                            className="text-xs text-blue-400 hover:underline"
                            onClick={() => { setDateFrom(''); setDateTo(''); }}
                        >Clear</button>
                    </div>
                    <FDDate
                        range
                        value={{ from: dateFrom || undefined, to: dateTo || undefined }}
                        onChange={(v) => { setDateFrom(v.from || ''); setDateTo(v.to || ''); }}
                        size="sm" variant="outline" radius="md" color="dark" fullWidth
                    />
                </div>

                {/* range prezzo */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Range Prezzo</span>
                        <button
                            className="text-xs text-blue-400 hover:underline"
                            onClick={() => { setPriceFrom(""); setPriceTo(""); }}
                        >Clear</button>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2">
                        <FDInput
                            type="number"
                            value={priceFrom}
                            onChange={(e) => setPriceFrom(e.target.value)}
                            radius="md"
                            size="sm"
                            color="dark"
                            placeholder="DA"
                        />
                        <FDInput
                            type="number"
                            value={priceTo}
                            onChange={(e) => setPriceTo(e.target.value)}
                            radius="md"
                            size="sm"
                            color="dark"
                            placeholder="A"
                        />
                    </div>
                </div>

                {/* ID */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">ID Quotazione</span>
                    </div>
                    <FDInput
                        value={filterId}
                        onChange={(e) => {
                            // accettiamo solo cifre: l'ID progressivo è numerico (0001, 0025, ...)
                            const onlyDigits = e.target.value.replace(/\D/g, "");
                            setFilterId(onlyDigits);
                        }}
                        placeholder="0001"
                        size="sm" variant="outline" color="dark" radius="md" fullWidth
                    />
                </div>

                {/* State */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Stato</span>
                    </div>
                    <FDSelect
                        options={stateOptions}
                        value={filterState}
                        onChange={(v) => setFilterState((v as string) ?? '')}
                        placeholder="Tutte"
                        size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                        menuMaxHeight={240}
                    />
                </div>

                {/* State */}
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="opacity-80">Tipologia</span>
                    </div>
                    <FDSelect
                        options={typeOptions}
                        value={filterType}
                        onChange={(v) => setFilterType((v as string) ?? '')}
                        placeholder="Tutte"
                        size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                        menuMaxHeight={240}
                    />
                </div>

                {/* filtri agente/buyer */}
                {ruolo === "Buyer" ? (
                    // filtro commerciali per buyers
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="opacity-80">Agente</span>
                        </div>
                        <FDSelect
                            options={agentOptions}
                            value={filterAgenteId}
                            onChange={(v) => setFilterAgenteId((v as string) ?? "")}
                            size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                            menuMaxHeight={240}
                        />
                    </div>
                ) : ruolo === "Commerciale" ? (
                    // filtro buyers per commerciali
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="opacity-80">Buyer</span>
                        </div>
                        <FDSelect
                            options={buyerOptions}
                            value={filterBuyerCode}
                            onChange={(v) => setFilterBuyerCode((v as string) ?? "")}
                            size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                            menuMaxHeight={240}
                        />
                    </div>
                ) : (
                    // filtro commerciale e buyers per altri ruoli
                    <>
                        <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="opacity-80">Agente</span>
                            </div>
                            <FDSelect
                                options={agentOptions}
                                value={filterAgenteId}
                                onChange={(v) => setFilterAgenteId((v as string) ?? "")}
                                size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                                menuMaxHeight={240}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="opacity-80">Buyer</span>
                            </div>
                            <FDSelect
                                options={buyerOptions}
                                value={filterBuyerCode}
                                onChange={(v) => setFilterBuyerCode((v as string) ?? "")}
                                size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                                menuMaxHeight={240}
                            />
                        </div>
                    </>
                )}

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-1">
                    <button
                        className="px-3 py-2 text-sm rounded-md border border-[#2a2a2a] hover:bg-[#2a2a2a]"
                        disabled={lockInteractions}
                        onClick={() => {
                            setDateFrom("");
                            setDateTo("");
                            setPriceFrom("");
                            setPriceTo("");
                            setFilterType("");
                            setFilterState("");
                            setFilterId("");
                            setFilterBuyerCode("");
                            setFilterAgenteId("");
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        );
    };

export default memo(Filters);
