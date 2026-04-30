import { ChangeLoadStatusArgs, LoadStatus } from "./load";

export type CustomerOption = {
    id?: string;
    codiceCliente: string;
    ragioneSociale: string;
    partitaIVA?: string | null;
    codiceFiscale?: string | null;
    fido?: {
        fidoTotale: number;
        saldoCliente: number;
        aScadere: number;
        scaduto: number;
        fuoriFido: number;
        insoluti: number;
        valoreFB: number;
        valoreOC: number;
        totaleMovimenti: number;
    } | null;
};

export type ViewId =
    | "anagrafica"
    | "fido"
    | "backorders"
    | "reportCambioAgente"
    | "reportDiffEconomica"
    | "reportAltriProblemi"
    | "reportNoteClienti";

export type CommonFilters = {
    companySelected: number;        // 0 Focelda, 1 IOT
    agentCode?: string | null;      // filtro admin
    piva?: string;
    ragSoc?: string;
    statoCliente?: string[];
    statoCommerciale?: string[];
    microSettore?: string[];
    macroSettore?: string[];
    canaleVendita?: string[];
    areaGeografica?: string[];
    categoriaSconto?: string[];
    province?: string[];
    brand?: string[];
    partnership?: string[];
    linee?: string[];
    gruppi?: string[];
    microSettoreAgg?: string[];
    clientelaRif?: string[];
    clientFilterCodes?: CustomerOption[];   // multipla clienti
    customerSelected?: { codice: string; denominazione?: string } | null;
};

export type SearchParams<VExtra = unknown> = {
    view: ViewId;
    common: CommonFilters;
    extra?: VExtra; // payload specifico della view (es. Fido types)
};

export interface ViewComponentProps<VExtra = unknown> {
    userContext: any;
    params: SearchParams<VExtra>;

    // facoltativi
    onSetResultsTotal?: (n: number) => void;
    onSetFidoTotals?: (x: { sfrs: number; sftot: number }) => void;

    // 👇 nuovo: salto a un’altra view per un cliente specifico
    onNavigateToCustomerView: (
        targetView: ViewId,
        customer: { codice: string; denominazione?: string }
    ) => void;
    loadStatus: LoadStatus; ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
}

export interface ViewDefinition<VExtra = unknown> {
    id: ViewId;
    label: string;
    Component: React.FC<ViewComponentProps<VExtra>>;
    FiltersExtra?: React.FC<{
        value: VExtra | undefined;
        onChange: (next: VExtra | undefined) => void;
    }>;
    isEnabled?: (ctx: any) => boolean;
}