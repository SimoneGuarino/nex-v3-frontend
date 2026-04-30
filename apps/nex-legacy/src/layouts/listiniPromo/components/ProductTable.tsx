import React, { useEffect, useMemo, useState } from "react";
import { TableVirtualized } from "components/Virtualized/table";
import FDButton from "components/UI/buttons/FDButton";
import FDSelect, { type FDSelectOption } from "components/UI/input/FDSelect";
import type { PromotionProduct, WarehouseAvailability } from "../fetchdatas/promos/detailsData";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type ProductTableProps = {
    products: PromotionProduct[]; //lista prodotti (già filtrati a monte) da mostrare in tabella
    loading: boolean; //stato loading della fetch dettagli
    loadMore: () => Promise<boolean>; //callback infinite scroll (carica altre righe)
    totalCount: number; //numero totale prodotti disponibili lato BE
};

type AvailabilityCellProps = {
    magazzini?: WarehouseAvailability[] | null; //lista disponibilità per magazzino (può essere null/undefined)
    index?: number; //index riga (per key React)
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
// SUB COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * AvailabilityCell:
 * cella tabellare per mostrare la disponibilità magazzini.
 * - filtra solo magazzini con disponibilità > 0
 * - permette selezione magazzino o “Tutti i magazzini”
 * - mostra il valore (somma o valore singolo)
 * @param magazzini
 * @returns
 */
const AvailabilityCell: React.FC<AvailabilityCellProps> = ({ magazzini, index }) => {
    const ALL_VALUE = "__ALL__"; //valore speciale: aggrega tutti i magazzini

    // lista filtrata: solo magazzini con disponibilità > 0
    const list = useMemo(
        () => (magazzini ?? []).filter((m) => (m.disponibilita ?? 0) > 0),
        [magazzini]
    ); //lista magazzini “utili”

    const hasData = list.length > 0; //true se ci sono magazzini con stock > 0
    const [selected, setSelected] = useState<string>(ALL_VALUE); //magazzino selezionato

    // opzioni select magazzini (include "Tutti")
    const options: FDSelectOption<string>[] = useMemo(() => {
        if (!hasData) return [];
        return [
            { value: ALL_VALUE, label: "Tutti i magazzini" },
            ...list.map((m) => ({
                value: m.codiceMagazzino,
                label: `${m.codiceMagazzino} – ${m.descrizioneMagazzino}`,
            })),
        ];
    }, [hasData, list]);

    // valore mostrato (somma o singolo magazzino)
    const valueToShow = useMemo(() => {
        if (!hasData) return "—";

        if (selected === ALL_VALUE) {
            const sum = list.reduce((acc, m) => acc + (m.disponibilita ?? 0), 0);
            return sum.toString();
        }

        const found = list.find((m) => m.codiceMagazzino === selected);
        if (!found) return "—";

        return (found.disponibilita ?? 0).toString();
    }, [hasData, list, selected]);

    if (!hasData) {
        return <span className="text-sm">/</span>; //placeholder quando non ci sono dati magazzini
    }

    return (
        <div key={index + ":disp"} className="flex flex-col items-center justify-between">
            <span className="text-sm">{valueToShow} Pz.</span>
            <FDSelect
                options={options}
                value={selected}
                onChange={(v) => {
                    if (typeof v === "string") {
                        setSelected(v); //set magazzino selezionato
                    } else {
                        setSelected(ALL_VALUE); //fallback a "Tutti"
                    }
                }}
                size="xs"
                radius="md"
                fullWidth
                searchable={false}
                clearable={false}
                className="w-[200px]"
            />
        </div>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * ProductTable:
 * tabella virtualizzata dei prodotti promo (vista "list").
 * Mostra:
 * - azione "Vai a Focelda" (solo se esiste firstTierPrice)
 * - prezzo promo (primo scaglione) formattato
 * - disponibilità per magazzino (sub-component AvailabilityCell)
 * Supporta infinite scroll tramite TableVirtualized.
 * @returns
 */
const ProductTable: React.FC<ProductTableProps> = ({
    products,
    loading,
    loadMore,
    totalCount,
}) => {
    const [tableData, setTableData] = useState<any[]>(products.map((p) => ({...p, firstTierPriceFormatted: formatPrice(p.firstTierPrice)}))); //righe tabella (prodotti mappati + celle React)

    // definizione colonne tabella (stabile)
    const [columns, setColumns] = useState([
        {
            key: "azioni",
            label: 'Azioni',
            type: 'custom',
            width: 150,
            render: ({ elm, index }: { elm: any, index: number }) => elm.firstTierPrice ? <a
                key={index + ":goToFocelda"}
                href={`https://www.focelda.com/vendita?cerca=${encodeURIComponent(
                    elm.denominazioneUscita
                )}`}
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
            </a> : null
        },
        {
            label: "Codice",
            key: "productCode",
            sort: true,
            sortType: "string" as const,
            width: 130,
        },
        {
            label: "Denominazione uscita",
            key: "denominazioneUscita",
            sort: true,
            sortType: "string" as const,
            width: 250,
        },
        {
            label: "Descrizione articolo",
            key: "descrizioneArticolo",
            sort: true,
            sortType: "string" as const,
            width: 280,
        },
        {
            label: "Listino",
            key: "codiceListino",
            sort: true,
            sortType: "string" as const,
            width: 120,
        },
        {
            label: "Descrizione listino",
            key: "descrizioneListino",
            sort: true,
            sortType: "string" as const,
            width: 230,
        },
        {
            label: "Prezzo promo",
            key: "firstTierPriceFormatted",
            sort: true,
            sortType: "number" as const,
            width: 160,
        },
        {
            key: "disponibilita",
            label: 'Disponibilità',
            type: 'custom',
            width: 260,
            render: ({ elm, index }: { elm: any, index: number }) => <AvailabilityCell magazzini={elm.disponibilitaMagazzini ?? []} index={index} />
        },
    ])

    return (
        <TableVirtualized
            data={tableData}
            setData={setTableData}
            columns={columns}
            setColumns={setColumns} //non gestiamo editing colonne da qui (cookie gestito dalla tabella)
            //cookie="promo-products-columns" //cookie per persistenza colonne
            results={totalCount} //totale risultati (per footer/paginazione)
            loadStatus={loading} //loading indicator
            tableType="bottom-line"
            className="h-full mt-4 text-center"
            infiniteScroll={{
                func: loadMore, //callback per caricare altre righe
            }}
        />
    );
};

export default ProductTable;
