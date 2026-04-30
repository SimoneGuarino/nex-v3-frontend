//src\layouts\queryAS400\components\virtualized-results-adapter.tsx
import React, { useMemo } from "react";
import { TableVirtualized } from "components/Virtualized/table";

/**
 * riga generica: una mappa "colonna -> valore".
 * viene usata perché i risultati delle query hanno schema dinamico
 * (le colonne possono cambiare tra una query e l'altra).
 */
type Row = Record<string, any>;

/**
 * stima la larghezza consigliata di una colonna in pixel.
 *
 * logica:
 * - usa la lunghezza dell'etichetta (nome colonna) come base minima;
 * - considera anche un piccolo campione di celle (in stringa) per cogliere contenuti lunghi;
 * - moltiplica la lunghezza del testo per 10 come euristica (caratteri -> px);
 * - applica clamp: min 100px, max 350px per evitare colonne troppo strette o inutilmente larghe.
 *
 * nota: è una stima "best effort", non misura reale del DOM.
 * se vuoi precisione totale, dovresti misurare il contenuto renderizzato, ma costerebbe molto.
 */
function estimateWidth(label: string, sample: string[]): number {
    const base = Math.max(
        8 * label.length, // base minima: lunghezza del nome colonna (più "stretta")
        ...sample.map((s) => (s?.length ?? 0) * 10) // campione righe: contenuto * 10px
    );
    // clamp tra 100 e 350 px
    return Math.min(Math.max(base, 100), 350);
}

/**
 * adattatore tra i risultati "grezzi" delle query (rows/columns dinamici)
 * e il componente generico di tabella virtualizzata (TableVirtualized).
 *
 * responsabilità:
 * - derivare lo "schema" (lista nomi colonna) dai dati;
 * - calcolare l'array "columns" nel formato atteso da TableVirtualized;
 * - forzare il "remount" della tabella quando cambia lo schema,
 *   così il suo stato interno (es. colonne visibili) si resetta correttamente;
 * - passare i dati direttamente, senza mantenere uno stato locale "ombra"
 *   (evitiamo disallineamenti tra props e stato).
 *
 * NON gestisce:
 * - infinite scroll (qui non abbiamo offset/cursor per le query AS400);
 * - cookie preferenze colonne (volendo si può aggiungere in TableVirtualized);
 * - sorting/filtri client (la tabella è un puro viewer).
 */
export default function VirtualizedResultsAdapter({
    rows,
    count,
    height = "60vh",
}: {
    /** righe della query (array di oggetti con chiavi = colonne) */
    rows: Row[];
    /** numero totale righe secondo il backend (può essere >= rows.length) */
    count: number;
    /** altezza area scrollabile; accetta px (numero) o valori CSS (es. "60vh") */
    height?: number | string;
}) {
    /**
     * ricava l'elenco delle colonne a partire dalla prima riga,
     * assumendo che tutte le righe condividano lo stesso schema.
     *
     * useMemo: ricalcola solo quando cambiano le "rows".
     */
    const cols = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows]);

    /**
     * chiave di schema: serializza i nomi colonna.
     * usata come "key" sul componente TableVirtualized per forzarne il remount
     * ogni volta che lo schema cambia. Questo evita bug dovuti a stato interno
     * (es. visibilità colonne/lartezze salvate) rimasto appeso al render precedente.
     */
    const schemaKey = useMemo(() => JSON.stringify(cols), [cols]);

    /**
     * costruisce la definizione delle colonne nel formato atteso da TableVirtualized.
     *
     * Dettaglio importante (➡️ come nel layout che funziona):
     *  - `onHover: true` abilita la logica di tooltip interna del componente;
     *  - `sxText` gestisce il truncation (ellipsis) così il tooltip mostra il contenuto pieno;
     *  - `sx` allinea il contenuto (qui centrato, cambialo se preferisci).
     */
    const columns = useMemo(() => {
        if (cols.length === 0) return [];

        // indici campione per la stima (difensivo: filtra quelli fuori range)
        const sampleIdx = [0, Math.floor(rows.length / 2), rows.length - 1].filter(
            (i) => i >= 0 && i < rows.length
        );

        // mappa: colonna -> array di stringhe campione
        const sampleStrings: Record<string, string[]> = {};
        cols.forEach((c) => {
            sampleStrings[c] = sampleIdx.map((i) => String(rows[i]?.[c] ?? ""));
        });

        // definizione colonne per TableVirtualized (⚠️ parti “essenziali” per tooltip)
        return cols.map((label) => ({
            key: label, // identificatore colonna
            label, // testo header
            type: "default",
            sort: false, // niente sorting client qui
            sortType: "string", // neutro; non influisce sui tooltip
            width: estimateWidth(label, sampleStrings[label]), // larghezza stimata
            maxWidth: 350, // limite superiore coerente
            onHover: true, // ⬅️ abilita i tooltip cella del componente
            sx: { textAlign: "center" }, // stile cella (opzionale)
            sxText: {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                WebkitLineClamp: "1", // una riga con ellissi: il tooltip mostra il contenuto completo
            },
        }));
    }, [cols, rows]);

    /**
     * no-op per setData / setColumns:
     * TableVirtualized espone API di aggiornamento stato (utile in altri contesti),
     * ma in questo viewer non vogliamo mutare i dati o la definizione delle colonne
     * a runtime; per evitare errori di tipo passiamo funzioni vuote.
     */
    const noop = () => { };

    return (
        <TableVirtualized
            /**
             * forza il remount quando cambia lo schema (lista nomi colonna).
             * questo resetta lo stato interno di TableVirtualized (es. colonne visibili),
             * evitando glitch quando due query hanno colonne "simili" o parzialmente coincidenti.
             */
            key={schemaKey}
            /**
             * passiamo i dati direttamente (senza stato locale).
             * questo mantiene le props come "fonte di verità" ed evita desincronizzazioni.
             */
            data={rows}
            setData={noop as any}
            /**
             * definizione colonne calcolata in modo deterministico dal contenuto.
             * (con onHover/sxText per tooltip come nel layout che funziona)
             */
            columns={columns as any}
            setColumns={noop as any}
            /**
             * metadato utile al footer e alla paginazione/infinite scroll (quando presente).
             * qui serve a mostrare il "totale" righe complessivo.
             */
            results={count}
            /**
             * altezza dell'area scrollabile della tabella.
             * es: "60vh", 480, "520px", ecc.
             */
            height={height}
            /**
             * lo stato di caricamento qui è sempre "false" (mostriamo direttamente la tabella).
             * eventuali loader/empty-state sono gestiti a monte (ResultsViewer).
             */
            loadStatus={false}
            /**
             * niente footer (controlli/summary) in questo viewer dei risultati query.
             * se serve, impostarlo a true e configurare footerSettings in TableVirtualized.
             */
            footer={false}
            /**
             * larghezza minima di una colonna (coerente con le nostre stime).
             * evita colonne con larghezze ridicole su testi brevi.
             */
            minColWidth={100}
            /**
             * stile riga “bottom-line” come nel layout di esempio (opzionale ma identico all’altro).
             */
            tableType="bottom-line"
        />
    );
}
