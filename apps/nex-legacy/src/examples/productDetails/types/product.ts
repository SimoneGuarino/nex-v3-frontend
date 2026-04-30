// types/product.ts
// Tipi condivisi per i dettagli prodotto (API raw + DTO normalizzato per la UI)

/* -------------------------------------------------------------------------- */
/*  RAW TYPES (API getProdcuctDetails / Risposta_fetchProductDetails.json)    */
/* -------------------------------------------------------------------------- */

/**
 * Disponibilità a magazzino per singolo warehouse
 * Esempio da priceStock.Disponibilita.Magazzini :contentReference[oaicite:3]{index=3}
 */
export interface ProductWarehouseAvailability {
    Codice: string;
    Nome: string;
    Quantita: number;
}

/**
 * Disponibilità complessiva (totale + per magazzino)
 */
export interface ProductAvailability {
    Totali: number;
    Magazzini: ProductWarehouseAvailability[];
}

/**
 * Prezzi e disponibilità per singolo fornitore
 * Esempio da priceStock.Fornitori.Esprintet/Also/... :contentReference[oaicite:4]{index=4}
 */
export interface ProductSupplierPrice {
    Prezzo: number;
    PrezzoListino: number;
    Disponibili: number;
    InArrivo: number;
    Aggiornato: string; // ISO string
    Promo: boolean | null;
    InizioPromo: string | null;
    FinePromo: string | null;
    Raee: number;
    Siae: number;
    Sisvel: number;
    Vat: number;
    Iva: number;
    TipoListino?: string;
    __lastSeenBatch?: string;
}

/**
 * Snapshot Keepa (Amazon / Ebay)
 */
export interface ProductKeepaSnapshot {
    Aggiornato: string; // ISO string
    Amazon: number;
    Ebay: number;
}

/**
 * Documento priceStock così come arriva da MongoDB / API
 * (collezione products_prices_stocks) :contentReference[oaicite:5]{index=5}
 */
export interface ProductPriceStockRaw {
    _id: string;
    IdProdotto: string;
    Aggiornato: string;

    CodicePromo?: string | null;
    CostoMedioGestionale?: number | null;
    CostoMedioPonderato?: number | null;

    Disponibilita?: ProductAvailability;
    FinePromo?: string | null;
    InizioPromo?: string | null;

    Fornitori?: Record<string, ProductSupplierPrice>;

    Iva?: number | null;
    Vat?: number | null;

    Keepa?: ProductKeepaSnapshot;

    Prezzo?: number | null;
    PrezzoListino?: number | null;
    Promo?: boolean | null;

    Raee?: number | null;
    Siae?: number | null;
    Sisvel?: number | null;

    classificazionePromo?: string | null;
    contribuzioni?: unknown[];

    __v?: number;
}

/* --------------------------- RAW ICECAT EXTRA ------------------------------ */

/**
 * Stringa localizzata generica Icecat
 */
export interface IcecatLocalizedString {
    Value: string;
    Language?: string;
}

/**
 * Info brand/categoria ecc. da extra.GeneralInfo :contentReference[oaicite:6]{index=6}
 */
export interface IcecatGeneralInfo {
    Brand?: string;
    BrandLogo?: string;
    BrandInfo?: {
        BrandName?: string;
        BrandLocalName?: string;
        BrandLogo?: string;
    };
    EndOfLifeDate?: string;
    Title?: string;
    BrandPartCode?: string;
    ProductName?: string;
    Category?: {
        ID?: string | number;
        Name?: IcecatLocalizedString;
    };
    GTIN?: string | null;
}

/**
 * SummaryDescription (short/long) :contentReference[oaicite:7]{index=7}
 */
export interface IcecatSummaryDescription {
    ShortSummaryDescription?: string;
    LongSummaryDescription?: string;
}

/**
 * Bullet points marketing (sia “BulletPoints” che “GeneratedBulletPoints”) 
 */
