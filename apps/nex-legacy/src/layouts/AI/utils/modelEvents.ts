// src/layouts/AI/utils/modelEvents.ts

// ——————————————————————————————————————————————————————————
// EVENTS NAMES
// ——————————————————————————————————————————————————————————
export const AI_SELECTED_MODEL_CHANGE_EVENT = "ai:selectedModelChange";
export const AI_REQUEST_SELECTED_MODEL_EVENT = "ai:requestSelectedModel";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
export type SelectedModelDetail = {
    value: string;
};

// ——————————————————————————————————————————————————————————
// EVENT HELPERS
// ——————————————————————————————————————————————————————————
/**
 * Emette l'evento globale di cambio modello AI.
 */
export function emitSelectedModelChange(value: string): void {
    window.dispatchEvent(
        new CustomEvent<SelectedModelDetail>(AI_SELECTED_MODEL_CHANGE_EVENT, {
            detail: { value },
        })
    );
}

/**
 * Richiede al layout chat di pubblicare il modello correntemente selezionato.
 */
export function requestSelectedModel(): void {
    window.dispatchEvent(new CustomEvent(AI_REQUEST_SELECTED_MODEL_EVENT));
}

/**
 * Sottoscrive il listener del cambio modello AI.
 * Ritorna la cleanup function per lo useEffect.
 */
export function onSelectedModelChange(handler: (detail: SelectedModelDetail) => void): () => void {
    const listener = (event: Event) => {
        const customEvent = event as CustomEvent<SelectedModelDetail>;
        if (!customEvent?.detail?.value) return;
        handler(customEvent.detail);
    };

    window.addEventListener(AI_SELECTED_MODEL_CHANGE_EVENT, listener as EventListener);
    return () => {
        window.removeEventListener(AI_SELECTED_MODEL_CHANGE_EVENT, listener as EventListener);
    };
}

/**
 * Sottoscrive la richiesta del modello selezionato da parte di un consumer esterno.
 * Ritorna la cleanup function per lo useEffect.
 */
export function onRequestSelectedModel(handler: () => void): () => void {
    window.addEventListener(AI_REQUEST_SELECTED_MODEL_EVENT, handler as EventListener);
    return () => {
        window.removeEventListener(AI_REQUEST_SELECTED_MODEL_EVENT, handler as EventListener);
    };
}
