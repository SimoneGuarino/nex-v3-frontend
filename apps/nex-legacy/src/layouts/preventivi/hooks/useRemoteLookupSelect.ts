/**
 * Hook condiviso per le select remote della sezione Preventivi.
 *
 * Scopo del file:
 * - centralizzare la logica di lookup server-side per campi come cliente/agente;
 * - gestire debounce e cancellazione richieste concorrenti;
 * - mantenere coerente la label selezionata anche quando abbiamo solo il codice (URL/refresh).
 *
 * In questo modo i componenti UI restano più semplici e si limitano a passare
 * fetcher + mapper specifici del dominio.
 */
import { useEffect, useMemo, useState } from "react";
import type { PaginatedResponse } from "../types";

type SelectOption = { value: string; label: string };

type UseRemoteLookupSelectArgs<T> = {
    userContext: any;
    env: string;
    search: string;
    code: string;
    minQueryLength: number;
    fetcher: (args: {
        userContext: any;
        abortController: AbortController;
        page: number;
        pageSize: number;
        env?: string;
        q?: string;
    }) => Promise<PaginatedResponse<T>>;
    mapRowToOption: (row: T) => SelectOption | null;
    matchesCode: (row: T, code: string) => boolean;
    normalizeCode?: (value: string) => string;
};

export function useRemoteLookupSelect<T>({
    userContext,
    env,
    search,
    code,
    minQueryLength,
    fetcher,
    mapRowToOption,
    matchesCode,
    normalizeCode = (value) => value.trim(),
}: UseRemoteLookupSelectArgs<T>) {
    const [lookupOptions, setLookupOptions] = useState<SelectOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);

    /**
     * Normalizza il codice in ingresso (es. trim/uppercase) per avere confronti stabili
     * tra valore controllato, opzioni remote e opzione selezionata.
     */
    const normalizedCode = useMemo(() => normalizeCode(code), [code, normalizeCode]);

    /**
     * Unisce risultati lookup e opzione selezionata in una lista unica senza duplicati.
     * Se manca una label "ricca", espone almeno il codice come fallback visivo.
     */
    const options = useMemo(() => {
        const map = new Map<string, SelectOption>();

        lookupOptions.forEach((opt) => {
            if (!opt?.value) return;
            map.set(opt.value, opt);
        });

        if (selectedOption?.value) {
            map.set(selectedOption.value, selectedOption);
        } else if (normalizedCode && !map.has(normalizedCode)) {
            map.set(normalizedCode, { value: normalizedCode, label: normalizedCode });
        }

        return Array.from(map.values());
    }, [lookupOptions, normalizedCode, selectedOption]);

    /**
     * Effetto di lookup live mentre l'utente digita:
     * - applica soglia minima caratteri;
     * - usa debounce (250ms) per ridurre chiamate;
     * - abortisce la richiesta precedente su cambi rapidi di input.
     */
    useEffect(() => {
        const query = search.trim();
        if (!userContext?.token) return;
        if (!query || query.length < minQueryLength) {
            setLookupOptions([]);
            return;
        }

        const abortController = new AbortController();
        const timer = setTimeout(() => {
            fetcher({
                userContext,
                abortController,
                page: 1,
                pageSize: 20,
                env: env || undefined,
                q: query,
            })
                .then((res) => {
                    const nextOptions = Array.isArray(res?.items)
                        ? res.items
                            .map(mapRowToOption)
                            .filter((opt): opt is SelectOption => Boolean(opt?.value))
                        : [];
                    setLookupOptions(nextOptions);
                })
                .catch(() => {
                    setLookupOptions([]);
                });
        }, 250);

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [env, fetcher, mapRowToOption, minQueryLength, search, userContext]);

    /**
     * Effetto di reidratazione della select quando conosciamo solo il codice.
     * Esempio: refresh pagina o querystring con `customerCode/agentCode`.
     *
     * Prova a risolvere una label completa dal backend; se non trova match,
     * mantiene comunque il codice come opzione valida per non perdere stato UI.
     */
    useEffect(() => {
        if (!normalizedCode || !userContext?.token) return;
        if (selectedOption?.value === normalizedCode) return;
        if (options.some((opt) => opt.value === normalizedCode)) return;

        let active = true;
        const abortController = new AbortController();

        fetcher({
            userContext,
            abortController,
            page: 1,
            pageSize: 20,
            env: env || undefined,
            q: normalizedCode,
        })
            .then((res) => {
                if (!active) return;

                const match = Array.isArray(res?.items)
                    ? res.items.find((row) => matchesCode(row, normalizedCode))
                    : null;

                if (match) {
                    const option = mapRowToOption(match);
                    setSelectedOption(option ?? { value: normalizedCode, label: normalizedCode });
                    return;
                }

                setSelectedOption({ value: normalizedCode, label: normalizedCode });
            })
            .catch(() => {
                if (!active) return;
                setSelectedOption({ value: normalizedCode, label: normalizedCode });
            });

        return () => {
            active = false;
            abortController.abort();
        };
    }, [env, fetcher, mapRowToOption, matchesCode, normalizedCode, options, selectedOption, userContext]);

    return {
        options,
        selectedOption,
        setSelectedOption,
    };
}