export interface IcecatBulletPoints {
    Language?: string;
    Values?: string[];
    BulletPointsId?: string;
}

/**
 * Immagini principali da extra.Image :contentReference[oaicite:9]{index=9}
 */
export interface IcecatImageSet {
    HighPic?: string;
    HighPicSize?: string;
    HighPicHeight?: string;
    HighPicWidth?: string;

    Pic?: string;
    LowPic?: string;
    LowPicSize?: string;
    LowPicHeight?: string;
    LowPicWidth?: string;

    Pic500x500?: string;
    Pic500x500Size?: string;
    Pic500x500Height?: string;
    Pic500x500Width?: string;

    ThumbPic?: string;
    ThumbPicSize?: string;
}

/**
 * Asset multimediale generico (PDF, video, ecc.) extra.Multimedia :contentReference[oaicite:10]{index=10}
 */
export interface IcecatMultimediaItem {
    ID: string;
    URL: string;
    Type: string;
    ContentType?: string;
    KeepAsUrl?: string;
    Description?: string;
    Size?: string;
    IsPrivate?: string;
    Updated?: string;
    Language?: string;
    IsVideo?: number | boolean;
}

/**
 * Misura Icecat per i Feature (mm, g, %, ecc.) 
 */
export interface IcecatMeasureSigns {
    ID?: string;
    _: string;
    Language?: string;
}

export interface IcecatMeasure {
    ID: string;
    Sign: string;
    Signs?: IcecatMeasureSigns;
}

export interface IcecatFeatureName {
    Value: string;
    Language?: string;
}

export interface IcecatFeatureMeta {
    ID: string;
    Sign: string;
    Measure?: IcecatMeasure;
    Name: IcecatFeatureName;
}

/**
 * Singolo feature in FeaturesGroups[].Features[] 
 */
export interface IcecatFeatureValue {
    Localized: number;
    ID: number;
    LocalID: number;
    Type: string;
    Value: string;
    CategoryFeatureId: string;
    CategoryFeatureGroupID: string;
    SortNo: string;
    PresentationValue: string;
    RawValue: string;
    LocalValue: string;
    Description: string;
    Mandatory: string; // "0" | "1"
    Searchable: string; // "0" | "1"
    Optional: string; // "0" | "1"
    Feature: IcecatFeatureMeta;
}

/**
 * Gruppo di feature (es. “Dimensioni e peso”, “Dati logistici”, ecc.) 
 */
export interface IcecatFeatureGroup {
    ID: number;
    SortNo: string;
    FeatureGroup: {
        ID: string;
        Name: IcecatLocalizedString;
    };
    Features: IcecatFeatureValue[];
}

export interface IcecatRelatedProduct {
    ID?: string | number;
    IcecatID?: string | number;
    ProductCode: string;
    ProductName: string;
    Brand?: string;
    ThumbPic?: string;
}

/**
 * Extra Icecat completo (solo le parti che ci interessano tipizzare bene)
 */
export interface IcecatProductExtra {
    GeneralInfo?: IcecatGeneralInfo;
    SummaryDescription?: IcecatSummaryDescription;

    BulletPoints?: IcecatBulletPoints;
    GeneratedBulletPoints?: IcecatBulletPoints;

    Image?: IcecatImageSet;
    Multimedia?: IcecatMultimediaItem[];
    Gallery?: IcecatImageSet[];

    FeaturesGroups?: IcecatFeatureGroup[];

    ProductRelated?: IcecatRelatedProduct[];
    // Tutto il resto (ProductStory, Reviews, Variants, ecc.) lo lasciamo estendibile
    [key: string]: unknown;
}

/**
 * Entry singola dell’array `items` restituito da getProdcuctDetails.ts 
 */
export interface ProductDetailsHit {
    _id: string;
    ci: string;
    codiceProduttore: string;
    codiciGTIN?: string[];
    da?: string | null;
    marca?: string | null;
    descrizioneLinea?: string | null;
    descrizioneGruppo?: string | null;
    codice_buyer?: string | null;
    descrizione?: string | null;
    anteprima?: string | null;

