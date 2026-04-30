// src/layouts/fatturati/components/BrandsPanel.tsx
//////////////////////////////////////////////////////////
//                                                      //
//                                                      //
//             Pannello Inutilizzato                    //
//                                                      //
//                                                      //
//////////////////////////////////////////////////////////



//NB. da questo file viene solo utilizzato il type BrandFiltersOut




// import { useEffect, useMemo, useRef, useState } from "react";
// import FDSelect from "components/UI/input/FDSelect";
// import { GetCategoriesAPI } from "../fetchdata/getCategories";

// type Famiglia = { famiglia: string; descrizioneFamiglia?: string };
// type SubCategory = { Gruppo: string; DescrizioneGruppo?: string; famiglie?: Famiglia[] };
// type Categoria = { Linea: string; DescrizioneLinea?: string; SubCategory?: SubCategory[] };
// type BrandDoc = {
//     _id?: any;
//     Marca: string;
//     Categories?: Categoria[];
//     PrefissiFornitore?: string[]; // serve per PRF
// };

// type Option = { label: string; value: string };

// // array (coerente con i filtri business multi)
export type BrandFiltersOut = {
    PRF?: string[]; // prefissi fornitore
    LIP?: string[]; // linee
    GRU?: string[]; // gruppi
    FAM?: string[]; // famiglie
};

// const safeArray = <T,>(a: T[] | undefined | null): T[] => Array.isArray(a) ? a : [];

// // normalizza qualsiasi valore di FDSelect in string[]
// const toArray = (v: unknown): string[] => {
//     if (Array.isArray(v)) {
//         return v.map(x => String(x).trim()).filter(Boolean);
//     }
//     if (v == null || String(v).trim() === "") return [];
//     return [String(v).trim()];
// };

// // helper ordinamento ASC per label
// const sortOptionsAsc = (opts: Option[]): Option[] =>
//     [...opts].sort((a, b) =>
//         a.label.localeCompare(b.label, "it", { sensitivity: "base" })
//     );

// export default function BrandsPanel({
//     onFiltersChange,
// }: { onFiltersChange?: (f: BrandFiltersOut) => void }) {
//     const [brands, setBrands] = useState<BrandDoc[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const abortRef = useRef<AbortController | null>(null);

//     // selezioni MULTIPLE
//     const [brandSel, setBrandSel] = useState<string[]>([]);       // Marche scelte
//     const [lineaSel, setLineaSel] = useState<string[]>([]);       // codici linea (LIP)
//     const [gruppoSel, setGruppoSel] = useState<string[]>([]);     // codici gruppo (GRU)
//     const [famigliaSel, setFamigliaSel] = useState<string[]>([]); // codici famiglia (FAM)

//     useEffect(() => {
//         abortRef.current = new AbortController();

//         const ChangeLoadStatus = ({ bool }: { from: string; bool: boolean }) => setLoading(bool);
//         const setData = (res: any) => setBrands(Array.isArray(res) ? (res as BrandDoc[]) : []);

//         setLoading(true);
//         GetCategoriesAPI({ abortController: abortRef.current, setData, ChangeLoadStatus });

//         return () => abortRef.current?.abort();
//     }, []);

//     // ---- BRAND OPTIONS: filtrati dalle linee selezionate ----
//     const brandOptions: Option[] = useMemo(() => {
//         const seen = new Set<string>();
//         const allowedLines = new Set(lineaSel); // se vuoto → nessun filtro per linee
//         const opts: Option[] = [];

//         safeArray(brands).forEach(b => {
//             const marca = b.Marca?.trim();
//             if (!marca || seen.has(marca)) return;

//             if (allowedLines.size > 0) {
//                 const hasAllowedLine = safeArray(b.Categories).some(cat =>
//                     allowedLines.has(cat.Linea)
//                 );
//                 if (!hasAllowedLine) return;
//             }

//             seen.add(marca);
//             opts.push({ label: marca, value: marca });
//         });

//         return sortOptionsAsc(opts);
//     }, [brands, lineaSel]);

//     // BrandDoc effettivamente selezionati (per PRF)
//     const selectedBrandDocs = useMemo(
//         () =>
//             safeArray(brands).filter(
//                 b => b.Marca && brandSel.includes(b.Marca)
//             ),
//         [brands, brandSel]
//     );

