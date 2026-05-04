export type QuoteEnv = "FOCELDA" | "IOT";

export type ApiMetadata = {
    generatedAt?: string;
    partial?: boolean;
};

export type CustomerWithQuotes = {
    AMBIENTE: QuoteEnv;
    WCDCL: string;
    WRAGS: string;
    WPIVA: string;
    WCDFI: string;
};

export type AgentWithQuotes = {
    AMBIENTE: QuoteEnv;
    TCDAG: string;
    DSCAG?: string;
};

export type QuoteHeader = {
    AMBIENTE: QuoteEnv;
    TCDCL: string;
    TCDMA: string;
    TANNO: string | number;
    TNRPR: string | number;
    TCDAG?: string | number;
    DSCAG?: string;
    TDTPR?: string | number;
    TSTAT?: string;
    WDSMA?: string;
    WRAGS?: string;
};

export type QuoteDetailRow = {
    RCDMA: string;
    WDSMA?: string;
    RCDAR: string;
    RANNO: number | string;
    RNRPR: number | string;
    RNRIG: number | string;
    RDES?: string;
    RQTRI?: string | number;
    RPZRI?: string | number;
};

export type QuoteDetailsResponse = {
    items: QuoteDetailRow[];
    totals: {
        qtyTotal: number;
        amountTotal: number;
    };
    metadata?: ApiMetadata;
};

export type PaginatedResponse<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    metadata?: ApiMetadata;
};
