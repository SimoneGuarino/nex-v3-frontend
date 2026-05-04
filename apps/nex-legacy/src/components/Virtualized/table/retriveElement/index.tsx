import React from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from 'components/MDTypography';
import Tooltip from '@mui/material/Tooltip';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AllInclusiveOutlinedIcon from '@mui/icons-material/AllInclusiveOutlined';
import Badge from '@mui/material/Badge';

import TypeSupplierEur from './conditions/type_supplier_eur';
import TypeInfo from './conditions/type_info';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { NumberToEuro } from 'utils/numberToEuro';
import { MainTheme } from 'assets/settingsTheme';
import { Checkbox } from '@mui/material';
import { icon_info } from 'config/icons';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { UserAvatar } from 'examples/Navbars/components/userInfo';
import { clsx } from 'components/UI/box/FDBox';


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
type DistItem = Record<string, any> & { name?: string };
type ShowProp = { name: string; icon?: React.ReactNode };
interface RetriveElementProps {
    columns: any[];
    data: any[];
    elm: any;
    index: number;
    handleOpenMenu: (e: React.MouseEvent<HTMLElement>, data: any[]) => void;
    columnIndex: number;
    addZeroes: (...args: any[]) => any;
    formatData: (value: any) => any;
    addingValue?: any;
    blockCondition?: { condition: string; bg: string };
    visibleColumns?: string[];
    columnKey?: any;
    textCenter?: boolean;
};

type TableOfColorsProps = Record<string, { text: string; bg: string; dot: string; dotDark: string }>;
const defaultTableOfColors: TableOfColorsProps = {
    neutral: { text: "text-neutral-800", bg: "bg-neutral-200", dot: "bg-neutral-500", dotDark: "dark:bg-neutral-900" },
}

