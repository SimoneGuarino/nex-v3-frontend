import type { MepaAgentRunTrace, MepaDossierOperationalReport } from "../types";

/**
 * Detects dossier sections that are technically valid but not useful inside the
 * narrative Dossier AI view.
 *
 * The MEPA orchestrator can return aggregate payloads that contain requirements,
 * certifications, extracted products, criticalities or suggested actions. Those
 * objects are already rendered through dedicated tabs and validation workflows.
 * Showing them again inside the dossier would create duplicate information and,
 * in the worst case, expose raw JSON blocks to buyers. This helper centralizes
 * the exclusion policy so every dossier consumer applies the same rule.
 */
function isHiddenAggregateDossierSection(section: any): boolean {
    const key = String(section?.key ?? "").toLowerCase();
    const title = String(section?.title ?? "").toLowerCase();
    const label = `${key} ${title}`;

    /**
     * Keyword list intentionally covers Italian and English terms because model
     * outputs may mix languages depending on source documents and prompts. The
     * list is conservative: when a section looks like an aggregate domain area,
     * it is safer to hide it here and let the specialized tab render it with the
     * correct validation controls.
     */
    const aggregateKeywords = [
        "requisit",
        "certific",
        "vincol",
        "requirement",
        "certification",
        "constraint",
        "critic",
        "criticalit",
        "criticality",
        "azione",
        "azioni",
        "action",
        "suggested_action",
        "suggestedaction",
        "prodott",
        "product",
        "item",
        "extracted"
    ];

    if (aggregateKeywords.some((keyword) => label.includes(keyword))) {
        return true;
    }

    const content = section?.content;

    /**
     * Object-shaped content is frequently a raw model output. Looking at keys is
     * cheaper and safer than serializing the full object just to classify it.
     */
    if (content && typeof content === "object") {
        const keys = Object.keys(content).map((item) => item.toLowerCase());
        return keys.some((item) => aggregateKeywords.some((keyword) => item.includes(keyword)));
    }

    const contentText = typeof content === "string" ? content.trim().toLowerCase() : "";
    if (!contentText) return false;

    /**
     * Some historical AI runs stored aggregate blocks as JSON strings. This
     * compatibility guard prevents those strings from polluting the dossier UI
     * while preserving support for old tenders already present in MongoDB.
     */
    const looksLikeRawAggregateJson =
        contentText.startsWith("{") &&
        (contentText.includes('"certifications"') ||
            contentText.includes('"operationalrequirements"') ||
            contentText.includes('"administrativerequirements"') ||
            contentText.includes('"deliveryconstraints"') ||
            contentText.includes('"warrantyconstraints"') ||
            contentText.includes('"criticalities"') ||
            contentText.includes('"actions"') ||
            contentText.includes('"products"') ||
            contentText.includes('"items"'));

    return looksLikeRawAggregateJson;
}

/**
 * Returns only buyer-readable dossier sections.
 *
 * Aggregate sections generated for requirements/products/actions are
 * intentionally hidden from the narrative dossier because they already have
 * dedicated tabs and human-in-the-loop validation workflows. This keeps the
 * dossier focused on executive understanding rather than raw extraction data.
 */
export function pickDossierSections(dossier: any): any[] {
    if (!Array.isArray(dossier?.sections)) return [];
    return dossier.sections.filter((section: any) => !isHiddenAggregateDossierSection(section));
}

/**
 * Reads the generic dossier summary using backward-compatible fallbacks.
 *
 * Different AI pipeline versions persisted the summary in slightly different
 * shapes (`summary.description`, `summary.summary`, `outputs.overview.summary`).
 * The UI should not know those historical details, so the fallback chain is
 * centralized here and always returns a safe string.
 */
export function readSummary(dossier: any, agentRun: MepaAgentRunTrace | null) {
    return String(
        dossier?.summary?.description ??
        dossier?.summary?.summary ??
        (agentRun?.outputs as any)?.overview?.summary ??
        "Il dossier AI sarà disponibile al completamento dell'orchestratore agentico."
    );
}

/**
 * Normalizes summary-like values returned by the AI layer.
 *
 * The model can return a plain string, a list of bullets or an object containing
 * one of several semantic summary fields. This helper avoids duplicating that
 * defensive parsing logic across Overview and Dossier components.
 */
