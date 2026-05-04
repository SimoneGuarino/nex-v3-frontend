import React, { memo, useMemo } from "react";
import { randomIntFromInterval } from "utils";

/**
 * clsx minimale (coerente con gli altri componenti FD).
 * - No dipendenze esterne: evita bundle bloat e rende il componente portabile.
 */
function clsx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

/**
 * Effetto visivo dello skeleton.
 * Nota: per default usiamo "pulse" perché:
 * - è nativo Tailwind
 * - non richiede keyframes custom
 * - è stabile e consistente cross-browser
 */
export type FDSkeletonEffect = "pulse" | "none";

/**
 * Shape/forma dello skeleton.
 * - "rect": blocco standard
 * - "circle": avatar / icone
 * - "text": linee testo (di solito con altezza ridotta)
 *
 * NOTA: non generiamo classi Tailwind dinamiche (es. `rounded-${x}`)
 * per evitare purge. Manteniamo mapping statici.
 */
export type FDSkeletonShape = "rect" | "circle" | "text";

/**
 * Props del building block.
 * Questo è lo "strumento base" per coprire il 90% dei casi.
 */
export type FDSkeletonProps = {
    /**
     * className aggiuntiva (tipico: `h-9 w-full`, `w-32 h-4`, ecc.)
     * L'idea è: dimensioni/composizione le decidi tu, lo stile comune lo decide FD.
     */
    className?: string;

    /**
     * Permette di impostare width/height senza Tailwind (utile se arrivi da design tokens).
     * Se usi Tailwind, puoi ignorarlo.
     */
    style?: React.CSSProperties;

    /** Forma base: rect/circle/text */
    shape?: FDSkeletonShape;

    /** Effetto: pulse o none */
    effect?: FDSkeletonEffect;

    /**
     * Per casi avanzati: se vuoi che lo skeleton occupi spazio ma sia invisibile (debug/layout).
     * Default: false.
     */
    invisible?: boolean;

    /**
     * Accessibilità:
     * - aria-busy lo gestiamo nei wrapper, ma qui rendiamo il blocco “non focusable”.
     * - role="status" non è necessario sul singolo blocco; meglio sul container.
     */
    "data-testid"?: string;
};

/**
 * Mapping statico per evitare classi Tailwind dinamiche.
 * Questo è cruciale in codebase grandi:
 * - il purge/scan di Tailwind deve "vedere" le classi a build-time
 * - niente stringhe generate tipo `rounded-${...}`
 */
const SHAPE_CLASS: Record<FDSkeletonShape, string> = {
    rect: "rounded",
    circle: "rounded-full",
    // "text" di default ha un rounding più “soft” e altezza tipica più bassa (via className)
    text: "rounded-md",
};

const EFFECT_CLASS: Record<FDSkeletonEffect, string> = {
    pulse: "animate-pulse",
    none: "",
};

/**
 * Classi base condivise:
 * - bg neutro in light + dark
 * - overflow-hidden per evitare artefatti su rounding
 *
 * NOTA: non scegliamo colori “brand-specific” qui: skeleton deve essere neutro.
 * Se la tua UI è prevalentemente dark come nel tuo snippet, questa base resta corretta.
 */
const BASE_CLASS =
    "block overflow-hidden bg-neutral-200 dark:bg-neutral-700";

/**
 * FDSkeleton: building block minimo, ultra-riusabile.
 * - memo per evitare rerender inutili quando props non cambiano
 * - nessuna logica di layout: quello lo fa il caller o il layout renderer
 */
export const FDSkeleton = memo(function FDSkeleton({
    className,
    style,
    shape = "rect",
    effect = "pulse",
    invisible = false,
    "data-testid": dataTestId,
}: FDSkeletonProps) {
    return (
        <span
            data-testid={dataTestId}
            // Lo skeleton non deve mai essere focusable.
            // Usiamo <span> per semantica neutra e minor overhead rispetto a div.
            className={clsx(
                BASE_CLASS,
                SHAPE_CLASS[shape],
                EFFECT_CLASS[effect],
                invisible && "opacity-0",
                className
            )}
            style={style}
        />
    );
});


/* -------------------------------------------------------------------------------------------------
 * Layout compositivo (mosaici complessi)
 * -------------------------------------------------------------------------------------------------
 *
 * Problema reale in enterprise:
 * - fare 20 <div className="... animate-pulse" /> sparsi porta a:
 *   - duplicazione
 *   - incoerenza visiva
 *   - refactor costoso
 *
 * Soluzione:
 * - un renderer “data-driven” che descrive la struttura (row/col/grid + blocks)
 * - la UI skeleton diventa una “vista” generata da config
 */

/**
 * Nodo del layout skeleton.
 * - "block": un singolo rettangolo/cerchio/linea
 * - "row"/"col": flex containers
 * - "grid": grid container (per liste/tiles)
 */