// ——————————————————————————————————————————————————————————
// SUB-COMPONENTS
// ——————————————————————————————————————————————————————————
const TagDist: React.FC<{ value: DistItem[] | string; showProps?: ShowProp[], tableOfColors?: TableOfColorsProps, pointOfColor?: boolean }> = ({
    value,
    showProps,
    tableOfColors,
    pointOfColor = false,
}) => {
    const palette = MainTheme().palette;
    const isString = typeof value === 'string';

    if (isString) {
        const colorKey = tableOfColors?.[value] ?? defaultTableOfColors['neutral'];
        const base = "text-xs font-medium mr-2 px-2.5 py-0.5 rounded";
        
        return (
            <span className={clsx(colorKey.bg, colorKey.text, base)}>
                {pointOfColor && tableOfColors?.[value] &&
                    <div className={`inline-block h-2 w-2 mr-2 ${colorKey.dot} rounded-full ${colorKey.dotDark}`} />}
                {value ?? "N/A"}
            </span>
        );
    };

    return (
        <Stack direction="row" gap={0.5} alignItems="center" alignContent="flex-start" width="100%" justifyContent="center">
            {value.length > 0 ? (
                value.slice(0, 3).map((data, index) => (
                    <Stack
                        key={index}
                        direction="row"
                        gap={0.5}
                        alignItems="center"
                        sx={{ backgroundColor: '#ffe279cc', fontSize: '0.75rem', height: 'fit-content', p: '3px 10px', borderRadius: 5 }}
                    >
                        <MDTypography sx={{ fontSize: 'inherit', color: palette.grey[700] }}>{data.name}</MDTypography>
                        {Object.keys(data).length > 1 &&
                            showProps?.map((props, idx) =>
                                data[props.name] ? (
                                    <Stack direction="row" alignItems="center" key={idx}>
                                        <MDTypography sx={{ fontSize: 'inherit', color: palette.grey[700] }}>
                                            {data[props.name]}%
                                        </MDTypography>
                                        {props.icon}
                                    </Stack>
                                ) : null
                            )}
                    </Stack>
                ))
            ) : (
                <MDTypography sx={{ backgroundColor: '#ffe279cc', fontSize: '0.7rem', height: 'fit-content', p: '3px 10px', borderRadius: 5 }}>
                    Nessun Fornitore
                </MDTypography>
            )}
            {value.length > 3 && (
                <MDTypography
                    data-tooltip-id="general-table-VI-tooltip"
                    data-tooltip-content={`${value.slice(3)}`}
                    sx={{ fontSize: '0.7rem', p: '5px 7.5px', backgroundColor: '#fff5d0cc', borderRadius: '50%' }}
                >
                    +{value.length - 3}
                </MDTypography>
            )}
        </Stack>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
function RetrieveElement(props: RetriveElementProps): JSX.Element {
    const { columns, data, elm, index, handleOpenMenu, columnIndex, addZeroes, formatData, addingValue, blockCondition, textCenter = false } =
        props;
    const colIndex = columns[columnIndex];
    const textData = colIndex.secKey ? data[index]?.[colIndex.key]?.[colIndex.secKey] : data[index]?.[colIndex.key];
    const indexOnData = data.findIndex((e) => e?.CodiceProduttore === elm?.CodiceProduttore);
    const centeredCellStyle: React.CSSProperties = textCenter
        ? { alignItems: 'center', textAlign: 'center' }
        : {};

    const defineElements = (objE: any, array: string[], condition: any[]): boolean => {
        for (let i = 0; i < array.length; i++) {
            const elaborateE = array[i];
            if (condition.includes(objE[elaborateE])) return false;
        }
        return true;
    };

    const InfoBlock: React.FC<{ field: any }> = ({ field }) => {
        function Multiplay({ multiplay }: { multiplay: Array<string | { parentPropriety: string; key: string }> }) {
            return multiplay.reduce(
                (acc, cur) => acc * (typeof cur === 'string' ? (elm?.[cur] ?? 0) : (elm?.[cur.parentPropriety]?.[cur.key] ?? 0)),
                1
            );
        }

        const maps = (
            <Stack>
                {field.info.map((d: any, idx: number) => {
                    let ret_: React.ReactNode = null;
                    if (d.key) {
                        ret_ = (
                            <MDTypography key={idx} variant="body2" fontSize="0.85rem" sx={{ color: '#ccc' }}>
                                {d.text}
                                {NumberToEuro({ convert: (elm[d.key] ?? 0) as number })}
                            </MDTypography>
                        );
                    } else if (d.multiplay && !d.key) {
                        ret_ = (
                            <MDTypography key={idx} variant="body2" fontSize="0.85rem" sx={{ color: '#ccc' }}>
                                {d.text}
                                {NumberToEuro({ convert: (Multiplay({ multiplay: d.multiplay }) ?? 0) as number })}
                            </MDTypography>
                        );
                    }
                    return ret_;
                })}
            </Stack>
        );

        return (
            <Stack direction="row" gap={1} alignItems="center">
                <Stack direction="row" gap={0.2} alignItems="center">
                    {Boolean(elm.Siae && elm.Siae !== 0) && (
                        <Tooltip title={`Siae: ${NumberToEuro({ convert: (elm.Siae ?? 0) as number })}`}>
                            <MDTypography
                                variant="body1"
                                fontSize="0.60rem"
                                sx={{
                                    fontWeight: 800,
                                    backgroundColor: '#ffbf00',
                                    borderRadius: '50%',
                                    padding: '0 5px',
                                    color: '#000',
                                    height: 'fit-content',
                                }}
                            >
                                S
                            </MDTypography>
                        </Tooltip>
                    )}
                    {Boolean(elm.Raee && elm.Raee !== 0) && (
                        <Tooltip title={`Raee: ${NumberToEuro({ convert: (elm.Raee ?? 0) as number })}`}>
                            <MDTypography
                                variant="body1"
                                fontSize="0.60rem"
                                sx={{
                                    fontWeight: 800,
                                    backgroundColor: '#ffbf00',
                                    borderRadius: '50%',
                                    padding: '0 5px',
                                    color: '#000',
                                    height: 'fit-content',
                                }}
                            >
                                R
                            </MDTypography>
                        </Tooltip>
                    )}
                    <Tooltip title={maps}>{icon_info({ width: 18, height: 18 })}</Tooltip>
                </Stack>

                <MDTypography variant="body2" fontSize="0.85rem">
                    {NumberToEuro({ convert: (elm[field.key] ?? 0) as number })}
                </MDTypography>
            </Stack>
        );
    };

    const retriveBoxColor = React.useCallback(
        (propriety: any) => {
            if (typeof propriety === 'object' && propriety) {
                let ret;
                switch (propriety.type) {
                    case 'lowest': {
                        const prop__: string[] = propriety.prop;
                        const valueIsLowestForDist = (dist: string) => {
                            const arr: number[] = [];
                            for (let i = 0; i < prop__.length; i++) {
                                const x = prop__[i];
                                const value = elm?.Fornitori?.[dist]?.[x];
                                if (!propriety.exclude.includes(value)) arr.push(parseFloat(value));
                            }
                            return arr.length > 0 ? Math.min(...arr) : 0;
                        };
                        const valueIsLowestForFocelda = () => {
                            const arr: number[] = [];
                            for (let i = 0; i < prop__.length; i++) {
                                const x = prop__[i];
                                const value = parseFloat(elm?.[x]);
                                if (!propriety.exclude.includes(value)) arr.push(value);
                                else arr.push(0);
                            }
                            return Math.min(...arr);
                        };
                        const foceldaValue = valueIsLowestForFocelda();
                        for (const key in elm?.Fornitori || {}) {
                            const valueToCompare = valueIsLowestForDist(key);
                            if (!propriety.exclude.includes(valueToCompare)) {
                                // eslint-disable-next-line no-eval
                                if (eval(foceldaValue + propriety.cond + valueToCompare)) {
                                    return propriety.true;
                                }
                            }
                        }
                        ret = propriety.false;
                        break;
                    }
                    case 'func':
                        ret = Boolean(propriety.prop()) ? propriety.true : propriety.false;
                        break;
                    default:
                        ret = undefined;
                }
                return ret;
            }
            return colIndex?.color;
        },
        [elm, colIndex]
    );

    const fromatDateFunc = (type: string, text: any) => {
        let formatedText = text;
        switch (type) {
            case 'ibmi':
            case 'ibm':
                if (text) {
                    const formated = text.toString();
                    const year = formated.slice(0, 2);
                    const month = formated.slice(2, 4);
                    const day = formated.slice(4, 6);
                    formatedText = `${day}/${month}/${year}`;
                }
                break;
            case 'YYYYMMDD':
                if (text) {
                    const formated = text.toString();
                    const year = formated.slice(0, 4);
                    const month = formated.slice(4, 6);
                    const day = formated.slice(6, 8);
                    formatedText = `${day}/${month}/${year}`;
                }
                break;
            case 'custom':
                if (colIndex.format) {
                    formatedText = colIndex.format(text);
                }
            default:
                formatedText = new Date(text).toLocaleString();
                break;
        }
        return formatedText;
    };

    function getNestedProperty<T = any>(obj: any, path: string): T | null {
        if (typeof path === 'string') {
            if (!path.includes('.')) {
                if (obj == null || obj == undefined) return null;
                return obj[path] as T;
            }
            const keys = path.split('.');
            return keys.reduce<any>((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);
        }
        return null;
    }

    //aggiunto helper per leggere icona sia in stringa che in ReactNode
    // helper: costruisce nodo icona + tooltip react-tooltip + (facoltativo) title nativo
    const withIconAndTooltip = (content: React.ReactNode, fieldInColumns?: any, fallbackText?: string | number | null) => {
        const iconElement = fieldInColumns?.icon
            ? fieldInColumns.icon
            : (fieldInColumns?.icons
                ? <i className={fieldInColumns.icons} aria-hidden="true" />
                : null);

        const tooltipText =
            fieldInColumns?.onHover
                ? (fieldInColumns?.title ?? fieldInColumns?.ariaLabel ?? (fallbackText != null ? String(fallbackText) : undefined))
                : undefined;

        const tooltipProps = fieldInColumns?.onHover
            ? {
                'data-tooltip-id': 'general-vi-table-virtualized-tooltip',
                'data-tooltip-content': tooltipText,
                title: tooltipText, // fallback nativo
            }
            : {};

        if (!iconElement && !fieldInColumns?.onHover) {
            return content;
        }

        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} {...tooltipProps}>
                {iconElement && <span className="cell-prefix-icon" style={{ display: 'inline-flex' }}>{iconElement}</span>}
                {content}
            </span>
        );
    };

    const ManageData = ({
        type,
        key,
        secKey,
        preText_,
        style,
        fieldInColumns,
    }: {
        type?: string;
        key?: string;
        secKey?: string;
        preText_?: any;
        style?: { sx?: any; sx_children?: any };
        fieldInColumns?: any;
    }) => {
        const key_ = key || colIndex.key;
        const secKey_ = secKey || colIndex.secKey;
        const baseTextSx = {
            width: '100%',
            minWidth: 0,
            fontSize: 'min(calc(0.50vw + 0.50vh), 15px)',
        };

        const text = preText_ ?? data[index]?.[colIndex.key];
        let text_: React.ReactNode = (
            <MDTypography variant="body2" sx={{ ...baseTextSx, ...(colIndex?.sxText || {}) }}>
                {colIndex.secKey ? data[index]?.[colIndex.key]?.[colIndex.secKey] : text}
            </MDTypography>
        );

        const isValid = (v: any) => v !== null && v !== undefined;

        if (type) {
            switch (type) {
                case 'eur':
                    if (fieldInColumns?.info) {
                        // blocco informativo complesso (non usato per Keepa)
                        text_ = <InfoBlock field={fieldInColumns} />;
                    } else {
                        const hasValue = !secKey_
                            ? isValid(getNestedProperty(data[index], key_))
                            : isValid(getNestedProperty(data[index], key_)) &&
                            isValid(getNestedProperty(getNestedProperty(data[index], key_) as any, secKey_ as string));
                        if (hasValue) {
                            if (colIndex?.key && (colIndex.key as any)?.multiplay) {
                                const val = (colIndex.key as any).multiplay.reduce(
                                    (acc: number, currentValue: string) => acc * elm[currentValue],
                                    1
                                );
                                const displayed = NumberToEuro({ convert: (val ?? 0) as number });
                                text_ = withIconAndTooltip(
                                    <MDTypography variant="body2" sx={{ fontSize: 'min(calc(0.50vw + 0.50vh), 15px)' }}>
                                        {displayed}
                                    </MDTypography>,
                                    fieldInColumns,
                                    displayed
                                );
                            } else {
                                const v1 = !secKey_
                                    ? (getNestedProperty<number | null>(data[index], key_) ?? 0)
                                    : (getNestedProperty<number | null>(
                                        getNestedProperty<any>(data[index], key_) as any,
                                        secKey_ as string
                                    ) ?? 0);
                                const displayed = NumberToEuro({ convert: v1 });
                                text_ = withIconAndTooltip(
                                    <MDTypography variant="body2" sx={{ fontSize: 'min(calc(0.50vw + 0.50vh), 15px)' }}>
                                        {displayed}
                                    </MDTypography>,
                                    fieldInColumns,
                                    displayed
                                );
                            }
                        } else {
                            text_ = withIconAndTooltip(
                                <span className="text-gray-400 dark:text-gray-500">/</span>,
                                fieldInColumns,
                                '/'
                            );
                        }
                    }
                    break;

                case 'date':
                    const dateType = colIndex.dateType as string;
                    const displayed = fromatDateFunc(dateType, text);
                    text_ = withIconAndTooltip(
                        <MDTypography variant="body2" sx={{ fontSize: 'min(calc(0.50vw + 0.50vh), 15px)' }}>
                            {displayed}
                        </MDTypography>,
                        fieldInColumns,
                        displayed
                    );
                    break;

                case 'tag':
                    text_ = <TagDist
                        value={textData || []}
                        showProps={colIndex.showProps}
                        tableOfColors={colIndex.tableOfColors ?? []}
                        pointOfColor={colIndex.pointOfColor ?? false} />;
                    break;

                case 'checkbox':
                    if (colIndex.onChange !== undefined) {
                        text_ = (
                            <Checkbox
                                checked={Boolean(elm.checkbox)}
                                onChange={(e) => colIndex.onChange({ index, bool: e.target.checked })}
                                sx={{ '& svg': { border: '0.0625rem solid #9fa3a7 !important' } }}
                            />
                        );
                    } else {
                        console.error('Sembra che tu non abbia definito: value o onChange, nella tipologia della colonna');
                    }
                    break;

                case 'promo':
                    const keyName = key as string | undefined;
                    const val = keyName ? elm[keyName] : undefined;
                    text_ = (
                        <MDTypography variant="body2" sx={fieldInColumns?.sx} style={{ fontSize: 12 }}>
                            {!fieldInColumns?.conditionToHide?.includes(val) ? (
                                <Tooltip title={'Fine Promo: ' + (formatData(elm.FinePromo) || 'Data fine Promo non definita')}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <LocalOfferOutlinedIcon sx={{ marginRight: 0.5 }} />
                                        {fieldInColumns?.formatedData && elm.FinePromo
                                            ? formatData(elm.FinePromo) || <AllInclusiveOutlinedIcon />
                                            : elm.FinePromo || <AllInclusiveOutlinedIcon />}
                                    </span>
                                </Tooltip>
                            ) : (
                                <span />
                            )}
                        </MDTypography>
                    );
                    break;

                case 'users_avatar':
                    const users = colIndex.secKey ? data[index]?.[colIndex.key]?.[colIndex.secKey] : text;
                    if (!users || !(Array.isArray(users)) || (users && Array.isArray(users) && users.length === 0)) {
                        text_ = <span className='text-xs text-gray-400 dark:text-gray-600'>
                            Nessun utente
                        </span>;
                    } else {
                        text_ = (
                            <div className='flex -space-x-3 items-center justify-center'>
                                {users.slice(0, 3).map((u, i) => (
                                    <UserAvatar key={i} src={u.immagini?.avatar} name={u.nome} textSize="xs"
                                        cognome={u.cognome} size={8} cover={{ src: u.immagini?.cover, active: true }} bio={u.biografia} />
                                ))}
                                {users.length > 3 && (
                                    <span className="text-xs p-1 ml-4">+{users.length - 3} altri</span>
                                )}
                            </div>
                        )
                    }

                    break;

                case 'custom':
                    text_ = colIndex?.render
                        ? colIndex.render({ elm, index })
                        : <span className="text-red-500 text-[11px]">Errore: funzione di render non definita</span>;
                    break;

                case 'number':
                    {
                        const okNum =
                            !secKey_
                                ? isValid(getNestedProperty(data[index], key_))
                                : isValid(getNestedProperty(data[index], key_)) &&
                                isValid(getNestedProperty(getNestedProperty<any>(data[index], key_) as any, secKey_ as string));

                        if (okNum) {
                            const valNum =
                                !secKey_
                                    ? getNestedProperty<any>(data[index], key_)
                                    : getNestedProperty<any>(getNestedProperty<any>(data[index], key_) as any, secKey_ as string);

                            const parsed = Number(valNum);
                            const displayed = Number.isFinite(parsed)
                                ? parsed.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : (valNum?.toString?.() ?? '');

                            text_ = withIconAndTooltip(
                                <MDTypography
                                    variant="body2"
                                    sx={{ ...baseTextSx, ...(style?.sx_children || {}) }}
                                >
                                    {displayed}
                                </MDTypography>,
                                fieldInColumns,
                                displayed
                            );
                        } else {
                            text_ = withIconAndTooltip(
                                <span className="text-gray-400 dark:text-gray-500">/</span>,
                                fieldInColumns,
                                '/'
                            );
                        }
                    }
                    break;

                default:
                    const ok =
                        !secKey_
                            ? isValid(getNestedProperty(data[index], key_))
                            : isValid(getNestedProperty(data[index], key_)) &&
                            isValid(getNestedProperty(getNestedProperty<any>(data[index], key_) as any, secKey_ as string));

                    if (ok) {
                        const val =
                            !secKey_
                                ? getNestedProperty<any>(data[index], key_)
                                : getNestedProperty<any>(getNestedProperty<any>(data[index], key_) as any, secKey_ as string);

                        const displayed = (val?.toString?.() ?? '') + (type === 'pz' ? ' pz' : '');
                        text_ = withIconAndTooltip(
                            <MDTypography
                                variant="body2"
                                sx={{ ...baseTextSx, ...(style?.sx_children || {}) }}
                            >
                                {displayed}
                            </MDTypography>,
                            fieldInColumns,
                            displayed
                        );
                    } else {
                        text_ = withIconAndTooltip(
                            <span className="text-gray-400 dark:text-gray-500">/</span>,
                            fieldInColumns,
                            '/'
                        );
                    }
                    break;
            }
        }

        return text_;
    };

    const ManageDataDistributors = ({
        index,
        type,
        sx,
        e,
    }: {
        index: number;
        type: string;
        sx?: any;
        e: any;
    }) => {
        const { conditionToHide } = e;
        const product = elm?.[colIndex.key]?.[colIndex.distributor];
        let ret_: React.ReactNode = null;

        if (!product && type !== 'icons') {
            return (
                <MDTypography key={index} variant="body2" sx={sx} style={{ fontSize: '0.7em' }}>
                    <span style={{ color: '#b4b4b4' }}>/</span>
                </MDTypography>
            );
        }


        switch (type) {
            case 'pz':
                ret_ = <MDTypography key={index} variant="body2" sx={sx} style={{ fontSize: '0.7em' }}>
                    {conditionToHide !== undefined &&
                        Boolean(conditionToHide.includes(product.Prezzo) && conditionToHide.includes(product.PrezzoListino))
                        ? null
                        : (product[e.key] || 0) + ' pz'}</MDTypography>;
                break;

            case 'eur':
                ret_ = <MDTypography key={index} variant="body2" sx={sx} style={{ fontSize: '0.7em' }}>{Array.isArray(e.key) ? (
                    <TypeSupplierEur
                        e={e}
                        elm={data[indexOnData]}
                        indexRow={indexOnData}
                        colIndex={colIndex}
                        addZeroes={addZeroes}
                        addingValue={addingValue}
                    />
                ) : e.conditionToHide !== undefined && (product.Prezzo === 0 || product.PrezzoListino === 0) ? (
                    !e.conditionToHide.includes(product[e.key]) ? (
                        addZeroes(product[e.key], product.Siae, product.Raee)
                    ) : (
                        <span style={{ color: '#b4b4b4' }}>/</span>
                    )
                ) : (
                    addZeroes(product[e.key], product.Siae, product.Raee)
                )}</MDTypography>;
                break;

            case 'number':
                ret_ = <MDTypography key={index} variant="body2" sx={sx} style={{ fontSize: '0.7em' }}>{(() => {
                    const raw = product[e.key];
                    const num = Number(raw);
                    if (Number.isFinite(num)) return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (raw ?? '').toString();
                })()}</MDTypography>;
                break;

            case 'tax':
                ret_ =
                    defineElements(product, e.elmToTake, e.conditionToHide) && (
                        <Tooltip
                            title={
                                <Stack>
                                    <Stack>
                                        <MDTypography style={{ textAlign: 'center', marginTop: '0.3em', fontSize: '1em', color: '#fff' }} component="p">
                                            Siae: {addZeroes(product.Siae)}
                                        </MDTypography>
                                    </Stack>
                                    <Stack>
                                        <MDTypography style={{ textAlign: 'center', marginTop: '0.3em', fontSize: '1em', color: '#fff' }} component="p">
                                            Raee: {addZeroes(product.Raee)}
                                        </MDTypography>
                                    </Stack>
                                </Stack>
                            }
                        >
                            <span>Tasse Incl.</span>
                        </Tooltip>
                    );
                break;

            case 'promo':
                ret_ = !e.condition.includes(product[e.key]) ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}
                        className='text-xs'
                        data-tooltip-id="general-vi-table-virtualized-tooltip"
                        data-tooltip-content={!e.condition.includes(product.FinePromo) ? 'Fine Promo: ' + formatData(product.FinePromo) : 'Data fine Promo non definita'}>
                        <LocalOfferOutlinedIcon sx={{ marginRight: 0.5 }} />
                        {formatData(product.FinePromo) || <AllInclusiveOutlinedIcon />}
                    </span>
                ) : null;
                break;

            case 'icons':
                ret_ = <FDIconButton icon={e.icon} onClick={e.funcAction} className='self-center' data-tour={e.dataTour} />
                break;

            default:
                ret_ = <MDTypography key={index} variant="body2" sx={sx} style={{ fontSize: '0.7em' }}>{product[e.key] || 0}</MDTypography>;
                break;
        }

        return ret_;
    };

    if (Array.isArray(colIndex.key)) {
        return (
            <Stack
                sx={{ backgroundColor: retriveBoxColor(colIndex?.color), ...centeredCellStyle, ...(colIndex.sx || {}) }}
                style={{ minWidth: 100, height: '100%', padding: '10px', justifyContent: 'center', width: colIndex.width }}
            >
                {colIndex.type !== 'supplier' ? (
                    colIndex.type !== 'info' ? (
                        colIndex.type !== 'multiple' ? (
                            colIndex.type !== 'multipleKeepa' ? (
                                colIndex.type !== 'commentsAllert' ? (
                                    colIndex.key.map((multicolumn: string, j: number) =>
                                        colIndex?.fieldToTake?.map((finalRow: any, t: number) => {
                                            const jsonElement = getNestedProperty(getNestedProperty(elm, multicolumn) as any, finalRow.key);
                                            return (
                                                <MDTypography
                                                    key={t + j}
                                                    variant="body2"
                                                    sx={{ fontSize: 'min(calc(0.50vw + 0.50vh), 15px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                >
                                                    {finalRow.showTitle && finalRow.key + ': '}
                                                    {ManageData({ type: finalRow.type, key: multicolumn, secKey: finalRow.key, preText_: jsonElement })}
                                                </MDTypography>
                                            );
                                        })
                                    )
                                ) : (
                                    elm?.Comments?.length > 0 && (
                                        <Badge sx={{ color: '#38304e' }} badgeContent={elm.Comments?.length} color="primary" max={999} style={{ alignSelf: 'center' }}>
                                            <ForumOutlinedIcon sx={{ fontSize: '2em !important' }} />
                                        </Badge>
                                    )
                                )
                            ) : (
                                colIndex.fieldToTake
                                    .filter((x: any) => x.hideInRow !== true)
                                    .map((field: any, x: number) =>
                                        ManageData({
                                            type: field.type,
                                            key: field?.key,
                                            secKey: field?.secKey,
                                            style: { sx: field?.sx, sx_children: field?.sxText },
                                            fieldInColumns: field,
                                        })
                                    )
                            )
                        ) : (
                            colIndex.fieldToTake.filter((elm: any) => elm.hideInRow !== true).map((field: any, x: number) => {
                                return ManageData({
                                    type: field.type, key: field?.key, secKey: field?.secKey, style: {
                                        sx: field?.sx,
                                        sx_children: field?.sxText
                                    },
                                    fieldInColumns: field
                                })
                            })
                        )
                    ) : (
                        <TypeInfo elm={elm} colIndex={colIndex} indexRow={index} allData={data} handleOpenMenu={handleOpenMenu} />
                    )
                ) : (
                    colIndex.fieldToTake.map((e: any, j: number) => ManageDataDistributors({ index: j, type: e.type, sx: e.sx, e }))
                )}
            </Stack>
        );
    } else {
        let addingStyle: React.CSSProperties = {};
        if (blockCondition) {
            // eslint-disable-next-line no-eval
            if (eval(blockCondition.condition)) {
                Object.assign(addingStyle, { backgroundColor: blockCondition.bg });
            }
        };

        const commonStyle: React.CSSProperties = {
            ...addingStyle,
            ...centeredCellStyle,
            ...(colIndex.sx || {}),
            height: '100%',
            padding: 10,
            justifyContent: 'center',
            width: colIndex.width,
            minWidth: 100,
        };

        // se la colonna definisce una funzione render, la usiamo e basta
        if (typeof colIndex.render === 'function') {
            return (
                <Stack
                    sx={{ backgroundColor: retriveBoxColor(colIndex?.color) }}
                    style={commonStyle}
                >
                    {colIndex.render({
                        row: elm,
                        elm,
                        value: textData,
                        index,
                        allData: data,
                        data,
                        column: colIndex,
                    })}
                </Stack>
            );
        }

        return (
            <Stack
                sx={{ backgroundColor: retriveBoxColor(colIndex?.color) }}
                style={commonStyle}
                data-tooltip-content={typeof colIndex?.onHover === 'boolean' ? textData : colIndex?.onHover}
                data-tooltip-id="general-vi-table-virtualized-tooltip"
            >
                {ManageData({
                    type: colIndex.type,
                    key: colIndex?.key,
                    secKey: colIndex?.secKey,
                    style: { sx: colIndex?.sx, sx_children: colIndex?.sxText }
                })}
            </Stack>
        );
    }
};

export default RetrieveElement;
