// src/tour/types.ts
export type Role = "Dev" | "Admin" | "Buyer" | "Commerciale" | "Amministrativo" | "Logistica" | "Marketing" | "Tester";
export type Side = "top" | "bottom" | "left" | "right" | "center";

export type Step = {
    /** CSS selector o [data-tour="..."] */
    selector?: string;
    /** Titolo/descrizione liberi — o metti un render custom nello step */
    title?: React.ReactNode;
    description?: React.ReactNode;
    hint?: React.ReactNode;
    important?: React.ReactNode;
    side?: Side;
    /** Condizione per mostrare lo step (ruolo, feature flags, ecc.) */
    when?: (ctx: { role: Role }) => boolean;
    //per differenziare i ruoli durante il tour
    roles?: Role[];

    // --- Guidare il passo con un'azione utente
    /** Condizione per avanzare allo step successivo */
    advanceOn?: {
        selector?: string;                 // se assente usa "selector" dello step
        event?: keyof HTMLElementEventMap; // default: "click"
    };
    /**CSS selector da attendere prima di avanzare (es. il menu) */
    afterAdvanceWaitFor?: string;
    /** disabilita "Avanti" finché non avviene l'evento */
    blockNextUntilAdvance?: boolean;

    // ingresso pulito su elementi “dinamici”
    /**es. '[data-tour="comp-select-download-menu"]' */
    enterWaitFor?: string;
    enterDelayMs?: number;   // es. 120

    /** Callback on enter/leave step */
    onEnter?: (el: HTMLElement | null) => void;
    onLeave?: (el: HTMLElement | null) => void;

    perRoleText?: Partial<
        Record<
            Role,
            {
                title?: React.ReactNode;
                description?: React.ReactNode;
                hint?: React.ReactNode;
                important?: React.ReactNode;
            }
        >
    >;
};

export type TourConfig = {
    id: string;            // es: "nex_v2_dashboard_v2"
    version: string;       // es: "2.0.0"
    user: { id: string; role: Role };
    steps: Step[];
    autoStart?: boolean;   // prima volta
    autoStartDelay?: number;
};

export type TourDataTourId = string;

/**
 * Registry per prefissi data-tour per TourKey.
 * Esempio: documents -> "docs", rubrica -> "rubrica"
 */
export type TourPrefixMap<TourKey extends string> = Partial<Record<TourKey, string>>;

/**
 * Regole per costruire id data-tour in modo standard.
 * pattern default: "{prefix}-{scope}-{name}"
 */
export type TourDataTourPattern = (args: {
    prefix: string;
    scope?: string;
    name: string;
}) => TourDataTourId;

/**
 * Opzioni per generare un oggetto di data-tour ids per un componente:
 * - scope: contesto del componente (es. "filters")
 * - names: elenco di chiavi che vuoi generare (es. ["panel","close","active"])
 * - perKeyPrefix: mapping tourKey -> prefisso
 * - fallbackPrefix: usato se tour non attivo o non mappato
 * - pattern: personalizza la stringa finale
 * - overrides: override puntuali (es. per una pagina specifica)
 */
export type TourDataTourResolverOptions<TourKey extends string, K extends string> = {
    scope?: string;
    names: readonly K[];
    perKeyPrefix: TourPrefixMap<TourKey>;
    fallbackPrefix?: string;
    pattern?: TourDataTourPattern;
    overrides?: Partial<Record<TourKey, Partial<Record<K, TourDataTourId>>>>;
};