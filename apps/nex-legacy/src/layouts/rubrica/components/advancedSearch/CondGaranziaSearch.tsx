import React, { useCallback, useMemo, useState } from "react";
import FDSearchPanel, {
    type SearchItem,
    writeRecent,
} from "components/UI/search/FDSearchPanel";
import type { CondGaranziaItem } from "../../fetchdatas/getCondGaranziaData";
import { MdPerson } from "react-icons/md";

const MdPersonIcon = MdPerson as React.FC<{ size?: number; className?: string }>;

const RECENT_COOKIE = "fd_garanzia_recent_search";
const RECENT_LIMIT = 10;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface CondGaranziaSearchProps {
    open: boolean;
    onClose: () => void;

    query: string;
    onQueryChange: (q: string) => void;

    results: CondGaranziaItem[];
    loading: boolean;

    onPick: (item: CondGaranziaItem) => void;
};


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
};

/**
 * Costruisce la subtitle (info rapide) per un item di garanzia
 * @param r
 * @returns
 */
function buildSubtitle(r: CondGaranziaItem): string {
    const parts: string[] = [];

    if (r.DOA === "Si") {
        if (r.chiGestisceIlDoa) parts.push(r.chiGestisceIlDoa);
        if (r.DOAGiorni) parts.push(r.DOAGiorni);
    }

    if (r.durataGaranzia) {
        parts.push(`durata garanzia: ${r.durataGaranzia}`);
    }

    return parts.filter(Boolean).join(" • ");
};

/**
 * Trasforma i risultati in item compatibili con FDSearchPanel
 * @param results
 * @returns
 */
function buildItems(results: CondGaranziaItem[]): SearchItem<CondGaranziaItem>[] {
    return (results || []).map((r, idx) => {
        const id = r.brand || r.contatto || `garanzia-${idx}`;
        const title = r.brand || r.contatto || `Voce ${idx + 1}`;

        return {
            id,
            title,
            subtitle: buildSubtitle(r),
            iconLeft: <MdPersonIcon />,
            payload: r,
        };
    });
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pannello di ricerca avanzata per Condizioni di Garanzia (con recenti su cookie)
 * @param param0
 * @returns
 */
export default function CondGaranziaSearch({
    open,
    onClose,
    query,
    onQueryChange,
    results,
    loading,
    onPick,
}: CondGaranziaSearchProps) {
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
            placeholder="Cerca in condizioni garanzia..."
            onSelect={(it: SearchItem<CondGaranziaItem>) => {
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