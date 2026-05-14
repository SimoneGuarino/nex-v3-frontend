import type {
    CustomersPanelInteractionLockConfig,
    CustomersPanelInteractionLockRule,
    StepSelectorMatcher,
} from "./types";

/**
 * Verifica se lo step selector attivo combacia con un matcher configurato.
 * Supporta sia stringhe esatte sia regex.
 */
function matchStepSelector(
    activeStepSelector: string | undefined,
    matcher: StepSelectorMatcher,
): boolean {
    if (!activeStepSelector) return false;
    if (typeof matcher === "string") return activeStepSelector === matcher;
    return matcher.test(activeStepSelector);
}

/**
 * Risolve la regola lock attiva in base allo stato tour corrente.
 *
 * Perché esiste:
 * - centralizza la logica di match (tourKey + step selector);
 * - evita duplicazioni nei componenti UI;
 * - rende la CustomersPanel riusabile tra più tour.
 */
export function resolveCustomersPanelInteractionLockRule(params: {
    isTourOpen: boolean;
    /**
     * Chiave singola del tour attivo.
     * Fallback usato quando `activeKeys` non è valorizzato durante alcune transizioni.
     */
    activeKey?: string;
    /**
     * Elenco chiavi tour attive (caso standard).
     */
    activeKeys?: string[];
    activeStepSelector?: string;
    config?: CustomersPanelInteractionLockConfig;
}): CustomersPanelInteractionLockRule | null {
    const { isTourOpen, activeKey, activeKeys, activeStepSelector, config } = params;

    if (!isTourOpen) return null;
    if (!config?.enabled) return null;
    if (!config.byTourKey) return null;

    /**
     * Normalizziamo le chiavi con un fallback esplicito:
     * - prima usiamo `activeKeys` (supporto multi-tour);
     * - se manca/è vuoto, usiamo `activeKey`.
     *
     * Questo evita "buchi" di lock quando il provider, in fase di back/forward,
     * espone temporaneamente solo la chiave singola.
     */
    const keys = (activeKeys?.length ? activeKeys : activeKey ? [activeKey] : []).filter(Boolean);
    if (!keys.length) return null;

    for (const key of keys) {
        const rules = config.byTourKey[key] ?? [];
        const matched = rules.find((rule) =>
            Array.isArray(rule.stepSelectors) &&
            rule.stepSelectors.some((matcher) => matchStepSelector(activeStepSelector, matcher)),
        );
        if (matched) return matched;
    }

    return null;
}
