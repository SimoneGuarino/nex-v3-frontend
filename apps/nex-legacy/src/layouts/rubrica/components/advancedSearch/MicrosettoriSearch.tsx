import React, { useCallback, useMemo, useState } from "react";

import { writeRecent } from "utils";
import { FDSearchPanel, type SearchItem } from "@nex/fd-ui"

import type { MicrosettoriItem } from "../../fetchdatas/getMicrosettoriData";
import { MdCategory } from "react-icons/md";

const MdCategoryIcon = MdCategory as React.FC<{ size?: number; className?: string }>;

const RECENT_COOKIE = "fd_microsettori_recent_search";
const RECENT_LIMIT = 10;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface MicrosettoriSearchProps {
    open: boolean;
    onClose: () => void;

    query: string;
    onQueryChange: (q: string) => void;

    results: MicrosettoriItem[];
    loading: boolean;

    onPick: (item: MicrosettoriItem) => void;
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Salva la query tra le ricerche recenti (no duplicati, ultimo in testa)
 * @param q
 * @param setRecent
 */
function commitSearchIfNeeded(
    q: string,
    setRecent: React.Dispatch<React.SetStateAction<string[]>>
) {
    const t = q.trim();
    if (!t) return;

    setRecent((prev) => {
        const without = prev.filter((x) => x.toLowerCase() !== t.toLowerCase());
        const next = [t, ...without].slice(0, RECENT_LIMIT);
        writeRecent(RECENT_COOKIE, next);
        return next;
    });
}

/**
 * Trasforma i risultati in item compatibili con FDSearchPanel
 * @param results
 * @returns
 */
function buildItems(results: MicrosettoriItem[]): SearchItem<MicrosettoriItem>[] {
    return (results || []).map((r, idx) => {
        const title = r.code
            ? `${r.code} – ${r.description}`
            : r.description || `Microsettore ${idx + 1}`;

        const id = r.code || `microsettore-${idx}`;

        return {
            id,
            title,
            subtitle: r.description,
            iconLeft: <MdCategoryIcon />,
            payload: r,
        };
    });
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pannello di ricerca avanzata per Microsettori (con recenti su cookie)
 * @param param0
 * @returns
 */
export default function MicrosettoriSearch({
    open,
    onClose,
    query,
    onQueryChange,
    results,
    loading,
    onPick,
}: MicrosettoriSearchProps) {
    const [recent, setRecent] = useState<string[]>([]); //recenti personalizzati (gestiti anche via cookie)

    const handleCommitSearch = useCallback((q: string) => commitSearchIfNeeded(q, setRecent), []);

    const items = useMemo(() => buildItems(results), [results]);

    return (
        <FDSearchPanel
            open={open}
            onClose={onClose}
            query={query}
            onQueryChange={onQueryChange}
            items={items}
            appliedFilters={[]}
            highlight
            placeholder="Cerca nei microsettori…"
            onSelect={(it: SearchItem<MicrosettoriItem>) => {
                if (!it.payload) return;
                handleCommitSearch(query); //salva query corrente nelle recenti
                onPick(it.payload);
            }}
            recentSearch={{
                enabled: true,
                cookieName: RECENT_COOKIE,
                limit: RECENT_LIMIT,
            }}
            id_tooltip="rubrica-search-tooltip"
            loading={loading}
            customRecent={recent}
            setCustomRecent={setRecent}
        />
    );
}
