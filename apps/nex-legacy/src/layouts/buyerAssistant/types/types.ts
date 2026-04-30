import { FDSelectOption } from "components/UI/input/FDSelect";

export type Famiglia = { famiglia: string; descrizioneFamiglia?: string };

export type SubCategory = { Gruppo: string; DescrizioneGruppo?: string; famiglie?: Famiglia[] };

export type Categoria = { Linea: string; DescrizioneLinea?: string; SubCategory?: SubCategory[] };

export type BrandDoc = { _id?: any; Marca: string; Categories?: Categoria[] };

// Opzioni profondità (orizz_temporale)
export const PROFONDITA_OPTIONS: FDSelectOption<number>[] = [
    { value: 1, label: "30 Giorni" },
    { value: 2, label: "60 Giorni" },
];

export type BuyerAssistantFiltersProps = {
    brand?: string[];
    prefisso?: string[];
    linea?: string[];
    gruppo?: string[];
    famiglia?: string[];
    flagGest?: string[];
    ragProd?: string[];
    buyer?: string[];
    denomBreve?: string;
};

export type BsgItem = {
    codice_fornitore: string;
    bsg_tipologia_testo: string;
    bsg_testo: string;
};

export type GeneralAPIProps = {
    abortController: AbortController;
    onError?: (error: any) => void;
    setLoading?: (loading: boolean) => void;
};