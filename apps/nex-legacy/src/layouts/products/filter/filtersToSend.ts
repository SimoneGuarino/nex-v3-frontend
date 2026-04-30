interface FiltersToSendProps{
    brandSelected: BrandSelectedProps;
    brandPrefix: string;
    categorySelected: CategorySelectedProps;
    subcategorySelected: SubCategorySelectedProps;
    DispWithout0?: number;
    dfValue?: number;
    typeSelected?: {name: string, index: string};
}
interface BrandSelectedProps{
    Brand?: string;
    Marca?: string;
}
interface CategorySelectedProps{
    Linea: string;
}
interface SubCategorySelectedProps{
    Gruppo: string;
}

export function FiltersToSend({
    brandSelected, brandPrefix, 
    categorySelected, subcategorySelected, dfValue,
    DispWithout0, typeSelected }: FiltersToSendProps) {
    let queryArr = ["", "", "", "", "", "", "","", ""];

    if (brandSelected !== null) {
        const brandEscapeSpace = ((brandSelected as any).Brand || (brandSelected as any).Marca).replace(/ /g, "%");
        const brandEscapeAnd = brandEscapeSpace.replace(/&/g, "%26");
        queryArr[0] = "brand=" + brandEscapeAnd;
        if (brandPrefix !== null && brandPrefix !== undefined) {
            queryArr[6] = 'prx=' + brandPrefix
        }
    }

    if (categorySelected !== null && categorySelected !== undefined) {
        if (categorySelected.Linea !== null && categorySelected.Linea !== undefined) {
            queryArr[1] = "cat=" + categorySelected.Linea
        }
    }

    if (subcategorySelected !== null && subcategorySelected !== undefined) {
        if (subcategorySelected.Gruppo !== null && subcategorySelected.Gruppo !== undefined) {
            queryArr[2] = "scat=" + subcategorySelected.Gruppo
        }
    }


    if (dfValue) {
        queryArr[4] = "dfcat=" + "0";
    } else {
        queryArr[4] = "dfcat=" + "1";
    }

    if (DispWithout0) {
        queryArr[5] = "disp=" + "1";
    }

    if(typeSelected){
        queryArr[6] = "tpe=" + typeSelected.index;
    }

    for (let i = 0; i < queryArr.length; i++) {
        if (queryArr[i].indexOf(" ") > -1) {
            queryArr.splice(i, 1)
        }
    }
    //Cut gli elementi che sono empty nell'array e unisci i presenti con la & tra di loro
    let query = queryArr.filter((element) => element !== "").join("&")

    return query
}