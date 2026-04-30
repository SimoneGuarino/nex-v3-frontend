import React from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AllInclusiveOutlinedIcon from '@mui/icons-material/AllInclusiveOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Badge from '@mui/material/Badge';

import TypeSupplierEur from './conditions/type_supplier_eur';
import TypeInfo from './conditions/type_info';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { icon_hide } from 'config/icons';
import { NumberToEuro } from 'utils';
import { Avatar } from '@mui/material';
import { getDistributorAvatar } from 'config/dist_avatars';
import { CiSquareInfo } from "react-icons/ci";

function RetriveElement(props) {
    const { columns, data, elm, index, handleOpenMenu } = props;
    const { columnIndex, hidePrice } = props;
    const { addZeroes, formatData, addingValue } = props;

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const FORCE_COLOR = isDark ? '#b4b4b4' : 'inherit';

    const colIndex = columns[columnIndex]; // colonna da renderizzare
    const indexOnData = data.findIndex(e => e.CodiceProduttore === elm.CodiceProduttore);

    const defineElements = (objE, array, condition) => {
        for (let i = 0; i < array.length; i++) {
            const elaborateE = array[i];
            if (condition.includes(objE[elaborateE])) return false;
        }
        return true;
    };

    const retriveBoxColor = React.useCallback((propriety) => {
        if (typeof propriety == 'object') {
            const prop__ = propriety.prop;
            const valueIsLowestForDist = (dist) => {
                const arr = [];
                if (propriety.type == 'lowest') {
                    for (let i = 0; i < prop__.length; i++) {
                        const x = prop__[i];
                        const value = elm.Fornitori[dist][x];
                        if (!propriety.exclude.includes(value)) arr.push(parseFloat(value));
                    }
                }
                return arr.length > 0 ? Math.min(...arr) : 0;
            };
            const valueIsLowestForFocelda = () => {
                const arr = [];
                if (propriety.type == 'lowest') {
                    for (let i = 0; i < prop__.length; i++) {
                        const x = prop__[i];
                        const value = parseFloat(elm[x]);
                        if (!propriety.exclude.includes(value)) arr.push(value);
                        else arr.push(0);
                    }
                }
                return Math.min(...arr);
            };

            const foceldaValue = valueIsLowestForFocelda();
            for (const key in elm.Fornitori) {
                const valueToCompare = valueIsLowestForDist(key);
                if (!propriety.exclude.includes(valueToCompare)) {
                    if (eval(foceldaValue + propriety.cond + valueToCompare)) return propriety.true;
                    else continue;
                }
            }
            return propriety.false;
        } else {
            return colIndex?.color;
        }
    }, [elm, colIndex]);

    // helper per evitare di spargere !important ovunque: lo mettiamo sul contenitore della cella
    const forceTextColorSX = {
        '&, & *:not(svg):not(path)': { color: `${FORCE_COLOR} !important` },
    };

    if (colIndex.type === 'suggested_price') {
        const product = data[index];

        // funzione che calcola il prezzo suggerito
        // il prezzo suggerito è uguale al prezzo Focelda se lo stock (disponibilità) è diverso da 0
        // se no prende il prezzo del fornitore se l'oggetto distributori esiste e ha almeno un fornitore
        // e prende di riferimento la proprietà dist_prezzo_suggerito che contiene il nome del fornitore
        // in questo modo puo determinare il prezzo tra i fornitori che sono attualmente attivi (distributori.Fornitori)
        function calculateSuggestedPrice() {
            let price = 0;

            if (product && product.Disponibilita && product.Disponibilita.Totali > 0) {
                //determina se prendere il prezzo o il prezzo listino, in base al valore piu basso, ma deve essere diverso da 0
                if (product.PrezzoListino > 0 && product.Prezzo > 0) {
                    price = Math.min(product.Prezzo, product.PrezzoListino);
                } else if (product.Prezzo > 0) {
                    price = product.Prezzo;
                } else if (product.PrezzoListino > 0) {
                    price = product.PrezzoListino;
                };
                return NumberToEuro({ convert: price });
            };

            // se non ha disponibilità, prende il prezzo del fornitore suggerito
            if (product && product.Fornitori &&
                product.distributori && Array.isArray(product.distributori) && product.distributori.length > 0 &&
                product.distributori[0].Fornitori.length > 0 &&
                product.distributori[0].Fornitori &&
                product.distributori[0].dist_prezzo_suggerito &&
                product.distributori[0].Fornitori.map(f => f.name).includes(product.distributori[0].dist_prezzo_suggerito) &&
                product.Fornitori[product.distributori[0].dist_prezzo_suggerito]
            ) {
                const supplier = product.Fornitori[product.distributori[0].dist_prezzo_suggerito];
                console.log(supplier);

                if (supplier.PrezzoListino > 0 && supplier.Prezzo > 0) {
                    price = Math.min(supplier.Prezzo, supplier.PrezzoListino);
                } else if (supplier.Prezzo > 0) {
                    price = supplier.Prezzo;
                } else if (supplier.PrezzoListino > 0) {
                    price = supplier.PrezzoListino;
                };
                return NumberToEuro({ convert: price });
            };

            return <span style={{ color: '#b4b4b4' }}>/</span>;
        };

        return (
            <Tooltip title={
                colIndex?.onHover ? colIndex.secKey ? data[index][colIndex.key][colIndex.secKey]
                    : data[index][colIndex.key] : null
            }>
                <Stack
                    style={{ height: '100%', padding: 10, justifyContent: 'center', width: colIndex.width, minWidth: 100, maxWidth: 300 }}
                    sx={{ ...(colIndex.sx || {}), ...forceTextColorSX }}
                >
                    <span
                        style={{
                            ...(colIndex?.sxText || {}),
                            fontSize: 'min(calc(0.50vw + 0.50vh), 15px)',
                        }}
                    >
                        {calculateSuggestedPrice()}
                    </span>
                </Stack>
            </Tooltip>
        )
    };

    if (colIndex.type === 'dist_icons') {
        const product = data[index];
        const distributor = getDistributorAvatar(product.Da ?? "Focelda");
        const avatarUrl = distributor?.avatarUrl || "";

        return <div style={{ height: '100%', padding: 10, justifyContent: 'center', width: colIndex.width, minWidth: 100, maxWidth: 300 }}
        className='content-center place-items-center'><Avatar src={avatarUrl} className="max-w-[50px] h-8"
            data-tooltip-id="general-compare-tooltip"
            data-tooltip-content={product.Da ?? "Focelda"} /></div>
    };

    // ROW con più elementi
    if (Array.isArray(colIndex.key)) {
        return (
            <Stack
                backgroundColor={retriveBoxColor(colIndex?.color)}
                style={{ minWidth: 100, height: '100%', padding: '10px', justifyContent: 'center', width: colIndex.width }}
                sx={{ ...(colIndex.sx || {}), ...forceTextColorSX }}
            >
                {colIndex.type !== 'supplier' ? (
                    colIndex.type !== 'info' ?
                        colIndex.type !== 'multiple' ?
                            colIndex.type !== 'multipleKeepa' ?
                                colIndex.type !== 'commentsAllert' ?
                                    colIndex.fieldToTake.map((columnRow, j) => {
                                        const key = columnRow.key;
                                        const productValue = elm[key];

                                        if (!key || !productValue) {
                                            return null;
                                        }

                                        return (
                                            <Tooltip key={j} title={(productValue || productValue[0])}>
                                                <span
                                                    style={{
                                                        ...(columnRow.sx || {}),
                                                        fontSize: 'min(calc(0.50vw + 0.50vh), 13px)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: 'inline-block',
                                                    }}
                                                >
                                                    {columnRow.leftIcon && columnRow.leftIcon}
                                                    {(productValue || productValue[0])}
                                                </span>
                                            </Tooltip>
                                        );
                                    })
                                    :
                                    (elm.Comments?.length > 0 && (
                                        <Badge
                                            sx={{ color: '#38304e' }}
                                            badgeContent={elm.Comments?.length}
                                            color="primary"
                                            max={999}
                                            style={{ alignSelf: "center" }}
                                        >
                                            <ForumOutlinedIcon fontSize="2em !important" />
                                        </Badge>
                                    ))
                                :
                                colIndex.fieldToTake.map((field, t) => {
                                    return (
                                        <span key={t} style={{ fontSize: '0.7em' }}>
                                            {elm[colIndex.key] !== undefined ?
                                                elm[colIndex.key][field.key] !== 0 ?
                                                    <Stack direction='row' alignItems='center' gap={1}>
                                                        <i className={field.icons}></i>
                                                        {addZeroes(elm[colIndex.key][field.key])}
                                                    </Stack>
                                                    :
                                                    <span style={{ color: '#b4b4b4' }}>/</span>
                                                :
                                                <span style={{ color: '#b4b4b4' }}>/</span>
                                            }
                                        </span>
                                    );
                                })
                            :
                            colIndex.fieldToTake
                                .filter(elm => elm.hideInRow !== true)
                                .map((field, x) => {
                                    let ret = null;

                                    if (!field) {
                                        return (
                                            <span key={x} style={{ fontSize: '0.7em' }}>
                                                <span style={{ color: '#b4b4b4' }}>/</span>
                                            </span>
                                        );
                                    }

                                    switch (field.type) {
                                        case 'eur':
                                            if (elm?.classificazionePromo !== 'B' && elm.Disponibilita.Totali) {
                                                if (field.info) {
                                                    ret = (
                                                        <Stack direction='row' gap={0.5} alignItems='center'>
                                                            <span  data-tooltip-id='general-compare-tooltip'
                                                            data-tooltip-content={`Valore dello Stock (Prezzo * Disponibilità) = ${addZeroes(field.info.multiplay.reduce((acc, curr) => 
                                                                acc * (typeof curr === 'string' ? elm[curr] ?? 0 : elm[curr.parent][curr.key] ?? 0), 1)
                                                            )}`}>
                                                                <CiSquareInfo size={25} className='text-sky-500'/>
                                                            </span>

                                                            {elm?.classificazionePromo && <span 
                                                            className='bg-sky-200 dark:bg-gray-700 py-0.5 px-2 rounded'
                                                            data-tooltip-id='general-compare-tooltip'
                                                            data-tooltip-content={`Classificazione della Promo: ${elm?.classificazionePromo}`}>
                                                                {elm?.classificazionePromo}</span>}

                                                            {addZeroes(elm[field.key])}
                                                        </Stack>
                                                    );
                                                } else {
                                                    ret = addZeroes(elm[field.key]);
                                                }
                                            } else {
                                                ret = addZeroes(elm[field.key]);
                                            }
                                            break;
                                        case 'promo':
                                            if (!field.conditionToHide.includes(elm[field.key])) {
                                                ret = (
                                                    <Tooltip title={'Fine Promo: ' + (formatData(elm.FinePromo) || 'Data fine Promo non definita')}>
                                                        <LocalOfferOutlinedIcon sx={{ marginRight: 0.5 }} />
                                                        {field.formatedData && elm.FinePromo ? (formatData(elm.FinePromo) || <AllInclusiveOutlinedIcon />) :
                                                            (elm.FinePromo || <AllInclusiveOutlinedIcon />)}
                                                    </Tooltip>
                                                );
                                            } else {
                                                ret = <span></span>;
                                            }
                                            break;
                                        case 'pz':
                                            if (!field.parentPropriety) {
                                                ret = (elm[field.key] || 0) + ' pz';
                                            } else if (elm[field.parentPropriety] !== undefined) {
                                                ret = (elm[field.parentPropriety][field.key] || 0) + ' pz';
                                            }
                                            break;
                                        default:
                                            ret = (
                                                <span key={x} style={{ ...(field.sx || {}), fontSize: 12 }}>
                                                    {elm[field.key] || "/"}
                                                </span>
                                            );
                                            break;
                                    }

                                    return (
                                        <Tooltip title={field.onHover ? elm[field.key] : null} key={x}>
                                            <span style={{ ...(field.sx || {}), fontSize: 12 }}>
                                                {ret}
                                            </span>
                                        </Tooltip>
                                    );
                                })
                        :
                        <TypeInfo elm={elm} colIndex={colIndex} indexRow={indexOnData} allData={data} handleOpenMenu={handleOpenMenu} />
                ) : (
                    // ====== SUPPLIER ======
                    colIndex.fieldToTake.map((e, j) => {
                        const product = elm[colIndex.key][colIndex.distributor];
                        let render = null;

                        if (!product) {
                            return (
                                <span key={j} style={{ ...(e.sx || {}), fontSize: '0.7em' }}>
                                    <span style={{ color: '#b4b4b4' }}>/</span>
                                </span>
                            );
                        }

                        switch (e.type) {
                            case 'pz':
                                render = e.conditionToHide !== undefined &&
                                    Boolean(e.conditionToHide.includes(product?.Prezzo)
                                        && e.conditionToHide.includes(product?.PrezzoListino)) ? null :
                                    (product[e.key] || 0) + ' pz';
                                break;
                            case 'eur':
                                render = Array.isArray(e.key)
                                    ? ((!hidePrice || hidePrice === undefined)
                                        ? (
                                            <span>
                                                <TypeSupplierEur
                                                    e={e}
                                                    elm={data[indexOnData]}
                                                    product={data[indexOnData][colIndex.key][colIndex.distributor]}
                                                    addZeroes={addZeroes}
                                                    addingValue={addingValue}
                                                />
                                            </span>
                                        )
                                        : icon_hide({ width: 20, height: 20 }))
                                    : (e.conditionToHide !== undefined && (product.Prezzo === 0 || product.PrezzoListino === 0)
                                        ? (!e.conditionToHide.includes(product[e.key])
                                            ? addZeroes(product[e.key], product.Siae, product.Raee)
                                            : <span style={{ color: '#b4b4b4' }}>/</span>)
                                        : addZeroes(product[e.key], product.Siae, product.Raee));
                                break;
                            case 'tax':
                                render = defineElements(product, e.elmToTake, e.conditionToHide) &&
                                    <Tooltip title={
                                        <Stack>
                                            <Stack>
                                                <div style={{ textAlign: "center", marginTop: "0.3em", fontSize: "1em", color: '#fff' }}>
                                                    Siae: {addZeroes(product.Siae)}
                                                </div>
                                            </Stack>
                                            <Stack>
                                                <div style={{ textAlign: "center", marginTop: "0.3em", fontSize: "1em", color: '#fff' }}>
                                                    Raee: {addZeroes(product.Raee)}
                                                </div>
                                            </Stack>
                                        </Stack>
                                    }>
                                        Tasse Incl.
                                    </Tooltip>;
                                break;
                            case 'promo':
                                render = !e.condition.includes(product[e.key]) ? (
                                    <Tooltip title={!e.condition.includes(product.FinePromo) ? ('Fine Promo: ' + formatData(product.FinePromo)) : 'Data fine Promo non definita'}>
                                        <LocalOfferOutlinedIcon sx={{ marginRight: 0.5 }} />
                                        <span className='text-xs'>{(formatData(product.FinePromo)) || <AllInclusiveOutlinedIcon />}</span>
                                    </Tooltip>
                                ) : null;
                                break;
                            default:
                                render = product[e.key] || 0;
                        }

                        return (
                            <span key={j} style={{ ...(e.sx || {}), fontSize: '0.7em' }}>
                                {render}
                            </span>
                        );
                    })
                )}
            </Stack>
        );
    } else {
        // cella con chiave singola
        return (
            <Tooltip title={
                colIndex?.onHover ? colIndex.secKey ? data[index][colIndex.key][colIndex.secKey]
                    : data[index][colIndex.key] : null
            }>
                <Stack
                    style={{ height: '100%', padding: 10, justifyContent: 'center', width: colIndex.width, minWidth: 100, maxWidth: 300 }}
                    sx={{ ...(colIndex.sx || {}), ...forceTextColorSX }}
                >
                    <span
                        style={{
                            ...(colIndex?.sxText || {}),
                            fontSize: 'min(calc(0.50vw + 0.50vh), 15px)',
                        }}
                    >
                        {colIndex.type === 'eur' ? addZeroes(data[index][colIndex.key]) :
                            colIndex.secKey ? data[index][colIndex.key][colIndex.secKey]
                                : data[index][colIndex.key]}
                    </span>
                </Stack>
            </Tooltip>
        );
    }
}

export default RetriveElement;
