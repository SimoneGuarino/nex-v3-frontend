export interface Product {
    _id: string;
    CodiceProduttore: string;
    Prezzo: number;
    PrezzoListino: number;
    Fornitori: {[key: string]: {
        Disponibili: string;
        Prezzo: number;
        PrezzoListino: number;
    };}
}