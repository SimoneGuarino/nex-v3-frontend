import React, { memo } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import type { SxProps, Theme } from '@mui/material/styles';

export type ActionItem = {
    title: string;
    key: string;
    /** Firma generica per restare fedeli al codice originale (può essere chiamata con (indexRow, allData) o (event, elm)). */
    funcAction: (a: any, b: any) => void;
    ariaLabel?: string;
    onHoverColor?: string;
    icon: React.ReactNode;
    sx?: SxProps<Theme>;
};

type ColIndex = {
    fieldToTake: ActionItem[];
    sx?: SxProps<Theme>;
};

type RowElm = {
    Comments?: unknown[];
    [k: string]: unknown;
};

type TypeSupplierEurProps = {
    colIndex: ColIndex;
    indexRow: number;
    allData: any; // lasciato intenzionalmente generico per fedeltà
    elm: RowElm;
    handleOpenMenu?: (...args: any[]) => void; // opzionale, per compatibilità con il codice originale
};

function TypeSupplierEur({
    colIndex,
    indexRow,
    allData,
    elm,
}: TypeSupplierEurProps): JSX.Element {
    return (
        <Stack
            direction="row"
            width="100%"
            gap={1.5}
            height="100%"
            sx={colIndex.fieldToTake[indexRow]?.sx}
            style={{ overflow: 'hidden', alignItems: 'center' }}
        >
            <Stack sx={colIndex.sx}>
                {colIndex.fieldToTake.map((data, index) => {
                    return (
                        <Tooltip key={index} title={data.title} disableInteractive>
                            <IconButton
                                onClick={(e) => {
                                    if (data.key !== 'Comments') {
                                        return data.funcAction(indexRow, allData);
                                    } else {
                                        return data.funcAction(e, elm);
                                    }
                                }}
                                aria-label={data.ariaLabel}
                                sx={{ padding: '5px', '&:hover': { backgroundColor: data.onHoverColor, color: '#fff' } }}
                            >
                                {data.icon}
                            </IconButton>
                        </Tooltip>
                    );
                })}
            </Stack>

            {elm.Comments?.length ? (
                <Badge
                    sx={{ color: '#38304e' }}
                    badgeContent={elm.Comments.length}
                    color="primary"
                    max={999}
                    style={{ alignSelf: 'center' }}
                >
                    <ForumOutlinedIcon sx={{ fontSize: '2em !important' }} />
                </Badge>
            ) : null}
        </Stack>
    );
}

export default memo(TypeSupplierEur);
