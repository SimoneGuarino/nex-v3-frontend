// src/layouts/listiniPromo/components/TopBar.tsx
import React from "react";
import { motion } from "framer-motion";

import FDBox from "components/UI/box/FDBox";
import FDSelect, { FDSelectOption } from "components/UI/input/FDSelect";
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDButton from "components/UI/buttons/FDButton";
import FDDate from "components/UI/input/FDDate";
import { IoSearch } from "react-icons/io5";

import type { PromoPeriod } from "../fetchdatas/promos/detailsData";
import type { PromoListPeriod } from "../fetchdatas/promos/listData";
import { useTour } from "tour/TourProvider";

const IoSearchIcon = IoSearch as React.FC<{ size?: number; className?: string }>;

// easing cubic-bezier (simile a ease-out)
const easeOutCurve = [0.25, 0.1, 0.25, 1] as const;

// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type Props = {
    expanded: boolean; //true dopo la prima submit (layout compatto)

    // periodo usato per le chiamate di dettaglio (ATTUALI | SCADUTE | FUTURE)
    period: PromoPeriod; //periodo “logico” per i dettagli (non include CUSTOM)

    // periodo usato per la lista promo (ATTUALI | SCADUTE | FUTURE | CUSTOM)
    listPeriod: PromoListPeriod; //periodo per listare le promo (include CUSTOM)
    listCustomFrom?: string; //from per intervallo custom (solo se listPeriod === "CUSTOM")
    listCustomTo?: string; //to per intervallo custom (solo se listPeriod === "CUSTOM")

    promoOptions: FDSelectOption<string>[]; //opzioni promo per la select
    loadingPromos: boolean; //stato loading della lista promo
    selectedPromoCode?: string; //promo attualmente selezionata
    onPromoChange: (value?: string) => void; //callback quando cambia la promo selezionata

    // cambio periodo "logico" (dettagli/search) → solo ATTUALI/SCADUTE/FUTURE
    onPeriodChange: (value: PromoPeriod) => void; //callback cambio periodo dettagli

    // cambio periodo per la lista (può essere anche CUSTOM)
    onListPeriodChange: (value: PromoListPeriod) => void; //callback cambio periodo lista promo

    // cambio intervallo custom per la lista (usato solo se listPeriod === "CUSTOM")
    onListCustomRangeChange: (range: { from?: string; to?: string }) => void; //callback cambio date custom

    onSubmit: () => void; //submit ricerca (carica dettagli promo)
};

// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Normalizza value proveniente da FDSelect (tipizzato come unknown) verso PromoListPeriod
 * @param value
 * @returns PromoListPeriod | null
 */
const parsePromoListPeriod = (value: unknown): PromoListPeriod | null => {
    return typeof value === "string" ? (value as PromoListPeriod) : null;
};

// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * TopBar ListiniPromo:
 * - prima della submit: solo select promo + pulsante cerca (layout centrato)
 * - dopo la submit: selezione periodo (anche CUSTOM) + eventuale range date + promo + pulsante cerca
 * @returns
 */