export type FDSkeletonNode =
    | {
          type: "block";
          key?: React.Key;
          className?: string;
          style?: React.CSSProperties;
          shape?: FDSkeletonShape;
          effect?: FDSkeletonEffect;
          invisible?: boolean;
          "data-testid"?: string;
      }
    | {
          type: "row" | "col";
          key?: React.Key;
          className?: string;
          style?: React.CSSProperties;
          gap?: number; // gap in "rem" via style (evita classi dinamiche)
          children: FDSkeletonNode[] | readonly FDSkeletonNode[];
      }
    | {
          type: "grid";
          key?: React.Key;
          className?: string;
          style?: React.CSSProperties;
          gap?: number; // gap in "rem"
          /**
           * columns/rows sono numeri: usiamo style inline per evitare classi dinamiche tipo `grid-cols-${n}`
           */
          columns?: number;
          rows?: number;
          children: FDSkeletonNode[];
      };

/**
 * Props del renderer.
 */
export type FDSkeletonLayoutProps = {
    /**
     * Layout radice.
     * Tipicamente: una colonna con righe/blocks dentro.
     */
    layout: FDSkeletonNode;

    /**
     * Accessibilità:
     * - role="status" + aria-live: comunica “loading” ai lettori di schermo.
     * - aria-busy: segnala che il contenuto non è pronto.
     */
    ariaLabel?: string;

    /** className del wrapper esterno */
    className?: string;

    /** Se true, non renderizza nulla (utile per feature flag / conditional). */
    disabled?: boolean;
};

/**
 * Render ricorsivo:
 * - funzione pura
 * - nessuno stato
 * - chiavi stabili quando fornite
 */
function renderNode(node: FDSkeletonNode, index: number): React.ReactNode {
    const key = node.key ?? index;

    switch (node.type) {
        case "block":
            return (
                <FDSkeleton
                    key={key}
                    className={node.className}
                    style={node.style}
                    shape={node.shape}
                    effect={node.effect}
                    invisible={node.invisible}
                    data-testid={node["data-testid"]}
                />
            );

        case "row": {
            const style = node.gap
                ? { ...node.style, gap: `${node.gap}rem` }
                : node.style;

            return (
                <div
                    key={key}
                    className={clsx("flex flex-row", node.className)}
                    style={style}
                >
                    {node.children.map(renderNode)}
                </div>
            );
        }

        case "col": {
            const style = node.gap
                ? { ...node.style, gap: `${node.gap}rem` }
                : node.style;

            return (
                <div
                    key={key}
                    className={clsx("flex flex-col", node.className)}
                    style={style}
                >
                    {node.children.map(renderNode)}
                </div>
            );
        }

        case "grid": {
            const style: React.CSSProperties = {
                ...node.style,
                display: "grid",
                ...(node.columns ? { gridTemplateColumns: `repeat(${node.columns}, minmax(0, 1fr))` } : null),
                ...(node.rows ? { gridTemplateRows: `repeat(${node.rows}, minmax(0, 1fr))` } : null),
                ...(node.gap ? { gap: `${node.gap}rem` } : null),
            };

            return (
                <div key={key} className={node.className} style={style}>
                    {node.children.map(renderNode)}
                </div>
            );
        }

        default:
            // Exhaustive check: se TypeScript è configurato bene, qui non ci arrivi mai.
            return null;
    }
}

/**
 * FDSkeletonLayout: renderer compositivo.
 * - memo + useMemo per stabilizzare output quando layout non cambia
 * - wrapper accessibile (role/status)
 */
export const FDSkeletonLayout = memo(function FDSkeletonLayout({
    layout,
    ariaLabel = "Caricamento in corso",
    className,
    disabled = false,
}: FDSkeletonLayoutProps) {
    const tree = useMemo(() => renderNode(layout, 0), [layout]);

    if (disabled) return null;

    return (
        <div
            className={className}
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label={ariaLabel}
        >
            {tree}
        </div>
    );
});


/* -------------------------------------------------------------------------------------------------
 * Wrapper ergonomico: sostituisce {loading ? skeleton : children}
 * ------------------------------------------------------------------------------------------------- */
export type FDSkeletonSwitchProps = {
    loading: boolean;

    /**
     * skeleton può essere:
     * - un singolo FDSkeleton
     * - un FDSkeletonLayout
     * - qualunque JSX (per compatibilità)
     */
    skeleton: React.ReactNode;

    /** Contenuto reale quando loading = false */
    children: React.ReactNode;

    /**
     * Opzione enterprise utile:
     * - true: mantiene il contenuto montato e lo nasconde (evita teardown/remount costoso)
     * - false: rimuove il contenuto quando loading (default)
     *
     * Usalo in:
     * - tabelle pesanti
     * - grafici
     * - componenti con stato interno che non vuoi resettare
     */
    keepMounted?: boolean;

    /** className wrapper */
    className?: string;
};