    priceStock?: ProductPriceStockRaw | null;
    extra?: IcecatProductExtra | null;
}

/**
 * Risposta completa dell’endpoint /getProdcuctDetails (wrapper API)
 */
export interface ProductDetailsApiResponse {
    items: ProductDetailsHit[];
}

/* -------------------------------------------------------------------------- */
/*                          DTO PER LA UI (NORMALIZZATO)                      */
/* -------------------------------------------------------------------------- */

/**
 * Regole di visibilità prezzo lato UI
 */
export interface ProductPriceVisibility {
    canViewNetPrice: boolean;
    canViewListPrice: boolean;
    canViewStock: boolean;
}

/**
 * Tier di prezzo aggregati per ruolo (buyer/admin/dev ecc.)
 */
export interface ProductPriceTier {
    label: string;
    netPrice?: number | null; // prezzo di acquisto effettivo
    listPrice?: number | null; // prezzo di listino
    promo?: {
        isPromo: boolean;
        start?: string | null;
        end?: string | null;
        promoCode?: string | null;
    };
    supplierName?: string; // Esprinet, Focelda, ecc.
}

/**
 * Offerta di un singolo fornitore per questo prodotto
 */
export interface ProductSupplierOfferDTO {
    /** Nome/etichetta fornitore (es. "Esprinet") */
    name: string;

    /** Prezzo netto del fornitore (acquisto) */
    netPrice?: number | null;

    /** Prezzo di listino del fornitore */
    listPrice?: number | null;

    /** Info di disponibilità specifiche del fornitore */
    availability?: {
        total?: number | null;
        incoming?: number | null;
        lastUpdate?: string | null;
    };

    /** Info promo lato fornitore */
    promo?: {
        isPromo: boolean;
        start?: string | null;
        end?: string | null;
    };

    /** Iva applicata dal fornitore (se valorizzata) */
    vat?: number | null;

    /** Componenti extra del prezzo (RAEE, SIAE, ecc.) */
    priceComponents?: {
        raee?: number | null;
        siae?: number | null;
        sisvel?: number | null;
    };
};

/**
 * Sintesi prezzi per la “card” laterale (SideInfoSection)
 */
export interface ProductPricingSummaryDTO {
    listPrice?: number;
    netPrice?: number;
    minNetPrice?: number;
    maxNetPrice?: number;
    currency?: string;
    supplierCount?: number;
    totalAvailable?: number;
}

/**
 * Informazioni di stock aggregate per la UI
 */
export interface ProductStockWarehouseInfo {
    code: string;
    name: string;
    quantity: number;
}

export interface ProductStockInfo {
    totalAvailable: number;
    warehouses: ProductStockWarehouseInfo[];
}

/**
 * Set di immagini già normalizzato per la UI
 */
export interface ProductImageSetDTO {
    /**
     * Immagine principale grande (dettaglio prodotto)
     */
    main: string | null;
    /**
     * Thumbnail utilizzata nelle liste / card
     */
    thumbnail: string | null;
    /**
     * Galleria immagini extra (Icecat / interni)
     */
    gallery: string[];
}

/**
 * Informazioni marketing (descrizioni, bullet points, datasheet…)
 */
export interface ProductMarketingInfo {
    /**
     * Titolo “marketing” del prodotto (es. da Icecat GeneralInfo.ProductName)
     */
    title?: string | null;

    /**
     * Descrizione breve (SummaryDescription.ShortSummaryDescription) :contentReference[oaicite:15]{index=15}
     */
    shortDescription?: string | null;

    /**
     * Descrizione estesa (SummaryDescription.LongSummaryDescription)
     */
    longDescription?: string | null;

    /**
     * Bullet points principali (BulletPoints.Values)
     */
    bulletPoints?: string[];

