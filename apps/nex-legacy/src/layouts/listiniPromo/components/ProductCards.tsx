// src/layouts/listiniPromo/components/ProductCards.tsx
import React, { useMemo, useState } from "react";
import FDBox from "components/UI/box/FDBox";
import FDButton from "components/UI/buttons/FDButton";
import FDSelect, { type FDSelectOption } from "components/UI/input/FDSelect";
import type { PromotionProduct, WarehouseAvailability } from "../fetchdatas/promos/detailsData";
import { useTour } from "tour/TourProvider";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type Props = {
    product: PromotionProduct; //prodotto promo da renderizzare nella card
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Format prezzo in EUR (it-IT), con fallback "—" se nullo
 * @param value
 * @returns string
 */
const formatPrice = (value: number | null): string => {
    if (value == null) return "—";
    return value.toLocaleString("it-IT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * PromoProductCard:
 * card prodotto nella vista griglia della pagina ListiniPromo.
 * Mostra:
 * - intestazione prodotto (codice + denominazione)
 * - info listino
 * - disponibilità per magazzino (select + valore)
 * - immagine (se presente)
 * - prezzo promo (primo scaglione) + link esterno
 * @returns
 */
const PromoProductCard: React.FC<Props> = ({ product }) => {
    const hasImage = !!product.image?.highPic; //true se esiste un'immagine prodotto
    const hasFirstTierPrice = product.firstTierPrice != null; //true se esiste prezzo promo primo scaglione

    // --- logica disponibilità magazzini (come nella tabella) ---
    const ALL_VALUE = "__ALL__"; //valore speciale: aggrega tutti i magazzini

    // solo magazzini con disponibilità > 0
    const magazziniList: WarehouseAvailability[] = useMemo(
        () =>
            (product.disponibilitaMagazzini ?? []).filter(
                (m) => (m.disponibilita ?? 0) > 0
            ),
        [product.disponibilitaMagazzini]
    ); //lista magazzini “utili” (solo con stock > 0)

    const hasMagData = magazziniList.length > 0; //true se ho disponibilità magazzini
    const [selectedMag, setSelectedMag] = useState<string>(ALL_VALUE); //magazzino selezionato in select

    // opzioni select magazzini (include "Tutti")
    const magOptions: FDSelectOption<string>[] = useMemo(() => {
        if (!hasMagData) return [];
        return [
            { value: ALL_VALUE, label: "Tutti i magazzini" },
            ...magazziniList.map((m) => ({
                value: m.codiceMagazzino,
                label: `${m.codiceMagazzino} – ${m.descrizioneMagazzino}`,
            })),
        ];
    }, [hasMagData, magazziniList]);

    // valore disponibilità mostrato a destra (somma o magazzino specifico)
    const availabilityValue = useMemo(() => {
        if (!hasMagData) return "—";

        if (selectedMag === ALL_VALUE) {
            const sum = magazziniList.reduce(
                (acc, m) => acc + (m.disponibilita ?? 0),
                0
            );
            return sum.toString();
        }

        const found = magazziniList.find((m) => m.codiceMagazzino === selectedMag);
        if (!found) return "—";

        return (found.disponibilita ?? 0).toString();
    }, [hasMagData, magazziniList, selectedMag]);

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 14);

    return (
        <FDBox
            data-tour="listiniPromo-card"
            radius="lg"
            pad="md"
            className={`
                w-full flex flex-col gap-2 justify-between
                bg-white dark:bg-neutral-900/60 dark:border dark:border-white/10 dark:shadow-xl
                shadow-sm
                h-full
            `}
        >{lockInteractions && (
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
            {/* intestazione: codice + denominazione uscita */}
            <div className="flex flex-col gap-1">
                <div className="text-sm font-semibold truncate">
                    {product.productCode} - {product.denominazioneUscita}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {product.descrizioneArticolo}
                </div>
            </div>

            {/* listino */}
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    {product.codiceListino} – {product.descrizioneListino}
                </span>
            </div>

            {/* disponibilità per magazzino */}
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Disponibilità:
            </div>
            <div className="w-full flex items-center justify-between">
                <div className="w-[200px]">
                    <FDSelect
                        options={magOptions}
                        value={selectedMag}
                        onChange={(v) => {
                            if (typeof v === "string") {
                                setSelectedMag(v); //set magazzino selezionato
                            } else {
                                setSelectedMag(ALL_VALUE); //fallback a "Tutti"
                            }
                        }}
                        size="xs"
                        radius="md"
                        fullWidth
                        searchable
                        clearable={false}
                    />
                </div>

                {hasMagData ? (
                    <span className="font-semibold tabular-nums text-xs">
                        {availabilityValue}
                    </span>
                ) : (
                    <span className="text-xs text-neutral-400">/</span>
                )}
            </div>

            {/* immagine prodotto (se presente) */}
            {hasImage && (
                <div className="w-full flex-1 flex justify-center items-center overflow-hidden mt-1">
                    <img
                        className="max-h-24 object-contain"
                        src={product.image!.highPic as string}
                        alt={product.descrizioneArticolo || product.denominazioneUscita}
                    />
                </div>
            )}

            {/* prezzo promo primo scaglione */}
            {hasFirstTierPrice && (
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 w-full flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="text-[11px] font-medium mb-0.5">
                            Prezzo promo
                        </div>
                        <div className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatPrice(product.firstTierPrice)}
                        </div>
                    </div>

                    {/* link esterno al sito (ricerca per denominazione) */}
                    <a
                        href={`https://www.focelda.com/vendita?cerca=${product.denominazioneUscita}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                    >
                        <FDButton
                            variant="solid"
                            color="primary"
                            size="small"
                            radius="md"
                        >
                            Vai a Focelda
                        </FDButton>
                    </a>
                </div>
            )}
        </FDBox>
    );
};

export default PromoProductCard;
