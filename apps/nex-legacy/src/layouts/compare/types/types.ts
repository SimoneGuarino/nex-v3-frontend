export type FamilyNode = {
    famiglia?: string | null;
    descrizioneFamiglia?: string | null;
    [k: string]: unknown;
};

export type GroupNode = {
    Gruppo?: string | null;
    DescrizioneGruppo?: string | null;
    famiglie?: FamilyNode[];
    [k: string]: unknown;
};

export type LineNode = {
    Linea?: string | null;
    DescrizioneLinea?: string | null;
    SubCategory?: GroupNode[];
    [k: string]: unknown;
};

export type BrandNode = {
    Brand?: string | null;
    Marca?: string | null;
    PrefissiFornitore?: string[];
    Categories?: LineNode[];
    [k: string]: unknown;
};

export type BrandPrefixNode = string;