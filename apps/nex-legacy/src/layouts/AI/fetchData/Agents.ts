/**
 * Agents API - Chiamate per recuperare agenti e modelli IA dal backend
 */
import { MutableRefObject } from 'react';
import { getAuthToken } from 'utils/auth/authToken';

// ============================================
// INTERFACCE
// ============================================

/**
 * Configurazione dei tool disponibili per l'agente
 */
export interface AgentTools {
    getTables: boolean;
    sqlQuery: boolean;
    custom: string[];
}

/**
 * Impostazioni del modello AI per l'agente
 */
export interface AgentModelSettings {
    topP?: number;
    maxTokens?: number;
    temperature?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

/**
 * Tipo per il controllo di modifica dell'agente
 */
export type CanEditType = "NONE" | "DEVS" | "ALL";

/**
 * Interfaccia per un singolo agente IA
 */
export interface IAgent {
    _id: string;
    key: string;                        // Identificativo univoco (es. "Data_Assistant")
    displayName: string;                // Nome visualizzato nell'UI
    description?: string;               // Descrizione dell'agente
    isActive: boolean;                  // Se l'agente è attivo
    modelName: string;                  // Nome del modello AI da usare
    instructionsPromptName: string;     // Nome del prompt istruzioni
    dbSchemaPromptName: string;         // Nome del prompt schema DB
    tools: AgentTools;                  // Configurazione dei tool
    modelSettings: AgentModelSettings;  // Impostazioni del modello
    output: { type: "json" | "text" | "stream" };
    allowedRoles: number[];             // Ruoli autorizzati
    canEdit: CanEditType;               // Chi può modificare
    order: number;                      // Ordine di visualizzazione
    version: string;                    // Versione dell'agente
}

/**
 * Interfaccia per un singolo modello IA
 */
export interface IModel {
    _id: string;
    name: string;
    provider: string;
    description?: string;
    isActive: boolean;
    defaultSettings: {
        temperature?: number;
        topP?: number;
        maxTokens?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
    };
    limits: {
        maxContextTokens?: number;
        maxOutputTokens?: number;
    };
    costs: {
        inputPer1kTokens?: number;
        outputPer1kTokens?: number;
        currency?: string;
    };
    order: number;
}

// Risposte API
interface GetAgentsResponse {
    success: boolean;
    data: IAgent[];
    error?: string;
}

interface GetModelsResponse {
    success: boolean;
    data: IModel[];
    error?: string;
}

interface GetSingleAgentResponse {
    success: boolean;
    data?: IAgent;
    error?: string;
}

// ============================================
// HELPER
// ============================================

async function fetchAPI<T>(
    url: string,
    method: string,
    body: unknown,
    abortController: MutableRefObject<AbortController | null>
): Promise<T> {
    if (!abortController.current) {
        abortController.current = new AbortController();
    }

    const headers: Record<string, string> = {
        "Accept-Encoding": "gzip, br",
    };

    if (body != null) {
        headers["Content-Type"] = "application/json";
    }

    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

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
}

// ============================================
// GET - Recupera tutti gli agenti attivi
// ============================================
export async function getAgents(
    abortController: MutableRefObject<AbortController | null>
): Promise<GetAgentsResponse> {
    return await fetchAPI<GetAgentsResponse>(
        `${import.meta.env.VITE_API_AI}v1/agents`,
        'GET',
        null,
        abortController
    );
}

// ============================================
// GET - Recupera un singolo agente per key
// ============================================
export async function getAgentByKey(
    abortController: MutableRefObject<AbortController | null>,
    key: string
): Promise<GetSingleAgentResponse> {
    return await fetchAPI<GetSingleAgentResponse>(
        `${import.meta.env.VITE_API_AI}v1/agents/${encodeURIComponent(key)}`,
        'GET',
        null,
        abortController
    );
}

// ============================================
// GET - Recupera tutti i modelli attivi
// ============================================
export async function getModels(
    abortController: MutableRefObject<AbortController | null>
): Promise<GetModelsResponse> {
    return await fetchAPI<GetModelsResponse>(
        `${import.meta.env.VITE_API_AI}v1/models`,
        'GET',
        null,
        abortController
    );
}

// ============================================
// UTILITY - Formatta agente per select menu
// Formato: "key-version" (es. "Data_Assistant-1.5")
// ============================================
export function formatAgentForSelect(agent: IAgent): string {
    return `${agent.key}-${agent.version}`;
}

// ============================================
// UTILITY - Parse agent select value
// Input: "Data_Assistant-1.5" -> { key: "Data_Assistant", version: "1.5" }
// ============================================
export function parseAgentSelectValue(value: string): { key: string; version: string } {
    const lastDashIndex = value.lastIndexOf('-');
    if (lastDashIndex === -1) {
        return { key: value, version: '1' };
    }
    return {
        key: value.substring(0, lastDashIndex),
        version: value.substring(lastDashIndex + 1),
    };
}