/**
 * FDSkeletonSwitch:
 * - evita ripetizione pattern loading
 * - mantiene coerente la semantica aria-busy a livello di sezione
 */
export const FDSkeletonSwitch = memo(function FDSkeletonSwitch({
    loading,
    skeleton,
    children,
    keepMounted = false,
    className,
}: FDSkeletonSwitchProps) {
    if (!keepMounted) {
        return <div className={className}>{loading ? skeleton : children}</div>;
    }

    return (
        <div className={className} aria-busy={loading ? "true" : "false"}>
            {/* Skeleton visibile solo in loading */}
            {loading && skeleton}

            {/* Contenuto montato sempre; nascosto quando loading */}
            <div className={loading ? "hidden" : "block"}>{children}</div>
        </div>
    );
});


/* -------------------------------------------------------------------------------------------------
 * Preset "factory" (opzionale ma molto utile in enterprise)
 * -------------------------------------------------------------------------------------------------
 *
 * Qui definiamo preset ricorrenti: avatar + linee testo, card list, table rows, ecc.
 * In grandi codebase, i preset:
 * - riducono boilerplate
 * - standardizzano l’aspetto
 * - rendono i layout skeleton “semanticamente” leggibili
 */

export const FDSkeletonPresets = {
    /**
     * Preset: singola riga input/select/button (il tuo caso tipico h-9 w-full).
     * NOTE: se cambi altezza o rounding, lo fai qui e si propaga ovunque usato.
     */
    fieldRow(className?: string, h?: number | string): React.ReactNode {
        return <FDSkeleton className={clsx(`h-${h ?? 9} w-full`, className)} />;
    },

    /**
     * Preset: avatar + 2 linee testo (tipico header card/list item).
     */
    avatarWithText(): FDSkeletonNode {
        return {
            type: "row",
            gap: 0.75,
            className: "items-center",
            children: [
                { type: "block", shape: "circle", className: "h-10 w-10" },
                {
                    type: "col",
                    gap: 0.5,
                    className: "flex-1",
                    children: [
                        { type: "block", shape: "text", className: "h-4 w-1/2" },
                        { type: "block", shape: "text", className: "h-3 w-2/3 opacity-80" },
                    ],
                },
            ],
        };
    },

    /**
     * Preset: lista di card (es. 3 righe).
     * - ottimo per pagine che caricano collezioni.
     */
    avatarCardList(rows: number = 3): FDSkeletonNode {
        return {
            type: "col",
            gap: 0.75,
            children: Array.from({ length: rows }).map((_, i) => ({
                type: "col",
                key: `card-${i}`,
                className: "p-4 rounded-xl border border-neutral-200/40 dark:border-neutral-700/60",
                gap: 0.75,
                children: [
                    this.avatarWithText(),
                    { type: "block", shape: "text", className: "h-3 w-full opacity-80" },
                    { type: "block", shape: "text", className: "h-3 w-5/6 opacity-70" },
                ],
            })),
        };
    },

    /**
     * Preset: lista di card (es. 3 righe).
     * - ottimo per pagine che caricano collezioni.
     */
    cardList(rows: number = 3, settings: {
        /**
         * Se true, randomizza l'altezza di ogni riga entro un range (es. 12-30px) per un effetto più “organico” e meno “rigido”.
         * Default: false (altezza fissa per tutte le righe).
         * Nota: se usi rangeRowHeight, randomizeHeight è implicito.
         */
        randomizeHeight?: boolean;
        /**
         * Range di altezza in pixel per ogni riga quando randomizeHeight è true (es. [12, 30]).
         * dove il valore 1 è il min e il valore 2 è il max. Il range è chiuso: include entrambi i valori.
         * Default: [12, 30].
         */
        rangeRowHeight?: [number, number];
        /**
         * Altezza fissa di ogni riga quando randomizeHeight è false (es. 20px).
         * Default: 20.
         */
        rowHeight: number;
    } = { rowHeight: 60, rangeRowHeight: [12, 30] }): FDSkeletonNode {
        return {
            type: "col",
            gap: 0.75,
            children: Array.from({ length: rows }).map((_, i) => ({
                type: "col",
                key: `card-${i}`,
                gap: 0.75,
                children: [
                    { type: "block", shape: "rect", style: { height: `${(settings.randomizeHeight && settings.rangeRowHeight) ? 
                        randomIntFromInterval(settings.rangeRowHeight[0], settings.rangeRowHeight[1]) : settings.rowHeight}px` }, 
                    className: `w-full opacity-80` },
                ],
            })),
        };
    },
} as const;