import React, { useEffect } from 'react';



function TypeSupplierEur (props) {
    /**
     * e => elemento nella colonna
     * elm => elemento nei dati
     * colIndex => fa riferimento alla colonna madre nei dati della colonna
     * addZeroes => condizione per la trasformazione del numero
     */
    const { e, elm, addZeroes, addingValue, product } = props;

    const chooseLowestValue = React.useCallback(() => {
        if(!elm){return []}
        const arr = [];

        e.key.filter(value => {
            const val = product[value.key];

            if(val !== 0 && val !== null && val !== undefined){
                let value__ = parseFloat(product[value.key]);
                if(Object.keys(addingValue).length > 1){
                    // Aggiungi/Sottrae in base al valore inserito nel pannello dei settings dei fornitori. 
                    // idIndexOfValue = 1 => incrementa
                    // idIndexOfValue = 0 => togli dal valore
                    const percent = addingValue.toIncrease !== undefined ? 
                        ((value__ * addingValue.toIncrease) / 100) : ((value__ * addingValue.toDecrease) / 100)
                    if(addingValue.idIndexOfValue === 1){
                        value__ += percent;
                    }else{
                        value__ -= percent;
                    }
                }
                arr.push(...[value__])
            }
        });
        return arr;
    },[elm]);

    useEffect(() => {chooseLowestValue()}, [elm])

    return (
        chooseLowestValue().length > 0 ?
            <span>
                {addZeroes(Math.min(...chooseLowestValue()), product.Siae, product.Raee)}
            </span>
        : <span style={{color:'#b4b4b4'}}>/</span>
    )
}

export default TypeSupplierEur