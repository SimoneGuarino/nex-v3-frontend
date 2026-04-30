import React from 'react';
import { Backdrop, IconButton, Stack } from '@mui/material';
import { icon_close } from 'config/icons';
import { UsersRequests } from '../../requests';
import { useMaterialUIController } from 'context/index';
import { MainTheme } from 'assets/settingsTheme';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';

interface DataClientToPassProps {
    _id: string;
    stato: 0 | 1 | 2,
    creata: {
        data: any;
        da: {
            username: string;
        };
        nota: string;
    };
    dettagli: {
        numeroOrdine: string;
        codiciFb?: Array<string>;
        cliente: {
            nome: string;
            codice: string;
            codiceIot: string
            email: string;
        };
    };
    dati: Array<any>;
    fido: {
        focelda: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
        iot: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
    };
    esito: {
        data: any;
        nota: string,
        da: {
            username: string;
        }
    };
};

interface DataClientProps {
    _id: string;
    stato: 0 | 1 | 2,
    codiceFb: string,
    codiciFb?: Array<string>,
    ordiniFb?: string,
    cliente: {
        nome: string;
        codice: string;
        codiceIot: string
        email: string;
    };
    creata: {
        data: any;
        nota: string;
        da: {
            _id: string;
            username: string;
        };
    },
    prodotti: {
        ordineTotale: number;
        dati?: any;
    }
    fido: {
        focelda: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
        iot: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
    };
    esito: {
        data: any;
        nota: string,
        da: {
            username: string;
        }
    }
};

interface OverviewProps {
    userContext: any;
    element: DataClientProps;
    overviewStatus: boolean;
    indexRowSelected: number;
    checkAdminDev: boolean;
    data: any;

    CloseOverview: () => void;
    setErr: (prev: boolean) => void;
    setData: (prev: any) => void;
    commentsPanelStatus?: boolean;
    openCommentsPanel?: () => void;
    closeCommentsPanel?: () => void;
    requestPanelStatus?: boolean;
    openRequestPanel?: () => void;
    closeRequestPanel?: () => void;
    isGroupedItems: any;
}
export const Overview: React.FC<OverviewProps> = ({ overviewStatus, element, indexRowSelected,
    setErr, userContext, CloseOverview, checkAdminDev, data, setData, commentsPanelStatus,
    openCommentsPanel,
    isGroupedItems,
    closeCommentsPanel, requestPanelStatus, openRequestPanel, closeRequestPanel
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const isGroup = (element.codiciFb && Array.isArray(element.codiciFb) && element.codiciFb.length > 0);

    const prepareObjToView: DataClientToPassProps = {
        _id: element._id,
        stato: element.stato,
        creata: element.creata,
        esito: element.esito,
        dettagli: {
            numeroOrdine: element.codiceFb,
            codiciFb: element?.codiciFb,
            cliente: element.cliente,
        },
        dati: (isGroup && element.ordiniFb) ? JSON.parse(element.ordiniFb) : JSON.parse(element.prodotti.dati),
        fido: {
            focelda: element.fido.focelda,
            iot: element.fido.iot
        }
    };


    return <Backdrop open={overviewStatus} sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Stack sx={{
            backgroundColor: `${darkMode ? '#1c1c1c' : palette.grey[300]}`, width: '90%', height: '90%', borderRadius: 5, p: 2,
            alignItems: 'center', overflow: 'auto', position: 'relative'
        }}>
            <UsersRequests setErr={setErr} userContext={userContext} elementToView={!isGroup ? prepareObjToView : null}
                groupToView={isGroup ? prepareObjToView : null}
                checkAdminDev={checkAdminDev}
                indexFromManagement={indexRowSelected} setDataFromManagement={setData} dataFromManagement={data} closeManagementOverview={CloseOverview} commentsPanelStatus={commentsPanelStatus}
                openCommentsPanel={openCommentsPanel}
                closeCommentsPanel={closeCommentsPanel}
                requestPanelStatus={requestPanelStatus}
                openRequestPanel={openRequestPanel}
                closeRequestPanel={closeRequestPanel} 
                isGroupedItems={isGroupedItems} />
        </Stack>
    </Backdrop>
}