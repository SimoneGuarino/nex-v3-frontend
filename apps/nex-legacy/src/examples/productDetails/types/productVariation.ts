// examples/productDetails/types/productVariation.ts

export interface SupplierVariationPointDTO {
    timestamp: string;        // ISO
    price: number | null;
    listPrice: number | null;
    availability: number | null;
    /** true se availability è sospetta (es. 999) */
    isSuspiciousAvailability: boolean;
};

export interface SupplierVariationStatsDTO {
    lastPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;

    lastAvailability: number | null;
    minAvailability: number | null;
    maxAvailability: number | null;

    hasSuspiciousAvailability: boolean;
};

export interface SupplierVariationSeriesDTO {
    supplierName: string;
    priceListType?: string | null;
    points: SupplierVariationPointDTO[];
    stats: SupplierVariationStatsDTO;
};

export interface ProductVariationHistoryDTO {
    productId: string;
    from?: string;
    to?: string;
    suppliers: SupplierVariationSeriesDTO[];
};