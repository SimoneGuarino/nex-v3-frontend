// src/layouts/listiniPromo/components/AdvancedSearch.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import FDSearchPanel, { type SearchItem } from "components/UI/search/FDSearchPanel";
import { fetchPromoSearch, type PromoSearchResultItem } from "../fetchdatas/promos/searchData";
import type { PromoPeriod } from "../fetchdatas/promos/detailsData";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type Props = {
    open: boolean; //true se la modale/pannello ricerca è aperto
    promoCode?: string; //promo selezionata (necessaria per la search BE)
    period: PromoPeriod | null; //periodo attivo (necessario per la search BE)
    onClose: () => void; //callback chiusura pannello
    onProductPicked: (data: {
        productCode: string; //codice prodotto selezionato
        label: string; //label mostrata nel chip/filtro (es: "12345 – Nome")
        codiceListino?: string; //eventuale listino (non usato ora, ma previsto)
    }) => void; //callback selezione prodotto
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * AdvancedSearch (ListiniPromo):
 * pannello di ricerca mirata prodotti all'interno di una promo.
 * - richiede promoCode e period per chiamare il BE
 * - deduplica i risultati per productCode e aggrega i listini in subtitle
 * - espone il prodotto selezionato al parent tramite onProductPicked
 * @returns
 */
const AdvancedSearch: React.FC<Props> = ({
    open,
    promoCode,
    period,
    onClose,
    onProductPicked,
}) => {
    const searchAbortController = useRef<AbortController | null>(null); //abort controller per interrompere la fetch ricerca

    const [searchQuery, setSearchQuery] = useState(""); //query digitata dall’utente
    const [searchResults, setSearchResults] = useState<PromoSearchResultItem[]>([]); //risultati grezzi BE
    const [searchLoading, setSearchLoading] = useState(false); //loading ricerca
    const [searchRecent, setSearchRecent] = useState<string[]>([]); //recenti gestite dal FDSearchPanel

    // quando chiudo, resetto lo stato della ricerca
    useEffect(() => {
        if (!open) {
            setSearchQuery(""); //reset query
            setSearchResults([]); //reset risultati
        }
    }, [open]);

    // chiamata BE per la ricerca mirata
    useEffect(() => {
        if (!open) return;

        // serve sia promoCode che period per poter chiamare il BE
        if (!promoCode || !period) {
            setSearchResults([]); //senza contesto, svuoto risultati
            return;
        }

        const q = searchQuery.trim();
        if (!q) {
            setSearchResults([]); //se query vuota, niente risultati
            return;
        }

        setSearchLoading(true); //start loading

        // abort ricerca precedente
        if (searchAbortController.current) {
            searchAbortController.current.abort();
        }
        searchAbortController.current = new AbortController();

        // fetch ricerca prodotto nella promo
        fetchPromoSearch({
            abortController: searchAbortController,
            promoCode,
            period,
            q,
            limit: 50,
            offset: 0,
        })
            .then((res) => {
                setSearchResults(res.items ?? []); //salvo risultati
            })
            .catch((err: any) => {
                if (err?.name === "AbortError") return; //abort intenzionale
                console.error("[ListiniPromo] errore fetchPromoSearch", err);
            })
            .finally(() => {
                setSearchLoading(false); //stop loading
            });

        // cleanup
        return () => {
            searchAbortController.current?.abort();
        };
    }, [open, searchQuery, promoCode, period]);

    // mapping risultati → SearchItem per FDSearchPanel
    // qui deduplichiamo per productCode, e aggreghiamo i listini in cui il prodotto è presente
    const searchItems: SearchItem<PromoSearchResultItem>[] = useMemo(() => {
        // mappa: productCode → { base: PromoSearchResultItem; listini: string[] }
        const byProduct = new Map<
            string,
            { base: PromoSearchResultItem; listini: string[] }
        >();

        for (const r of searchResults) {
            const existing = byProduct.get(r.productCode);

            // etichetta listino "COD – DESCR"
            const listinoLabel = [r.codiceListino, r.descrizioneListino]
                .filter(Boolean)
                .join(" – ");

            if (!existing) {
                byProduct.set(r.productCode, {
                    base: r,
                    listini: listinoLabel ? [listinoLabel] : [],
                });
            } else {
                // accumulo listini distinti per stesso prodotto
                if (listinoLabel && !existing.listini.includes(listinoLabel)) {
                    existing.listini.push(listinoLabel);
                }
            }
        }

        // trasformo in SearchItem
        return Array.from(byProduct.values()).map(({ base, listini }) => ({
            // id solo per productCode: il prodotto compare una sola volta
            id: base.productCode,
            title: `${base.productCode} – ${base.denominazioneUscita}`,
            subtitle: [
                base.descrizioneArticolo,
                listini.length > 0 ? `Listini: ${listini.join(" • ")}` : undefined,
            ]
                .filter(Boolean)
                .join(" • "),
            // payload: un record qualunque (ci servono productCode/denominazione)
            payload: base,
        }));
    }, [searchResults]);

    // placeholder dinamico in base al contesto selezionato
    const placeholder =
        !period
            ? "Seleziona prima un periodo…"
            : !promoCode
                ? "Seleziona prima una promozione…"
                : "Cerca un prodotto nella promozione…";

    return (
        <FDSearchPanel<PromoSearchResultItem>
            open={open}
            onClose={onClose}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            items={searchItems}
            onSelect={(item) => {
                const p = item.payload!;
                const label = `${p.productCode} – ${p.denominazioneUscita}`;

                // passiamo solo il prodotto,
                // i listini verranno gestiti dopo tramite filtri
                onProductPicked({
                    productCode: p.productCode,
                    label,
                });
            }}
            placeholder={placeholder}
            highlight
            loading={searchLoading}
            recentSearch={{
                enabled: true,
                cookieName: "fd_listiniPromo_recent_products",
                limit: 10,
            }}
            customRecent={searchRecent}
            setCustomRecent={setSearchRecent}
            emptyLabel="Inizia a digitare per cercare un prodotto…"
            emptyNoResultsLabel="Nessun prodotto trovato per questa ricerca."
        />
    );
};

export default AdvancedSearch;