    /**
     * Bullet points “tecnici” o generati (GeneratedBulletPoints.Values)
     */
    generatedBulletPoints?: string[];

    /**
     * URL al PDF datasheet principale (primo Multimedia ContentType=application/pdf)
     */
    pdfDatasheetUrl?: string | null;
}

/**
 * Attributo tecnico raggruppato per categoria (es. Dimensioni e peso, Dati logistici, ecc.)
 */
export interface ProductAttribute {
    /**
     * Nome del gruppo (es. “Dimensioni e peso”) :contentReference[oaicite:16]{index=16}
     */
    group: string;

    /**
     * Nome dell’attributo (es. “Larghezza”)
     */
    name: string;

    /**
     * Valore presentato (PresentationValue, es. “112 mm”)
     */
    value: string;

    /**
     * True se vogliamo mostrarlo in evidenza (scelto dal mapping)
     */
    highlight?: boolean;
}

/**
 * Prodotto correlato in forma compatta (per RelatedProductsSection)
 */
export interface RelatedProductSummary {
    id: string;
    codiceProduttore: string;
    description: string;
    brand?: string | null;
    thumbnail?: string | null;
}

/**
 * DTO principale usato dal front-end (ProductDetailsPanel & sezioni)
 *
 * Questo è il “view model” normalizzato, indipendente dalla struttura
 * raw di MongoDB/Icecat.
 */
export interface ProductDetailsDTO {
    // Identificativi e metadati base
    id: string;
    codice?: string | null;
    codiceProduttore?: string | null;
    ean?: string | null;

    brand?: string | null;
    brandLogoUrl?: string | null;

    lineDescription?: string | null;
    groupDescription?: string | null;

    codiceBuyer?: string | null;

    /**
     * Path di categoria (es. ["Stampanti", "Cartucce", ...])
     */
    categoryPath?: string[];

    /**
     * Stato prodotto (end of life, attivo, ecc. – se disponibile)
     */
    status?: string | null;

    // Testi principali
    name: string;
    shortDescription?: string | null;
    longDescription?: string | null;

    // Immagini
    images: ProductImageSetDTO;

    // Prezzi & stock (già filtrati per ruolo utente)
    visibility: ProductPriceVisibility;
    priceTiers: ProductPriceTier[];
    stock?: ProductStockInfo;

    /** Sintesi prezzi aggregata per la sidebar */
    pricingSummary?: ProductPricingSummaryDTO;

    /** Offerte dei singoli fornitori */
    suppliers?: ProductSupplierOfferDTO[];

    // Marketing & scheda tecnica
    marketing?: ProductMarketingInfo;
    attributes: ProductAttribute[];

    // Prodotti correlati (se disponibili)
    relatedProducts?: RelatedProductSummary[];

    // Eventuali flag/metadata extra per la UI
    isFavorite?: boolean;
    isInCart?: boolean;
    isInPromotion?: boolean;
}

// product.ts

/**
 * Mapping da ProductDetailsHit (risposta raw della API)
 * a ProductDetailsDTO (view-model usato dai pannelli di dettaglio).
 */