function normalizeSummaryText(value: any): string {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) return value.map(normalizeSummaryText).filter(Boolean).join("\n");
    if (!value || typeof value !== "object") return "";

    const direct =
        value.executiveSummary ??
        value.tenderSummary ??
        value.garaSummary ??
        value.businessSummary ??
        value.description ??
        value.summary ??
        value.text ??
        value.markdown;

    if (typeof direct === "string") return direct.trim();
    if (Array.isArray(value.bullets)) return value.bullets.map(normalizeSummaryText).filter(Boolean).join("\n");
    return "";
}

/**
 * Identifies summaries that describe the AI pipeline instead of the tender.
 *
 * Overview users need to understand the gara, not the internal multi-agent
 * process. Filtering technical summaries here keeps the UI business-facing even
 * when older agent outputs used implementation-oriented wording.
 */
function isTechnicalPipelineSummary(value?: string | null) {
    const text = String(value ?? "").toLowerCase();
    if (!text) return false;
    return (
        text.includes("pipeline multi-agent") ||
        text.includes("chunk documentali") ||
        text.includes("matching catalogo") ||
        text.includes("righe prodotto/servizio") ||
        text.includes("orchestratore agentico")
    );
}

/**
 * Selects the best business-facing tender summary from multiple AI outputs.
 *
 * The function intentionally prioritizes executive/tender/business summary
 * fields over generic technical outputs. It also scans narrative sections named
 * like "Sintesi gara" because some dossier versions persisted the most useful
 * summary as a section rather than a top-level field.
 */
export function readTenderBusinessSummary(dossier: any, agentRun: MepaAgentRunTrace | null, report?: MepaDossierOperationalReport | null): string {
    const technicalSummary = readSummary(dossier, agentRun);

    /**
     * Ordered list from most business-specific to broadest fallback. Adding new
     * keys here is safer than hard-coding fallback logic in UI components.
     */
    const candidates: any[] = [
        report?.executiveSummary,
        dossier?.executiveSummary,
        dossier?.overview?.executiveSummary,
        dossier?.overview?.tenderSummary,
        dossier?.overview?.summary,
        dossier?.overview?.description,
        dossier?.summary?.executiveSummary,
        dossier?.summary?.tenderSummary,
        dossier?.summary?.garaSummary,
        dossier?.summary?.businessSummary,
        (agentRun?.outputs as any)?.overview?.executiveSummary,
        (agentRun?.outputs as any)?.overview?.tenderSummary,
        (agentRun?.outputs as any)?.overview?.businessSummary,
    ];

    const sections = Array.isArray(dossier?.sections) ? dossier.sections : [];

    /**
     * Backward-compatible scan for older dossier payloads where the tender
     * summary was emitted as a labeled section. The title matching is broad by
     * design because titles are model-generated and not a strict API contract.
     */
    const summarySection = sections.find((section: any) => {
        const label = String(section?.title ?? section?.label ?? section?.name ?? section?.key ?? "").toLowerCase();
        return (
            label.includes("sintesi gara") ||
            label.includes("sintesi della gara") ||
            label.includes("sintesi operativa") ||
            label.includes("executive summary") ||
            label.includes("overview gara") ||
            label.includes("descrizione gara")
        );
    });
    if (summarySection) candidates.push(summarySection.content ?? summarySection.description ?? summarySection.summary);

    for (const candidate of candidates) {
        const text = normalizeSummaryText(candidate);
        if (!text) continue;
        if (text === technicalSummary) continue;
        if (isTechnicalPipelineSummary(text)) continue;
        return text;
    }

    return "";
}

/**
 * Reads criticalities from the normalized dossier first, then from the raw agent
 * run output for backward compatibility with older saved workspaces.
 */
export function readCriticalities(dossier: any, agentRun: MepaAgentRunTrace | null): any[] {
    if (Array.isArray(dossier?.criticalities)) return dossier.criticalities;
    const fromOutputs = (agentRun?.outputs as any)?.criticalities?.criticalities;
    return Array.isArray(fromOutputs) ? fromOutputs : [];
}

/**
 * Reads suggested actions from the normalized dossier first, then from the raw
 * agent run output. Some agent versions returned actions directly as an array,
 * while others nested them under `actions.actions`; both formats are supported.
 */
export function readActions(dossier: any, agentRun: MepaAgentRunTrace | null): any[] {
    if (Array.isArray(dossier?.actions)) return dossier.actions;
    const fromOutputs = (agentRun?.outputs as any)?.actions;
    if (Array.isArray(fromOutputs)) return fromOutputs;
    const nested = (agentRun?.outputs as any)?.actions?.actions;
    return Array.isArray(nested) ? nested : [];
}