//     // pool di brand da cui derivare le LINEE:
//     // - se ho brandSel → solo quei brand
//     // - se NON ho brandSel → TUTTI i brand (così posso partire da "Linea")
//     const brandsForLines = useMemo(() => {
//         const all = safeArray(brands);
//         if (!brandSel.length) return all;
//         return all.filter(b => b.Marca && brandSel.includes(b.Marca));
//     }, [brands, brandSel]);

//     // options LINEA: LABEL = DescrizioneLinea, VALUE = Linea
//     // derivate da brandsForLines (filtrate dai brand scelti)
//     const lineaOptions: Option[] = useMemo(() => {
//         const seen = new Set<string>();
//         const opts: Option[] = [];
//         brandsForLines.forEach(b => {
//             safeArray(b.Categories).forEach(cat => {
//                 const code = cat.Linea;
//                 if (!code || seen.has(code)) return;
//                 seen.add(code);
//                 opts.push({
//                     value: code,
//                     label: cat.DescrizioneLinea || cat.Linea,
//                 });
//             });
//         });
//         return sortOptionsAsc(opts);
//     }, [brandsForLines]);

//     // pool categorie -> dipende da linee + brand selezionati:
//     // - serve almeno una linea
//     // - se ho brandSel → considero solo quei brand
//     const categoriaPool: Categoria[] = useMemo(() => {
//         if (!lineaSel.length) return [];
//         const lineFilter = new Set(lineaSel);
//         const brandFilter = new Set(brandSel);
//         const result: Categoria[] = [];

//         safeArray(brands).forEach(b => {
//             if (brandFilter.size > 0) {
//                 if (!b.Marca || !brandFilter.has(b.Marca)) return;
//             }
//             safeArray(b.Categories).forEach(cat => {
//                 if (lineFilter.has(cat.Linea)) {
//                     result.push(cat);
//                 }
//             });
//         });

//         return result;
//     }, [brands, lineaSel, brandSel]);

//     // options GRUPPO: LABEL = DescrizioneGruppo, VALUE = Gruppo
//     const gruppoOptions: Option[] = useMemo(() => {
//         if (!categoriaPool.length) return [];
//         const seen = new Set<string>();
//         const opts: Option[] = [];
//         categoriaPool.forEach(cat => {
//             safeArray(cat.SubCategory).forEach(sc => {
//                 const code = sc.Gruppo;
//                 if (!code || seen.has(code)) return;
//                 seen.add(code);
//                 opts.push({
//                     value: code,
//                     label: sc.DescrizioneGruppo || sc.Gruppo,
//                 });
//             });
//         });
//         return sortOptionsAsc(opts);
//     }, [categoriaPool]);

//     // pool subcategory filtrato da gruppi scelti (se non ci sono gruppi → tutte le subcategory della categoriaPool)
//     const subCategoryPool: SubCategory[] = useMemo(() => {
//         if (!categoriaPool.length) return [];
//         const groupFilter = new Set(gruppoSel);
//         const result: SubCategory[] = [];
//         categoriaPool.forEach(cat => {
//             safeArray(cat.SubCategory).forEach(sc => {
//                 if (groupFilter.size === 0 || groupFilter.has(sc.Gruppo)) {
//                     result.push(sc);
//                 }
//             });
//         });
//         return result;
//     }, [categoriaPool, gruppoSel]);

//     // options FAMIGLIA
//     const famigliaOptions: Option[] = useMemo(() => {
//         if (!subCategoryPool.length) return [];
//         const seen = new Set<string>();
//         const opts: Option[] = [];
//         subCategoryPool.forEach(sc => {
//             safeArray(sc.famiglie).forEach(f => {
//                 const code = f.famiglia;
//                 if (!code || seen.has(code)) return;
//                 seen.add(code);
//                 opts.push({
//                     value: code,
//                     label: f.descrizioneFamiglia || f.famiglia,
//                 });
//             });
//         });
//         return sortOptionsAsc(opts);
//     }, [subCategoryPool]);

//     // ---- handlers ----

//     // BRAND <=> LINEA: brand sta sullo stesso livello di linea
//     const onBrandChange = (val: unknown) => {
//         const arr = toArray(val);
//         setBrandSel(arr);

//         // se ci sono brand selezionati, tengo nelle linee solo quelle appartenenti ad almeno uno di essi
//         if (arr.length > 0) {
//             const brandSet = new Set(arr);
//             const allowedLines = new Set<string>();

