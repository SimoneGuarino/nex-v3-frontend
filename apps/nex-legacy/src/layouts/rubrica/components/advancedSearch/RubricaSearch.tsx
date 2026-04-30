import React, { useCallback, useMemo, useState } from "react";
import FDSearchPanel, {
    type SearchItem,
    writeRecent,
} from "components/UI/search/FDSearchPanel";
import type { RubricaItem } from "../../fetchdatas/getRubricaData";
import { MdPerson } from "react-icons/md";

const MdPersonIcon = MdPerson as React.FC<{ size?: number; className?: string }>;

const RECENT_COOKIE = "fd_rubrica_recent_search";
const RECENT_LIMIT = 10;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface RubricaSearchProps {
    open: boolean;
    onClose: () => void;

    query: string;
    onQueryChange: (q: string) => void;

    results: RubricaItem[];
    loading: boolean;

    onPick: (item: RubricaItem) => void;
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
 * Trasforma i risultati Rubrica in item compatibili con FDSearchPanel
 * @param results
 * @returns
 */
function buildItems(results: RubricaItem[]): SearchItem<RubricaItem>[] {
    return (results || []).map((r, idx) => {
        const fullName = [r.nome, r.cognome].filter(Boolean).join(" ");

        const subtitleParts: string[] = [];
        if (r.email) subtitleParts.push(r.email);
        if (r.interno) subtitleParts.push(`interno ${r.interno}`);
        if (r.sede) subtitleParts.push(r.sede);
        if (r.mobile) subtitleParts.push(r.mobile);

        const subtitle = subtitleParts.join(" • ");

        const id =
            r.email ||
            (r.interno ? `interno-${r.interno}` : undefined) ||
            `${r.nome}-${r.cognome}-${idx}`;

        return {
            id,
            title: fullName || r.email || `Contatto ${idx + 1}`,
            subtitle,
            iconLeft: <MdPersonIcon />,
            payload: r,
        };
    });
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pannello di ricerca avanzata per Rubrica (con recenti su cookie)
 * @param param0
 * @returns
 */
export default function RubricaSearch({
    open,
    onClose,
    query,
    onQueryChange,
    results,
    loading,
    onPick,
}: RubricaSearchProps) {
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
            placeholder="Cerca in rubrica…"
            onSelect={(it: SearchItem<RubricaItem>) => {
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
