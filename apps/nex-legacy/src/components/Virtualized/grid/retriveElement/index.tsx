//src\components\Virtualized\grid\retriveElement\index.tsx
import React, { Fragment, memo } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from 'components/MDTypography';

import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';

import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AllInclusiveOutlinedIcon from '@mui/icons-material/AllInclusiveOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

import TypeSupplierEur from './conditions/type_supplier_eur';
import TypeInfo, { type ActionItem } from './conditions/type_info';

import type { SxProps, Theme } from '@mui/material/styles';

// alias: SxProps senza null
type SafeSx = Exclude<SxProps<Theme>, null>;

// tipi per fieldToTake nei vari casi
type EurKeyItem = { key: string };

type SupplierFieldEUR = {
    type: 'eur';
    key: string | EurKeyItem[];                 // se è array, viene passato a <TypeSupplierEur />
    sx?: SafeSx;
    conditionToHide?: any[];
};

type SupplierFieldPZ = {
    type: 'pz';
    key: string;
    sx?: SafeSx;
    conditionToHide?: any[];
};

type SupplierFieldTAX = {
    type: 'tax';
    key?: string;
    sx?: SafeSx;
};

type SupplierFieldPROMO = {
    type: 'promo';
    key: string;
    condition: any[];                            // lista valori che disabilitano la promo
    formatedData?: string;                       // pattern formattazione, passato a formatData
    sx?: SafeSx;
};

type SupplierFieldDEFAULT = {
    type?: 'default';
    key: string;
    sx?: SafeSx;
};

type MultipleKeepaField = {
    key: string;
    icons: string;
};

type MultipleField = {
    type?: 'default' | 'eur' | 'promo' | 'avatar';
    key: string;
    sx?: SafeSx;
    hideInRow?: boolean;
    condition?: any;
    info?: { multiplay: string[]; sx?: SafeSx };
};

type ColConfig = {
    key: string | string[];
    label?: string;                              // usata nei rami supplier/eur
    sx?: SafeSx;
    labelsx?: React.CSSProperties;
    width?: number | string;
    color?: string;
    type?:
    | 'supplier'
    | 'info'
    | 'multiple'
    | 'multipleKeepa'
    | 'commentsAllert'
    | 'eur'
    | string;
    fieldToTake?: Array<
        | SupplierFieldEUR
        | SupplierFieldPZ
        | SupplierFieldTAX
        | SupplierFieldPROMO
        | SupplierFieldDEFAULT
        | MultipleField
        | MultipleKeepaField
    >;
};

type RowData = {
    CodiceProduttore?: string;
    FinePromo?: any;
    Comments?: any[];
    Prezzo?: number;
    [k: string]: any; // struttura dinamica
};

type RetriveElementProps = {
    columns: ColConfig[];
    columnIndex: number;
    data: RowData[];
    elm: RowData;                                 // elemento della riga corrente
    index: number;                                // indice riga (non usato, mantenuto per fedeltà)
    handleOpenMenu: (...args: any[]) => void;
    addZeroes: (...args: any[]) => React.ReactNode;
    formatData: (format: any, value: any) => React.ReactNode;
};

// colori pastello deterministici dal nome
function stringToColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        // eslint-disable-next-line no-bitwise
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    const saturation = 50;
    const lightness = 70;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// iniziali per avatar (stessa logica dell’originale)