export function mapProductDetailsHitToDTO(hit: ProductDetailsHit): ProductDetailsDTO {
    const { priceStock, extra } = hit;
    const { anteprima, descrizione } = hit;

    const general = extra?.GeneralInfo;
    const summary = extra?.SummaryDescription;
    const bulletPoints = extra?.BulletPoints;
    const generatedBulletPoints = extra?.GeneratedBulletPoints;
    const image = extra?.Image;
    const multimedia = extra?.Multimedia ?? [];
    const featureGroups = extra?.FeaturesGroups ?? [];

    /** -------------------- IMMAGINI -------------------- */

    const galleryFromIcecat =
        extra?.Gallery?.map(g => g.Pic500x500 || g.Pic || g.LowPic)
            .filter((url): url is string => !!url) ?? [];

    const mainImage =
        image?.Pic500x500 ||
        image?.HighPic ||
        image?.LowPic ||
        anteprima ||
        galleryFromIcecat[0] ||
        null;

    const thumbnail =
        image?.ThumbPic ||
        image?.LowPic ||
        anteprima ||
        galleryFromIcecat[0] ||
        null;

    const gallery =
        galleryFromIcecat.length > 0
            ? galleryFromIcecat
            : (anteprima ? [anteprima] : []);

    /** -------------------- MARKETING -------------------- */

    const pdfDatasheet =
        multimedia.find(m => m.ContentType === "application/pdf")?.URL ?? null;

    const shortDescription =
        typeof summary?.ShortSummaryDescription === "string"
            ? summary.ShortSummaryDescription
            : null;

    const longDescription =
        typeof summary?.LongSummaryDescription === "string"
            ? summary.LongSummaryDescription
            : null;

    const marketing: ProductMarketingInfo | undefined =
        shortDescription || longDescription || bulletPoints || generatedBulletPoints || pdfDatasheet
            ? {
                title:
                    general?.Title ??
                    general?.ProductName ??
                    descrizione ??
                    null,
                shortDescription,
                longDescription,
                bulletPoints: bulletPoints?.Values,
                generatedBulletPoints: generatedBulletPoints?.Values,
                pdfDatasheetUrl: pdfDatasheet
            }
            : undefined;

    /** -------------------- ATTRIBUTI TECNICI -------------------- */

    const attributes: ProductAttribute[] = [];

    for (const group of featureGroups) {
        const groupName =
            group.FeatureGroup?.Name?.Value ??
            group.FeatureGroup?.Name ??
            "Informazioni tecniche";

        for (const feature of group.Features ?? []) {
            attributes.push({
                group: groupName,
                name: feature.Feature?.Name?.Value ?? "",
                value: feature.PresentationValue || feature.Value || "",
                highlight: feature.Mandatory === "1"
            });
        }
    }

    /** -------------------- PREZZI & STOCK -------------------- */

    const visibility: ProductPriceVisibility = {
        canViewNetPrice: !!priceStock?.Prezzo,
        canViewListPrice: !!priceStock?.PrezzoListino,
        canViewStock: !!priceStock?.Disponibilita
    };

    const priceTiers: ProductPriceTier[] = [];

    if (priceStock?.Prezzo != null || priceStock?.PrezzoListino != null) {
        priceTiers.push({
            label: "Standard",
            netPrice: priceStock?.Prezzo ?? undefined,
            listPrice: priceStock?.PrezzoListino ?? undefined,
            promo: {
                isPromo: !!priceStock?.Promo,
                start: priceStock?.InizioPromo ?? null,
                end: priceStock?.FinePromo ?? null,
                promoCode: priceStock?.classificazionePromo ?? null
            },
            // Tier aggregato, non legato a un fornitore specifico
            supplierName: undefined
        });
    }

    /**
     * Mapping dei singoli fornitori (priceStock.Fornitori)
     */
    const suppliers: ProductSupplierOfferDTO[] =
        priceStock?.Fornitori
            ? Object.entries(priceStock.Fornitori).map(([name, supplier]) => ({
                name,
                netPrice: supplier.Prezzo ?? null,
                listPrice: supplier.PrezzoListino ?? null,
                availability: {
                    total: supplier.Disponibili ?? null,
                    incoming: supplier.InArrivo ?? null,
                    lastUpdate: supplier.Aggiornato ?? null
                },
                promo: {
                    isPromo: !!supplier.Promo,
                    start: supplier.InizioPromo ?? null,
                    end: supplier.FinePromo ?? null
                },
                vat: supplier.Iva ?? supplier.Vat ?? null,
                priceComponents: {
                    raee: supplier.Raee ?? null,
                    siae: supplier.Siae ?? null,
                    sisvel: supplier.Sisvel ?? null
                }
            }))
            : [];

    const stock: ProductStockInfo | undefined = priceStock?.Disponibilita
        ? {
            totalAvailable: priceStock.Disponibilita.Totali ?? 0,
            warehouses: (priceStock.Disponibilita.Magazzini ?? []).map(m => ({
                code: m.Codice,
                name: m.Nome ?? m.Codice,
                quantity: m.Quantita ?? 0
            }))
        }
        : undefined;

    /**
     * Sintesi prezzi per la sidebar
     * - usa il prezzo “Standard” se presente
     * - arricchisce con min/max net price dei fornitori
    */
    const supplierNetPrices = suppliers
        .map(s => s.netPrice && s.netPrice > 0 ? s.netPrice : null)
        .filter((v): v is number => typeof v === "number");

    const minNetPrice =
        supplierNetPrices.length > 0 ? Math.min(...supplierNetPrices) : undefined;
    const maxNetPrice =
        supplierNetPrices.length > 0 ? Math.max(...supplierNetPrices) : undefined;

    const pricingSummary: ProductPricingSummaryDTO | undefined =
        priceStock || suppliers.length
            ? {
                listPrice: priceStock?.PrezzoListino ?? undefined,
                netPrice: priceStock?.Prezzo ?? minNetPrice,
                minNetPrice,
                maxNetPrice,
                currency: "€", // eventualmente leggibile da priceStock (Valuta)
                supplierCount: suppliers.length || undefined,
                totalAvailable: stock?.totalAvailable
            }
            : undefined;


    /** -------------------- INFO BASE PRODOTTO -------------------- */
    const ean =
        hit.codiciGTIN?.[0] ??
        (Array.isArray(general?.GTIN) ? general?.GTIN[0] : general?.GTIN) ??
        null;

    const brandName =
        typeof general?.Brand === "string"
            ? general.Brand
            : general?.BrandInfo?.BrandName ??
            general?.BrandInfo?.BrandLocalName ??
            hit.marca ??
            null;

    const brandLogo =
        general?.BrandInfo?.BrandLogo ??
        general?.BrandLogo ??
        null;

    const name =
        general?.ProductName ??
        general?.Title ??
        descrizione ??
        hit.descrizione ??
        hit.codiceProduttore;

    const categoryPath: string[] | undefined = general?.Category?.Name?.Value
        ? [general.Category.Name.Value]
        : undefined;

    /** -------------------- RELATED PRODUCTS -------------------- */

    const relatedProducts: RelatedProductSummary[] | undefined =
        extra?.ProductRelated?.map(rp => ({
            id: String(rp.ID ?? rp.IcecatID ?? rp.ProductCode),
            codiceProduttore: rp.ProductCode,
            description: rp.ProductName,
            brand: rp.Brand,
            thumbnail: rp.ThumbPic || null
        }));

    /** -------------------- RESULT DTO -------------------- */

    return {
        id: hit._id,
        codice: hit.ci ?? null,
        codiceProduttore: hit.codiceProduttore,
        ean,
        brand: brandName,
        brandLogoUrl: brandLogo,
        lineDescription: hit.descrizioneLinea ?? null,
        groupDescription: hit.descrizioneGruppo ?? null,
        codiceBuyer: hit.codice_buyer ?? null,
        categoryPath,
        status: general?.EndOfLifeDate ? "end_of_life" : null,
        name,
        shortDescription: marketing?.shortDescription ?? null,
        longDescription: marketing?.longDescription ?? null,
        images: {
            main: mainImage,
            thumbnail,
            gallery
        },
        visibility,
        priceTiers,
        stock,
        pricingSummary,
        suppliers: suppliers.length ? suppliers : undefined,
        marketing,
        attributes,
        relatedProducts,
        // flag “UI state” che puoi gestire lato FE
        isFavorite: false,
        isInCart: false,
        isInPromotion: !!priceStock?.Promo
    };
}
