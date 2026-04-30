import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import TopBar, { type RubricaTabKey } from "./components/TopBar";

import RubricaSearch from "./components/advancedSearch/RubricaSearch";
import PaymentMethodsSearch from "./components/advancedSearch/PaymentMethodsSearch";
import MicrosettoriSearch from "./components/advancedSearch/MicrosettoriSearch";
import CondGaranziaSearch from "./components/advancedSearch/CondGaranziaSearch";

import {
    LoadRubricaAPI,
    type RubricaItem,
    type RubricaResponse,
} from "./fetchdatas/getRubricaData";
import {
    LoadPaymentMethodsAPI,
    type PaymentMethodItem,
    type PaymentMethodsResponse,
} from "./fetchdatas/getPaymentMethodsData";
import {
    LoadMicrosettoriAPI,
    type MicrosettoriItem,
    type MicrosettoriResponse,
} from "./fetchdatas/getMicrosettoriData";
import {
    LoadCondGaranziaAPI,
    type CondGaranziaItem,
    type CondGaranziaResponse,
} from "./fetchdatas/getCondGaranziaData";

import { Tooltip } from "react-tooltip";
import { viewsRegistry, type ViewDefinition } from "./views/registry";
import { useSectionTour } from "tour/useSectionTour";
import { useUserContext } from "context/UserContext";
import { Role } from "tour/types";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
/**
 * Struttura risultati per tab: un singolo stato normalizzato.
 * Vantaggi:
 * - elimina 4 useState duplicati
 * - rende reset / tab change / close molto più semplici
 * - riduce la possibilità di inconsistenze tra stati paralleli
 */
type ResultsByMode = {
    rubrica: RubricaItem[];
    paymentMethods: PaymentMethodItem[];
    microsettori: MicrosettoriItem[];
    garanzia: CondGaranziaItem[];
};

/**
 * Struttura selected per tab: un singolo stato normalizzato.
 */
type SelectedByMode = {
    rubrica: RubricaItem | null;
    paymentMethods: PaymentMethodItem | null;
    microsettori: MicrosettoriItem | null;
    garanzia: CondGaranziaItem | null;
};

/**
 * Costanti “vuote” (immutabili) per reset rapido e consistente.
 * Nota: vengono copiate nello stato (non mutate) → safe.
 */
const EMPTY_RESULTS: ResultsByMode = {
    rubrica: [],
    paymentMethods: [],
    microsettori: [],
    garanzia: [],
};

const EMPTY_SELECTED: SelectedByMode = {
    rubrica: null,
    paymentMethods: null,
    microsettori: null,
    garanzia: null,
};

/**
 * Normalizza la query: trim
 */
function normalizeQuery(q: string): string {
    return q.trim();
};

/**
 * Esegue la chiamata di ricerca in base alla tab attiva.
 *
 * NOTE:
 * - questa funzione deve fare SOLO “IO” (fetch + callback risultati)
 * - la “business logic” (apertura/chiusura modale, reset selezioni, ecc.)
 *   deve rimanere nei command handler nel componente.
 */
function runSearchByMode(params: {
    mode: RubricaTabKey;
    q: string;
    abortRef: React.MutableRefObject<AbortController | null>;
    setLoading: (v: boolean) => void;
    setResultsForMode: (mode: RubricaTabKey, items: unknown[]) => void;
}) {
    const { mode, q, abortRef, setLoading, setResultsForMode } = params;

    // Flag UI: search panel mostra loader mentre arriva la risposta
    setLoading(true);

    // Router di fetch per modalità
    switch (mode) {
        case "rubrica":
            LoadRubricaAPI({
                abortLike: abortRef,
                q,
                offset: 0,
                onComplete: (data: RubricaResponse | null) => {
                    setLoading(false);
                    setResultsForMode("rubrica", Array.isArray(data?.items) ? data!.items : []);
                },
            });
            return;

        case "paymentMethods":
            LoadPaymentMethodsAPI({
                abortLike: abortRef,
                q,
                offset: 0,
                onComplete: (data: PaymentMethodsResponse | null) => {
                    setLoading(false);
                    setResultsForMode("paymentMethods", Array.isArray(data?.items) ? data!.items : []);
                },
            });
            return;

        case "microsettori":
            LoadMicrosettoriAPI({
                abortLike: abortRef,
                q,
                offset: 0,
                onComplete: (data: MicrosettoriResponse | null) => {
                    setLoading(false);
                    setResultsForMode("microsettori", Array.isArray(data?.items) ? data!.items : []);
                },
            });
            return;

        case "garanzia":
            LoadCondGaranziaAPI({
                abortLike: abortRef,
                q,
                offset: 0,
                onComplete: (data: CondGaranziaResponse | null) => {
                    setLoading(false);
                    setResultsForMode("garanzia", Array.isArray(data?.items) ? data!.items : []);
                },
            });
            return;

        default:
            // Defensive: in caso di mode non previsto
            setLoading(false);
            return;
    };
};

