import { MutableRefObject } from 'react';
import { getAuthToken } from 'utils/auth/authToken';


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
// Interfaccia per il singolo prompt
// Nuova struttura: agent_nome, prompt_nome, order_prompt, prompt_testo
export type Prompt = {
    agent_nome: string;
    prompt_nome: string;
    order_prompt: number;
    prompt_testo: string;
};

// Risposta API standard per operazioni CRUD sui prompt
type StandardPromptResponse = {
    success: boolean;
    message: string;
    error?: string;
};

// Risposta API per la lista dei prompt
type GetPromptsResponse = Exclude<StandardPromptResponse, 'message'> & {
    data: Prompt[];
};

// Risposta API per creazione/aggiornamento prompt
type UpsertPromptResponse = StandardPromptResponse & {
    data: Prompt;
};

type UpsertPromptParams = Prompt & {
    // Per update: indica i valori originali della chiave primaria
    original_agent_nome?: string;
    original_order_prompt?: number;
};


// ——————————————————————————————————————————————————————————
// API CALLS
// ——————————————————————————————————————————————————————————
/** Helper per fare fetch con ruolo utente */
async function fetchWithRole<T>(
    url: string,
    method: string,
    body: unknown,
    abortController: MutableRefObject<AbortController | null>,
    userRole?: string | number
): Promise<T> {
    if (!abortController.current) {
        abortController.current = new AbortController();
    }

    const headers: Record<string, string> = {
        "Accept-Encoding": "gzip, br",
    };

    // Aggiungi Content-Type solo se c'è un body (evita errori per DELETE/GET con header json vuoto)
    if (body != null) {
        headers["Content-Type"] = "application/json";
    }
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    // Aggiungi il ruolo come header se disponibile
    if (userRole !== undefined) {
        headers['X-User-Role'] = String(userRole);
    }

    const res = await fetch(url, {
        method,
        headers,
        signal: abortController.current.signal,
        body: body != null ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message: unknown = null;
        try {
            message = await res.json();
        } catch {
            try { message = await res.text(); } catch { /* ignore */ }
        }
        throw { status: res.status, message };
    }

    return (await res.json()) as T;
};

/** GET - Recupera la lista dei prompt per un agente specifico */
export async function getPrompts(
    abortController: MutableRefObject<AbortController | null>,
    agentNome: string,
    userRole?: string | number
): Promise<GetPromptsResponse> {
    return await fetchWithRole<GetPromptsResponse>(
        `${import.meta.env.VITE_API_AI}v1/settings/prompts/${encodeURIComponent(agentNome)}`,
        'GET',
        null,
        abortController,
        userRole
    );
};

/** PUT - Crea o aggiorna un prompt (upsert) */
export async function upsertPrompt(
    abortController: MutableRefObject<AbortController | null>,
    params: UpsertPromptParams,
    userRole?: string | number
): Promise<UpsertPromptResponse> {
    return await fetchWithRole<UpsertPromptResponse>(
        `${import.meta.env.VITE_API_AI}v1/settings/prompts`,
        'PUT',
        params,
        abortController,
        userRole
    );
};

/** DELETE - Elimina un prompt esistente */
export async function deletePrompt(
    abortController: MutableRefObject<AbortController | null>,
    agentNome: string,
    orderPrompt: number,
    userRole?: string | number
): Promise<StandardPromptResponse> {
    return await fetchWithRole<StandardPromptResponse>(
        `${import.meta.env.VITE_API_AI}v1/settings/prompts/${encodeURIComponent(agentNome)}/${orderPrompt}`,
        'DELETE',
        null,
        abortController,
        userRole
    );
};