const TopBar: React.FC<Props> = ({
    expanded,
    // period, // se in futuro ti serve puoi riusarlo
    listPeriod,
    listCustomFrom,
    listCustomTo,
    promoOptions,
    loadingPromos,
    selectedPromoCode,
    onPromoChange,
    onPeriodChange,
    onListPeriodChange,
    onListCustomRangeChange,
    onSubmit,
}) => {
    const periodOptions: FDSelectOption<PromoListPeriod>[] = [
        { value: "SCADUTE", label: "Scadute" },
        { value: "ATTUALI", label: "Attuali" },
        { value: "FUTURE", label: "Future" },
        { value: "CUSTOM", label: "Intervallo personalizzato" },
    ]; //opzioni periodo lista promo (include CUSTOM)

    /**
     * Cambio periodo lista:
     * - aggiorna sempre listPeriod
     * - aggiorna period dettagli solo se NON è CUSTOM
     * @param value
     */
    const handleListPeriodChange = (value: unknown) => {
        const val = parsePromoListPeriod(value);
        if (!val) return;

        onListPeriodChange(val);

        // standard attuale: il periodo dei dettagli resta solo ATTUALI/SCADUTE/FUTURE.
        // Se l’utente sceglie CUSTOM, NON cambiamo il period dei dettagli.
        if (val !== "CUSTOM") {
            onPeriodChange(val as PromoPeriod);
        }
    };

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 3 || tourIndex === 5);

    return (
        <motion.div
            layout
            transition={{
                layout: {
                    duration: 0.8,
                    ease: easeOutCurve,
                },
            }}
            className="w-full"
        >
            <FDBox
                className={`
                    w-full
                    ${expanded ? "w-full" : "md:w-[75%] lg:w-[50%] mx-auto"}
                    flex items-center
                `}
                pad="md"
                radius="lg"
            >
                {/* stato iniziale (prima ricerca): select promo + cerca, centrati */}
                {!expanded && (
                    <div className="w-full flex gap-2 items-center" data-tour="listiniPromo-scegliPromo">
                        <FDSelect
                            options={promoOptions}
                            value={selectedPromoCode}
                            onChange={(v) =>
                                onPromoChange(typeof v === "string" ? v : undefined)
                            }
                            placeholder="Cerca una promo o selezionane una dalla lista"
                            fullWidth
                            searchable
                            clearable
                            loading={loadingPromos}
                            radius="md"
                        />

                        {/* cerca mobile */}
                        <div className="flex sm:hidden justify-center items-center">
                            <FDIconButton
                                icon={<IoSearchIcon size={18} />}
                                onClick={onSubmit}
                                dataTooltipId="ListiniPromo-tooltip"
                                dataTooltipContent="Cerca"
                            />
                        </div>

                        {/* cerca desktop */}
                        <div className="hidden sm:flex justify-center items-center relative">
                            <FDButton
                                data-tour="listiniPromo-scegliPromo-search"
                                variant="solid"
                                color="primary"
                                onClick={onSubmit}
                                size="medium"
                                disabled={!selectedPromoCode}
                            >
                                <IoSearchIcon className="mr-1.5" />
                                Cerca
                            </FDButton>
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
                        </div>
                    </div>
                )}

                {/* stato dopo la prima ricerca:
                    - a sinistra: periodo + eventuale date range + select promo
                    - a destra: solo il pulsante Cerca (responsive) */}
                {expanded && (
                    <div className="w-full flex flex-col md:flex-row gap-3 items-stretch" data-tour="listiniPromo-bar">
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
                        <div className="w-full flex flex-col md:flex-row gap-2 items-center">
                            <FDSelect
                                options={periodOptions}
                                value={listPeriod}
                                onChange={handleListPeriodChange}
                                fullWidth
                                placeholder="Seleziona il periodo"
                                clearable={false}
                                size="sm"
                                radius="md"
                                searchable={false}
                            />

                            {/* range date visibile solo in CUSTOM */}
                            {listPeriod === "CUSTOM" && (
                                <FDDate
                                    range
                                    value={{
                                        from: listCustomFrom || undefined,
                                        to: listCustomTo || undefined,
                                    }}
                                    onChange={onListCustomRangeChange}
                                    size="sm"
                                    radius="md"
                                    variant="outline"
                                    color="neutral"
                                    fullWidth
                                />
                            )}

                            {/* select promo */}
                            <FDSelect
                                options={promoOptions}
                                value={selectedPromoCode}
                                radius="md"
                                onChange={(v) =>
                                    onPromoChange(typeof v === "string" ? v : undefined)
                                }
                                placeholder="Cerca una promo o selezionane una dalla lista"
                                fullWidth
                                searchable
                                clearable
                                loading={loadingPromos}
                                size="sm"
                            />
                        </div>

                        {/* CTA submit */}
                        <div className="flex justify-end items-center w-auto">
                            <FDButton
                                variant="solid"
                                color="primary"
                                onClick={onSubmit}
                                size="small"
                            >
                                <IoSearchIcon className="mr-1.5" />
                                Cerca
                            </FDButton>
                        </div>
                    </div>
                )}
            </FDBox>
        </motion.div>
    );
};

export default TopBar;
