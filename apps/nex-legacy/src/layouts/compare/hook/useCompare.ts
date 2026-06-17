
import { type FilterChip } from "@nex/fd-ui";
import { MutableRefObject, useContext, useRef, useState } from "react";
import { BrandNode, BrandPrefixNode, FamilyNode, GroupNode, LineNode } from "../types/types";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { UserState } from "types/UserContext";
import { UserContext } from "context/UserContext";
import { Buyer } from "context/GeneralDataContext";

type Nullable<T> = T | null;


// ——————————————————————————————————————————————————————————
// HOOK
// ——————————————————————————————————————————————————————————
export function useCompare() {
    const [userContext] = useContext(UserContext) as unknown as [
        UserState,
        React.Dispatch<UserState>
    ];

    const [brandSelected, setBrandSelected] = useState<Nullable<BrandNode>>(null);
    const [brandPrefix, setBrandPrefix] = useState<Nullable<BrandPrefixNode>>(null);
    const [categorySelected, setCategorySelected] = useState<Nullable<LineNode>>(null);
    const [subcategorySelected, setSubCategorySelected] = useState<Nullable<GroupNode>>(null);
    const [familySelected, setFamilySelected] = useState<Nullable<FamilyNode>>(null);
    const [buyerTarget, setBuyerTarget] = useState<Nullable<Buyer>>(null);
    const [priceFilter, setPriceFilter] = useState<number>(0);
    const [DispWithout0, setDispWithout0] = useState<boolean>(true);
    const [dfValue, setdfValue] = useState<boolean>(false);
    const [panelMode, setPanelMode] = useState<number>(0);
    const [noteWith, setNoteWith] = useState<boolean>(false);

    const contextFiltersMenuRef: MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null); // per posizionare il context menu

    const isAdmin = CheckAdminPermissions({
        userRole: userContext?.details?.ruolo,
        permissions: userContext?.details?.permissions,
        panelToCheck: 'comparatore',
        where: 0,
    });

    // chips per i filtri attivi
    // derivati dai filtri controllati
    // usati sia in TopBar che in DocumentsSearch
    const chips: FilterChip[] = [
        ...(brandSelected ? [{ key: "marca", value: `Marca: ${brandSelected.Marca}`, onRemove: () => setBrandSelected(null) }] : []),
        ...(brandPrefix ? [{ key: "prefisso", value: `Prefisso: ${brandPrefix}`, onRemove: () => setBrandPrefix(null) }] : []),
        ...(categorySelected ? [{ key: "linea", value: `Linea: ${categorySelected.DescrizioneLinea}`, onRemove: () => setCategorySelected(null) }] : []),
        ...(subcategorySelected ? [{ key: "gruppo", value: `Gruppo: ${subcategorySelected.DescrizioneGruppo}`, onRemove: () => setSubCategorySelected(null) }] : []),
        ...(familySelected ? [{ key: "famiglia", value: `Famiglia: ${familySelected.descrizioneFamiglia}`, onRemove: () => setFamilySelected(null) }] : []),

        ...(buyerTarget ? [{ key: "buyerTarget", value: `Impersonificazione del buyer: ${buyerTarget.nome + " " + buyerTarget.cognome}`, onRemove: () => setBuyerTarget(null) }] : []),
        ...(priceFilter ? [{ key: "priceFilter", value: `Filtro prezzo: ${priceFilter}`, onRemove: () => setPriceFilter(0) }] : []),
        ...(DispWithout0 ? [{ key: "dispWithout0", value: `Disponibilità maggiore di zero`, onRemove: () => setDispWithout0(false) }] : []),
        ...(noteWith ? [{ key: "noteWith", value: `Note presenti`, onRemove: () => setNoteWith(false) }] : []),
    ];


    return {
        isAdmin,

        contextFiltersMenuRef,
        chips,

        brandSelected,
        setBrandSelected,
        brandPrefix,
        setBrandPrefix,
        categorySelected,
        setCategorySelected,
        subcategorySelected,
        familySelected, setFamilySelected,
        setSubCategorySelected,
        buyerTarget,
        setBuyerTarget,
        priceFilter,
        setPriceFilter,
        DispWithout0,
        setDispWithout0,
        dfValue,
        panelMode,
        setPanelMode,
        noteWith,
        setNoteWith,
        setdfValue,
    };
};