/**
 * ViewHost:
 * wrapper memoized che istanzia il Component della view corrente.
 */
const ViewHost: React.FC<{
    def: ViewDefinition;
    selectedItem: any;
    resetToken: number;
    searchQuery: string;
    colSettingsOpen: boolean;
    setColSettingsOpen: (v: boolean) => void;
}> = React.memo(
    ({
        def,
        selectedItem,
        resetToken,
        searchQuery,
        colSettingsOpen,
        setColSettingsOpen,
    }) => {
        const { Component } = def;

        return (
            <Component
                selectedItem={selectedItem}
                resetToken={resetToken}
                searchQuery={searchQuery}
                footerSettings={{
                    showColSettings: true,
                    colSettingsOpen,
                    setColSettingsOpen,
                }}
            />
        );
    }
);

// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function Rubrica() {
    // ——————————————————————————————————————————————
    // UI STATE (tab / modali)
    // ——————————————————————————————————————————————
    /**
     * Tab attiva del pannello Rubrica.
     * Cambiarla comporta reset coerente di search + selected + table.
     */
    const [mode, setMode] = useState<RubricaTabKey>("rubrica");

    /**
     * Flag modale ricerca avanzata aperta.
     * “Controlled” da TopBar.
     */
    const [searchOpen, setSearchOpen] = useState<boolean>(false);

    /**  Query digitata nella ricerca avanzata (controllata). */
    const [searchQuery, setSearchQuery] = useState<string>("");

    /**
     * Loader globale della modale di search (condiviso tra le tab).
     * Nota: è ok così perché la modale è unica e la UX è “una ricerca alla volta”.
     */
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [colSettingsOpen, setColSettingsOpen] = useState(false);

    // ——————————————————————————————————————————————
    // DATA STATE (normalizzato per mode)
    // ——————————————————————————————————————————————
    /** Risultati per mode (normalizzati): evita 4 useState duplicati. */
    const [resultsByMode, setResultsByMode] = useState<ResultsByMode>(EMPTY_RESULTS);

    /**
     * Selezione per mode: quando picki un item dalla search,
     * la tabella mostra la riga singola corrispondente.
     */
    const [selectedByMode, setSelectedByMode] = useState<SelectedByMode>(EMPTY_SELECTED);

    /**
     * Segnale “soft” di reset per componenti figli che hanno stato interno.
     * È migliore del remount dell’intero pannello: reset esplicito e tracciabile.
     */
    const [resetToken, setResetToken] = useState<number>(0);

    /**
     * AbortController per le chiamate di search (quando l’utente digita o cambia tab).
     * Invariante: prima di avviare una search nuova, abortiamo la precedente.
     */
    const searchAbortRef = useRef<AbortController | null>(null);

    // CALLBACKS
    // ——————————————————————————————————————————————
    // User + Tour
    // ——————————————————————————————————————————————
    const [userContext] = useUserContext() as any;
    const tour = useSectionTour({
        id: "nex_v2_rubrica",
        version: "2.0.0",
        user: {
            id: userContext?.details?._id ?? "",
            role: (userContext?.details?.ruolo as Role) ?? "Tester",
        },
        keys: "rubrica",
        actions: {
            // 1: () => setColSettingsOpen(false),
            // 2: () => setColSettingsOpen(true),
            // 3: () => setColSettingsOpen(false),
            5: () => setSearchOpen(false),
            6: () => setSearchOpen(true),
            7: () => setSearchOpen(true),
            8: () => setSearchOpen(false),
        },
    });


    // ——————————————————————————————————————————————
    // DERIVED HELPERS (stable)
    // ——————————————————————————————————————————————
    /**
     * Setter “centralizzato” per i risultati in base al mode.
     * Tenere questa logica qui riduce coupling e ripetizioni.
     */
    const setResultsForMode = useCallback((m: RubricaTabKey, items: unknown[]) => {
        setResultsByMode((prev) => ({ ...prev, [m]: (items as any[]) ?? [] } as ResultsByMode));
    }, []);


    // ——————————————————————————————————————————————
    // COMMAND FUNCTIONS (event → command → state)
    // ——————————————————————————————————————————————
    /**
     * Reset “forte” del pannello:
     * - svuota query e risultati search
     * - resetta le selezioni
     * - incrementa resetToken per notificare i figli (tabella)
     *
     * Nota: non chiude forzatamente la search, perché la UX può scegliere:
     * qui la chiudiamo per evitare confusione.
     */
    const resetAll = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchLoading(false);
        setResultsByMode(EMPTY_RESULTS);
        setSelectedByMode(EMPTY_SELECTED);

        // Notifica ai figli che devono resettare eventuale stato interno
        setResetToken((p) => p + 1);
    }, []);

    /**
     * Close della modale search:
     * - chiude modale
     * - svuota query
     * - svuota risultati della tab corrente (non tocchiamo selected)
     *
     * Motivazione: closing non è sinonimo di “reset totale”.
     * (“close should be lightweight”)
     */
    const closeSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchLoading(false);

        // Pulizia dei risultati SOLO della tab corrente (evitiamo cross-contamination)
        setResultsByMode((prev) => ({ ...prev, [mode]: [] } as ResultsByMode));
    }, [mode]);

    /**
     * Cambio tab:
     * - cambia mode
     * - chiude search
     * - resetta risultati e selezioni (coerenza UI)
     * - incrementa resetToken per tabella
     *
     * Invariante UX: cambiare tab equivale a “contesto nuovo”.
     */
    const changeTab = useCallback((tab: RubricaTabKey) => {
        setMode(tab);
        setSearchOpen(false);
        setSearchQuery("");
        setSearchLoading(false);
        setResultsByMode(EMPTY_RESULTS);
        setSelectedByMode(EMPTY_SELECTED);
        setResetToken((p) => p + 1);
    }, []);

    /**
     * Pick item dalla search:
     * - salva il selected coerente con la tab
     * - chiude la search
     * - pulisce query (evita che riapri e trovi input “sporco”)
     *
     * Nota: NON resettiamo la tabella manualmente: TablePanel legge activeSelectedItem.
     */
    const pickItem = useCallback(
        <T,>(tab: RubricaTabKey, item: T) => {
            setSelectedByMode((prev) => ({ ...prev, [tab]: item } as SelectedByMode));
            setSearchOpen(false);
            setSearchQuery("");
            setSearchLoading(false);
        },
        []
    );


    // ——————————————————————————————————————————————
    // EFFECT: search fetch (sync esterna)
    // ——————————————————————————————————————————————
    /**
     * Effect unico per la search “as-you-type” con debounce.
     *
     * Disciplina:
     * - Questo effect gestisce SOLO la sincronizzazione con il mondo esterno (fetch + abort + loading + risultati).
     * - La logica applicativa/orchestrazione (reset totale, cambio tab, apertura/chiusura modale, pick item)
     *   vive esclusivamente nei "command handlers" (event → command → state).
     *
     * Comportamento:
     * - Debounce 300ms: la fetch parte solo quando l’utente smette di digitare per ~300ms, evitando spam al backend.
     * - Query vuota: nessuna fetch; pulizia dei risultati della tab corrente e abort di eventuali richieste in-flight.
     * - Race-safe: prima di avviare una nuova fetch, abortiamo sempre la precedente.
     *
     * Nota:
     * - Il cleanup cancella il timer del debounce; non abortiamo aggressivamente in cleanup per non troncare
     *   richieste “buone” già partite (abortiamo invece prima di una nuova fetch o quando la query diventa vuota/si chiude).
     */

    useEffect(() => {
        /**
         * Debounce timer id.
         * Nota: usiamo `ReturnType<typeof setTimeout>` per essere compatibili
         * sia in ambiente browser che Node typings.
         */
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        // Se la modale non è aperta, nessuna fetch e nessun timer.
        if (!searchOpen) {
            // Best effort: se esisteva una request in flight, abortiamola.
            if (searchAbortRef.current) {
                searchAbortRef.current.abort();
                searchAbortRef.current = null;
            }
            return;
        }

        const q = normalizeQuery(searchQuery);

        // Query vuota: puliamo risultati per la tab corrente e stop.
        // (No fetch; UX pulita)
        if (!q) {
            // Se stava caricando per una query precedente, qui vogliamo azzerare l'UI.
            setSearchLoading(false);

            // Abort della request precedente (se presente) per evitare callback tardive.
            if (searchAbortRef.current) {
                searchAbortRef.current.abort();
                searchAbortRef.current = null;
            }

            // Reset risultati SOLO della tab corrente.
            setResultsByMode((prev) => ({ ...prev, [mode]: [] } as ResultsByMode));
            return;
        }

        /**
         * Debounce 300ms:
         * - se l'utente continua a digitare, il cleanup cancella il timer
         * - la fetch parte solo quando la digitazione si "ferma" per 300ms
         */
        debounceTimer = setTimeout(() => {
            // Abort di qualunque richiesta precedente (race-safe)
            if (searchAbortRef.current) {
                searchAbortRef.current.abort();
            }

            const ctrl = new AbortController();
            searchAbortRef.current = ctrl;

            // Esegui ricerca per tab corrente
            runSearchByMode({
                mode,
                q,
                abortRef: searchAbortRef,
                setLoading: setSearchLoading,
                setResultsForMode,
            });
        }, 300);

        /**
         * Cleanup:
         * - cancella il timer se l'utente continua a scrivere / cambia tab / chiude modale
         * - abortisce anche l'eventuale request già partita, se preferisci comportamento aggressivo
         *
         * Nota: qui abortiamo SOLO se la request è partita.
         * Il timer cancellato impedisce l'avvio di nuove chiamate.
         */
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            // Importante: NON abortiamo sempre qui, altrimenti potresti troncare request
            // partita correttamente mentre l'utente non sta più digitando.
            // L'abort "giusto" viene fatto prima di avviare una nuova request (sopra),
            // oppure quando q diventa vuota / searchOpen chiude (rami sopra).
        };
    }, [searchOpen, searchQuery, mode, setResultsForMode]);


    // ——————————————————————————————————————————————
    // Render helpers: config per search panels
    // ——————————————————————————————————————————————
    /**
     * Config “data-driven” per rendere le 4 modali in modo coerente.
     * Riduce duplicazioni nel JSX e rende più facile aggiungere nuove tab.
     */
    const searchPanels = [
        {
            key: "rubrica" as const,
            isOpen: searchOpen && mode === "rubrica",
            Component: RubricaSearch,
            results: resultsByMode.rubrica,
            onPick: (it: RubricaItem) => pickItem("rubrica", it),
        },
        {
            key: "paymentMethods" as const,
            isOpen: searchOpen && mode === "paymentMethods",
            Component: PaymentMethodsSearch,
            results: resultsByMode.paymentMethods,
            onPick: (it: PaymentMethodItem) => pickItem("paymentMethods", it),
        },
        {
            key: "microsettori" as const,
            isOpen: searchOpen && mode === "microsettori",
            Component: MicrosettoriSearch,
            results: resultsByMode.microsettori,
            onPick: (it: MicrosettoriItem) => pickItem("microsettori", it),
        },
        {
            key: "garanzia" as const,
            isOpen: searchOpen && mode === "garanzia",
            Component: CondGaranziaSearch,
            results: resultsByMode.garanzia,
            onPick: (it: CondGaranziaItem) => pickItem("garanzia", it),
        },
    ];

    // Get view definition
    const viewDef = viewsRegistry.find((v) => v.id === mode);

    // Get selected item for current mode
    const activeSelectedItem = selectedByMode[mode];

    // ——————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————
    return (
        <DashboardLayout>
            <TopBar
                activeTab={mode}
                onTabChange={changeTab}
                onResetClick={resetAll}
                searchOpen={searchOpen}
                setSearchOpen={setSearchOpen}
            />

            {/* Views: render based on current mode */}
            {viewDef && (
                <ViewHost
                    def={viewDef}
                    selectedItem={activeSelectedItem}
                    resetToken={resetToken}
                    searchQuery={searchQuery}
                    colSettingsOpen={colSettingsOpen}
                    setColSettingsOpen={setColSettingsOpen}
                />
            )}

            {/* Search Panels: render data-driven */}
            {searchPanels.map(({ key, isOpen, Component, results, onPick }) => (
                <Component
                    key={key}
                    open={isOpen}
                    onClose={closeSearch}
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    results={results as any}
                    loading={searchLoading}
                    onPick={onPick as any}
                />
            ))}

            <Tooltip
                id="general-rubrica-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </DashboardLayout>
    );
}

export default Rubrica;
