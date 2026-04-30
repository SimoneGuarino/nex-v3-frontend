import React, { memo, useContext } from 'react';

import { UserContext } from 'context/UserContext';
import { useFiltersContext } from 'context/filtersContext';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MDTypography from 'components/MDTypography';

import VirtualizedBuyerFilter from './virtualizedBuyerFilter';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { UserState } from 'types/UserContext';

// ---------------------- tipi locali utili ----------------------
type Buyer = {
    _id: string;
    nome: string;
    cognome: string;
};

type ApiResponse = {
    data: Buyer[];
};

type UserDetails = {
    ruolo: string;
    permissions: Record<string, unknown>;
};


// ---------------------- componente ----------------------
function AdminFilter() {
    const {
        setBuyerTarget,
        buyerTargetObject,
        setBuyerTargetObject,
    } = useFiltersContext();
    const { globalData } = useGeneralDataContext();
    // tipizzo il contesto utente con il minimo indispensabile
    const [userContext] = useContext(UserContext) as unknown as [
        UserState,
        React.Dispatch<UserState>
    ];

    // se i dettagli utente non sono ancora disponibili, non renderizzo nulla
    if (!userContext?.details) return null;

    const canShow = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions,
        panelToCheck: 'comparatore',
        where: 0,
    });

    if (!canShow) return null;

    return (
        <Stack sx={{ width: 'inherit' }}>
            <Divider style={{ background: '#ccc', width: '100%' }} />
            <Stack width="100%" mb={2}>
                <MDTypography variant="h6">Filtri per Admin</MDTypography>
                <MDTypography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    Impersona un buyer selezionandolo dalla lista, in modo tale da vedere i
                    prodotti assegnati
                </MDTypography>
            </Stack>

            <VirtualizedBuyerFilter
                userContext={userContext}
                data={globalData.buyers as Buyer[] ?? []}
                setBuyerTarget={setBuyerTarget}
                setBuyerTargetObject={setBuyerTargetObject}
                buyerTargetObject={buyerTargetObject}
            />
        </Stack>
    );
}

export default memo(AdminFilter);