function stringAvatar(name: string) {
    const parts = name.split(' ');
    const splitName =
        parts.length < 2
            ? (parts[0]?.[0] ?? '') + (parts[0]?.[2] ?? '')
            : (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
    return {
        sx: { bgcolor: stringToColor(name) },
        children: splitName.toUpperCase(),
    };
}

function RetriveElement({
    columns,
    data,
    elm,
    index,
    handleOpenMenu,
    columnIndex,
    addZeroes,
    formatData,
}: RetriveElementProps): JSX.Element {
    const colIndex = columns[columnIndex];
    const indexOnData = data.findIndex((e) => e.CodiceProduttore === elm.CodiceProduttore);

    // la row presenta più elementi
    if (Array.isArray(colIndex.key)) {
        return (
            <Stack
                sx={{ ...colIndex.sx, backgroundColor: colIndex?.color }}
                style={{ minWidth: 100, height: '100%', padding: '0 10px', width: colIndex.width as any }}
            >
                {colIndex.type !== 'supplier' ? (
                    colIndex.type !== 'info' ? (
                        colIndex.type !== 'multiple' ? (
                            colIndex.type !== 'multipleKeepa' ? (
                                colIndex.type !== 'commentsAllert' ? (
                                    // default: mappa le chiavi nella cella
                                    (colIndex.key as string[]).map((multicolumn, j) => (
                                        <Tooltip key={j} title={elm[multicolumn]} disableInteractive>
                                            <MDTypography
                                                component="p"
                                                variant="body2"
                                                sx={{
                                                    fontSize: 'min(calc(0.50vw + 0.50vh), 15px)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {elm[multicolumn]}
                                            </MDTypography>
                                        </Tooltip>
                                    ))
                                ) : (
                                    (elm.Comments?.length ?? 0) > 0 && (
                                        <Badge
                                            sx={{ color: '#38304e' }}
                                            badgeContent={elm.Comments?.length}
                                            color="primary"
                                            max={999}
                                            style={{ alignSelf: 'center' }}
                                        >
                                            <ForumOutlinedIcon sx={{ fontSize: '2em !important' }} />
                                        </Badge>
                                    )
                                )
                            ) : (
                                // multipleKeepa — usa 'nested' invece di indicizzare con string[]
                                (colIndex.fieldToTake as MultipleKeepaField[]).map((field, t) => {
                                    const nested = (elm as any)[(colIndex as any).key] as
                                        | Array<Record<string, any>>
                                        | undefined;

                                    return (
                                        <MDTypography key={t} component="p" variant="body2" style={{ fontSize: '0.7em' }}>
                                            {nested !== undefined ? (
                                                nested[0] !== undefined && nested[0][field.key] !== 0 ? (
                                                    <Stack direction="row" alignItems="center" gap={1}>
                                                        <i className={field.icons}></i>
                                                        {addZeroes(nested[0][field.key])}
                                                    </Stack>
                                                ) : (
                                                    <span style={{ color: '#b4b4b4' }}>/</span>
                                                )
                                            ) : (
                                                <span style={{ color: '#b4b4b4' }}>/</span>
                                            )}
                                        </MDTypography>
                                    );
                                })
                            )
                        ) : (
                            // multiple
                            (colIndex.fieldToTake as MultipleField[])
                                .filter((f) => f.hideInRow !== true)
                                .map((field, x) => {
                                    return (
                                        <MDTypography key={x} component="p" variant="body2" sx={field.sx} style={{ fontSize: 12 }}>
                                            {field.type !== 'default' ? (
                                                field.type !== 'eur' ? (
                                                    field.type !== 'promo' ? (
                                                        field.type !== 'avatar' ? (
                                                            // default qui mostra "pz"
                                                            (elm as any)[field.key] + ' pz'
                                                        ) : (
                                                            // avatar
                                                            <Stack direction="row" gap={1}>
                                                                <Avatar
                                                                    {...stringAvatar(`${(elm as any)[field.key]}`)}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        width: '2.3em',
                                                                        height: '2.3em',
                                                                        fontSize: '1.4em',
                                                                        alignSelf: 'center',
                                                                    }}
                                                                />
                                                                <Stack>
                                                                    <MDTypography
                                                                        component="p"
                                                                        variant="body2"
                                                                        sx={{ fontSize: 'min(calc(0.70vw + 0.70vh), 15px)', fontWeight: 600 }}
                                                                    >
                                                                        {(elm as any)[field.key]}
                                                                    </MDTypography>
                                                                    <MDTypography component="p" variant="body2" sx={{ fontSize: 'min(calc(0.50vw + 0.50vh), 15px)' }}>
                                                                        #0001
                                                                    </MDTypography>
                                                                </Stack>
                                                            </Stack>
                                                        )
                                                    ) : ( // promo
                                                        (elm as any)[field.key] !== (field as any).condition ? (
                                                            <Tooltip title={'Fine Promo: ' + ((elm as any).FinePromo || 'Data fine Promo non definita')}>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                                    <LocalOfferOutlinedIcon sx={{ marginRight: 0.5 }} />
                                                                    {((elm as any).FinePromo || <AllInclusiveOutlinedIcon />)}
                                                                </span>
                                                            </Tooltip>
                                                        ) : null
                                                    )
                                                ) : (
                                                    // eur nel ramo multiple
                                                    field.info ? (
                                                        <Stack direction="row" gap={0.5} alignItems="center">
                                                            <Tooltip
                                                                title={
                                                                    addZeroes(
                                                                        field.info.multiplay.reduce((acc, k) => acc * (elm as any)[k], 1)
                                                                    ) as any
                                                                }
                                                            >
                                                                <InfoOutlinedIcon sx={field.info.sx} />
                                                            </Tooltip>
                                                            {addZeroes((elm as any)[field.key])}
                                                        </Stack>
                                                    ) : (
                                                        addZeroes((elm as any)[field.key])
                                                    )
                                                )
                                            ) : (
                                                (elm as any)[field.key]
                                            )}
                                        </MDTypography>
                                    );
                                })
                        )
                    ) : (
                        // info
                        <TypeInfo
                            elm={elm}
                            colIndex={{
                                // se manca fieldToTake (opzionale in ColConfig) forziamo un array vuoto
                                fieldToTake: ((colIndex.fieldToTake ?? []) as unknown as ActionItem[]),
                                // SafeSx è compatibile con SxProps<Theme>
                                sx: colIndex.sx,
                            }}
                            indexRow={indexOnData}
                            allData={data}
                            handleOpenMenu={handleOpenMenu}
                        />
                    )
                ) : (
                    // supplier
                    (colIndex.fieldToTake as Array<
                        SupplierFieldEUR | SupplierFieldPZ | SupplierFieldTAX | SupplierFieldPROMO | SupplierFieldDEFAULT
                    >)?.map((e, j) => (
                        <MDTypography key={j} component="p" variant="body2" sx={e.sx} style={{ fontSize: '0.7em' }}>
                            {e.type === 'pz' ? (
                                e.conditionToHide !== undefined &&
                                    ((elm as any)[colIndex.key as string][colIndex.label as string].Prezzo === 0 &&
                                        (elm as any)[colIndex.key as string][colIndex.label as string].PrezzoListino === 0) ? (
                                    !(e.conditionToHide as any[]).includes(
                                        (elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldPZ).key]
                                    ) ? (
                                        ((elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldPZ).key] || 0) + ' pz'
                                    ) : null
                                ) : (
                                    ((elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldPZ).key] || 0) + ' pz'
                                )
                            ) : e.type === 'eur' ? (
                                Array.isArray((e as SupplierFieldEUR).key) ? (
                                    <TypeSupplierEur e={e as any} elm={elm as any} colIndex={colIndex as any} addZeroes={addZeroes} />
                                ) : e.conditionToHide !== undefined &&
                                    ((elm as any)[colIndex.key as string][colIndex.label as string].Prezzo === 0 ||
                                        (elm as any)[colIndex.key as string][colIndex.label as string].PrezzoListino === 0) ? (
                                    !(e.conditionToHide as any[]).includes(
                                        (elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldEUR).key as string]
                                    ) ? (
                                        addZeroes(
                                            (elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldEUR).key as string],
                                            (elm as any)[colIndex.key as string][colIndex.label as string].Siae,
                                            (elm as any)[colIndex.key as string][colIndex.label as string].Raee
                                        )
                                    ) : (
                                        <span style={{ color: '#b4b4b4' }}>/</span>
                                    )
                                ) : (
                                    addZeroes(
                                        (elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldEUR).key as string],
                                        (elm as any)[colIndex.key as string][colIndex.label as string].Siae,
                                        (elm as any)[colIndex.key as string][colIndex.label as string].Raee
                                    )
                                )
                            ) : e.type === 'tax' ? (
                                ((elm as any)[colIndex.key as string][colIndex.label as string].Siae !== 0 ||
                                    (elm as any)[colIndex.key as string][colIndex.label as string].Raee !== 0) && (
                                    <Tooltip
                                        title={
                                            <Stack>
                                                <Stack>
                                                    <MDTypography
                                                        style={{ textAlign: 'center', marginTop: '0.3em', fontSize: '1em', color: '#fff' }}
                                                        component="p"
                                                    >
                                                        Siae: {addZeroes((elm as any)[colIndex.key as string][colIndex.label as string].Siae) as any}
                                                    </MDTypography>
                                                </Stack>
                                                <Stack>
                                                    <MDTypography
                                                        style={{ textAlign: 'center', marginTop: '0.3em', fontSize: '1em', color: '#fff' }}
                                                        component="p"
                                                    >
                                                        Raee: {addZeroes((elm as any)[colIndex.key as string][colIndex.label as string].Raee) as any}
                                                    </MDTypography>
                                                </Stack>
                                            </Stack>
                                        }
                                    >
                                        <span>Tasse Incl.</span>
                                    </Tooltip>
                                )
                            ) : e.type === 'promo' ? (
                                !(e as SupplierFieldPROMO).condition.includes(
                                    (elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldPROMO).key]
                                ) ? (
                                    <Tooltip
                                        title={
                                            !(e as SupplierFieldPROMO).condition.includes(
                                                (elm as any)[colIndex.key as string][colIndex.label as string].FinePromo
                                            )
                                                ? 'Fine Promo: ' + (formatData(
                                                    (e as SupplierFieldPROMO).formatedData,
                                                    (elm as any)[colIndex.key as string][colIndex.label as string].FinePromo
                                                ) as any)
                                                : 'Data fine Promo non definita'
                                        }
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <LocalOfferOutlinedIcon sx={{ marginRight: 0.5 }} />
                                            {(
                                                (e as SupplierFieldPROMO).formatedData !== undefined
                                                    ? (formatData(
                                                        (e as SupplierFieldPROMO).formatedData,
                                                        (elm as any)[colIndex.key as string][colIndex.label as string].FinePromo
                                                    ) as any)
                                                    : (elm as any)[colIndex.key as string][colIndex.label as string].FinePromo
                                            ) || <AllInclusiveOutlinedIcon />}
                                        </span>
                                    </Tooltip>

                                ) : null
                            ) : (
                                // default in supplier
                                ((elm as any)[colIndex.key as string][colIndex.label as string][(e as SupplierFieldDEFAULT).key] || 0)
                            )}
                        </MDTypography>
                    ))
                )}
            </Stack>
        );
    } else {
        // key singola
        return (
            <Stack
                style={{
                    ...(colIndex.labelsx || {}),
                    height: '100%',
                    padding: 10,
                    justifyContent: 'center',
                    width: colIndex.width as any,
                    minWidth: 100,
                }}
            >
                <MDTypography component="p" variant="body2" sx={{ fontSize: 'min(calc(0.50vw + 0.50vh), 15px)' }}>
                    {colIndex.type === 'eur' || colIndex.type?.toLowerCase() === 'euro'
                        ? (addZeroes((data[index] as any)[colIndex.key as string]) as any)
                        : (data[index] as any)[colIndex.key as string]}
                </MDTypography>
            </Stack>
        );
    }
}

export default memo(RetriveElement);