//             safeArray(brands).forEach(b => {
//                 if (!b.Marca || !brandSet.has(b.Marca)) return;
//                 safeArray(b.Categories).forEach(cat => {
//                     if (cat.Linea) {
//                         allowedLines.add(cat.Linea);
//                     }
//                 });
//             });

//             setLineaSel(prev => prev.filter(code => allowedLines.has(code)));
//         }

//         // cambiando brand (e potenzialmente il pool di categorie) resetto gruppi e famiglie
//         setGruppoSel([]);
//         setFamigliaSel([]);
//     };

//     const onLineaChange = (val: unknown) => {
//         const arr = toArray(val);
//         setLineaSel(arr);

//         // sincronizza i brand selezionati: mantieni solo quelli che hanno almeno una linea selezionata
//         if (arr.length > 0) {
//             const lineSet = new Set(arr);
//             setBrandSel(prev =>
//                 prev.filter(code => {
//                     const b = safeArray(brands).find(x => x.Marca === code);
//                     if (!b) return false;
//                     return safeArray(b.Categories).some(cat => lineSet.has(cat.Linea));
//                 })
//             );
//         }
//         // se arr è vuoto → non tocco brandSel (restano i brand selezionati)

//         // cambio linea → reset gruppi e famiglie
//         setGruppoSel([]);
//         setFamigliaSel([]);
//     };

//     const onGruppoChange = (val: unknown) => {
//         const arr = toArray(val);
//         setGruppoSel(arr);
//         // cambio gruppi → reset famiglie
//         setFamigliaSel([]);
//     };

//     const onFamigliaChange = (val: unknown) => {
//         const arr = toArray(val);
//         setFamigliaSel(arr);
//     };

//     // PRF = unione dei PrefissiFornitore dei brand selezionati (dopo eventuali filtri su linee)
//     const PRF = useMemo(() => {
//         const prefSet = new Set<string>();
//         selectedBrandDocs.forEach(b => {
//             safeArray(b.PrefissiFornitore).forEach(p => {
//                 const code = (p ?? "").trim();
//                 if (code) prefSet.add(code);
//             });
//         });
//         const arr = Array.from(prefSet);
//         return arr.length ? arr : undefined;
//     }, [selectedBrandDocs]);

//     // notifica filtri al parent
//     useEffect(() => {
//         onFiltersChange?.({
//             PRF,
//             LIP: lineaSel.length ? lineaSel : undefined,
//             GRU: gruppoSel.length ? gruppoSel : undefined,
//             FAM: famigliaSel.length ? famigliaSel : undefined,
//         });
//     }, [PRF, lineaSel, gruppoSel, famigliaSel, onFiltersChange]);

//     return (
//         <div className="w-full flex flex-col md:flex-row gap-2">
//             {/* BRAND (multi, filtrato dalle linee scelte) */}
//             <FDSelect
//                 options={brandOptions}
//                 placeholder="Brand"
//                 fullWidth
//                 size="sm"
//                 value={brandSel}
//                 onChange={onBrandChange}
//                 disabled={loading || brandOptions.length === 0}
//                 searchable
//                 multiple
//             />

//             {/* LINEA (multi, filtrata dai brand scelti) */}
//             <FDSelect
//                 options={lineaOptions}
//                 placeholder="Linea"
//                 fullWidth
//                 size="sm"
//                 value={lineaSel}
//                 onChange={onLineaChange}
//                 disabled={loading || lineaOptions.length === 0}
//                 searchable
//                 multiple
//             />

//             {/* GRUPPO (multi) – solo se ho almeno una linea */}
//             {lineaSel.length > 0 && (
//                 <FDSelect
//                     options={gruppoOptions}
//                     placeholder="Gruppo"
//                     fullWidth
//                     size="sm"
//                     value={gruppoSel}
//                     onChange={onGruppoChange}
//                     disabled={loading || gruppoOptions.length === 0}
//                     searchable
//                     multiple
//                 />
//             )}

//             {/* FAMIGLIA (multi) – solo se ho almeno un gruppo */}
//             {gruppoSel.length > 0 && (
//                 <FDSelect
//                     options={famigliaOptions}
//                     placeholder="Famiglia"
//                     fullWidth
//                     size="sm"
//                     value={famigliaSel}
//                     onChange={onFamigliaChange}
//                     disabled={loading || famigliaOptions.length === 0}
//                     searchable
//                     multiple
//                 />
//             )}
//         </div>
//     );
// }
