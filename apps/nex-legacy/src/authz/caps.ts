export const CAPS = {
    /**
     * Platform / global runtime
     */
    GLOBAL_DATA_READ: "legacy.global_data.read",
    GLOBAL_DATA_AGENTS_READ: "legacy.global_data.agents.read",
    GLOBAL_DATA_BUYERS_READ: "legacy.global_data.buyers.read",
    USERS_ONLINE_VIEW: "legacy.users.online.view",

    /**
     * AI / assistant
     */
    BUYER_ASSISTANT_USE: "legacy.buyer_assistant.use",

    /**
     * Clienti / situazione fidi
     */
    CLIENTI_SITUAZIONE_FIDI_MANAGE: "legacy.clienti.situazione_fidi.manage",

    /**
     * Fatturati
     */
    FATTURATI_IMPERSONATE: "legacy.fatturati.impersonate",
    FATTURATI_ADVANCED_VIEW: "legacy.fatturati.advanced_view",

    /**
     * Query AS400
     */
    QUERY_AS400_MANAGE: "legacy.query_as400.manage",

    /**
     * Sellout
     */
    SELLOUT_MANAGE: "legacy.sellout.manage",

    /**
     * SWOT
     */
    SWOT_MANAGE: "legacy.swot.manage",

    /**
     * Obiettivi / stocks
     */
    OBIETTIVI_COMMERCIALI_MANAGE: "legacy.obiettivi_commerciali.manage",
    OBIETTIVI_STOCKS_MANAGE: "legacy.obiettivi_stocks.manage",

    /**
     * Pagamenti
     */
    PAGAMENTI_ADMIN_FILTERS_VIEW: "legacy.pagamenti.admin_filters.view",

    /**
     * Quotazioni
     */
    QUOTAZIONI_VIEW: "ui.panel.quotazioni.view",
    QUOTAZIONI_AGENT_MODE: "legacy.quotazioni.agent_mode",
    QUOTAZIONI_DETAILS_MANAGE: "legacy.quotazioni.details.manage",
    QUOTAZIONI_PRICES_VIEW: "legacy.quotazioni.prices.view",
    QUOTAZIONI_LOOK_MODERATE: "legacy.quotazioni.look.moderate",

    /**
     * Ordini
     */
    ORDINI_SBLOCCO_MANAGE: "legacy.ordini.sblocco.manage",
    ORDINI_FB_MANAGE: "legacy.ordini.fb.manage",
    ORDINI_FB_CNR_MANAGE: "legacy.ordini.fb_cnr.manage",

    /**
     * Marketing
     */
    MARKETING_MAILUP_GROUPS_MANAGE: "legacy.marketing.mailup.groups.manage",

    /**
     * Drive
     */
    DRIVE_BRANDS_MANAGE: "legacy.drive.brands.manage",

    /**
     * Contribuzione
     */
    CONTRIBUZIONE_MANAGE: "legacy.contribuzione.manage",
    CONTRIBUZIONE_BUYER_IMPERSONATE: "legacy.contribuzione.buyer_impersonate",

    /**
     * Comparatore
     */
    COMPARATORE_ADMIN_FILTERS_VIEW: "legacy.comparatore.admin_filters.view",
    COMPARATORE_BUYER_IMPERSONATE: "legacy.comparatore.buyer_impersonate",
} as const;

export type Cap = typeof CAPS[keyof typeof CAPS];