import React, { memo } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MDTypography from 'components/MDTypography';

import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import MinLoader from '../../../../minLoader';

type FooterTableProps = {
    resultsMax: number;
    currentResultsLoad: number;
    /** Totale magazzino (formattato o numerico). Se falsy non viene mostrato. */
    totWarehouse?: number | string | null | undefined;
    /** Se true mostra il loader. */
    loadMoreElementsStatus?: boolean;
};

function FooterTable({
    resultsMax,
    currentResultsLoad,
    totWarehouse,
    loadMoreElementsStatus,
}: FooterTableProps): JSX.Element {
    return (
        <Stack direction="row" p={1} alignItems="center" borderTop="1px solid #ccc">
            {totWarehouse && (
                <Stack direction="row" gap={1}>
                    <Tooltip title="Totale € dei prodotti in magazzino">
                        <WarehouseOutlinedIcon />
                    </Tooltip>
                    <MDTypography component="p" variant="body2" sx={{ fontSize: '0.7em' }}>
                        {totWarehouse}
                    </MDTypography>
                </Stack>
            )}

            <Stack direction="row" gap={3} sx={{ marginLeft: 'auto', alignItems: 'center' }}>
                {loadMoreElementsStatus && (
                    <MinLoader color="#ccc" width="auto" sx={{ margin: '0 !important' }} />
                )}
                <MDTypography component="p" variant="body2" sx={{ fontSize: '0.7em' }}>
                    {currentResultsLoad} di {resultsMax}
                </MDTypography>
            </Stack>
        </Stack>
    );
}

export default memo(FooterTable);
