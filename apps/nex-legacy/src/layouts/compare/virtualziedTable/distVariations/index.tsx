import React, { useContext, useEffect, useRef } from 'react';

import {
    Backdrop, Card, IconButton,
    Stack
} from '@mui/material';
import { icon_close } from 'config/icons';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { GeneralChart } from './Chart';
import { PriceVariationCard } from './components/PriceVariation';
import { StockVariation } from './components/StockVariation';
import { AggregatePriceStats } from './components/AggregatePriceStats';
import { TrendAndVolatility } from './components/TrendAndVolatility';
import { CoverageAndLeadTime } from './components/CoverageAndLeadTime';
import { AggregateStockStats } from './components/AggregateStockStats';
import { Tooltip } from 'react-tooltip';
import { Product } from 'config/interfaces';
import { DistributorSelect } from './components/DistributorSwitcher';
import { VariationDataAPI } from '../fetchData/variationData';
import { UserContext } from 'context/UserContext';
import { UserContextTypes } from 'types/user';
import { useTour } from "tour/TourProvider";

export type Variation = {
    _id: string;
    id_prodotto: string;
    disponibilita: number;
    distributore: { nome: string };
    prezzo: number;
    prezzo_listino: number;
    timestamp: string;
}

interface DistVariationsProps {
    status: boolean;
    product?: Product | null;
    distList: string[];
    onClose: () => void;
    loading: boolean;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    data: Variation[];
    setData: (prev: Variation[]) => void;
}
export const DistVariations: React.FC<DistVariationsProps> = ({ status, onClose, distList, product, loading, ChangeLoadStatus, data, setData }) => {
    const [userContext] = useContext(UserContext) as [UserContextTypes, React.Dispatch<React.SetStateAction<UserContextTypes>>];
    // Abort il panding del fetch all server
    const abortController = useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };
    const palette = MainTheme().palette;

    const [distributorActived, setDistributorActived] = React.useState<string>(distList[0] || '');

    // Effetto per il fetch dei dati
    useEffect(() => {
        if (!status) return;
        fetchData();

        return () => {
            cancelRequest();
            ChangeLoadStatus({ from: 'variance', bool: false });
        };
    }, [status]);

    const { isOpen: tourIsOpen, index: tourIndex } = useTour();
    const lockInteractions = tourIsOpen && (tourIndex === 23 || tourIndex === 24);
    const fetchData = (_dist?: string) => {
        if (tourIsOpen) { return };
        if (!product || !userContext || !userContext.token) {
            console.error("Product or user context is missing");
            return;
        };

        ChangeLoadStatus({ from: 'variance', bool: true });
        return VariationDataAPI({
            userContext,
            abortController,
            id_prodotto: product._id,
            _distributor: (_dist || distributorActived),
            setData,
            ChangeLoadStatus,
        })
    }

    const onChangeDistributor = (dist: string) => {
        setDistributorActived(dist);
        fetchData(dist);
    };


    return <Backdrop open={status} sx={{ zIndex: (theme: any) => theme.zIndex.drawer }}>
        <Card className="w-11/12 h-[90vh] max-w-6xl p-4 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md overflow-hidden" data-tour="comp-variaz-2">
            {lockInteractions && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: 'auto',
                    }}
                    onClickCapture={(e) => e.stopPropagation()}
                />
            )}
            <Stack direction='row' className='w-full !px-6 !pt-4'>
                <Stack direction='row' alignItems='center' className='w-full'>
                    {lockInteractions && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: 'auto',
                            }}
                            onClickCapture={(e) => e.stopPropagation()}
                        />
                    )}
                    <span data-tour="comp-variaz-3">
                        <DistributorSelect
                            distList={distList}
                            active={distributorActived}
                            onChange={onChangeDistributor}
                        /></span>
                    <div className="!w-px h-full !mx-4 bg-neutral-300 dark:!bg-neutral-600" />
                    <MDTypography variant='h4'>
                        Variazioni
                    </MDTypography>
                </Stack>

                <IconButton data-tour="modal-close" sx={{
                    ml: 'auto', height: 'min-content', backgroundColor: palette.error.light,
                    "&:hover": { backgroundColor: palette.error.dark }
                }} onClick={onClose}>
                    {icon_close({ color: '#fff' })}
                </IconButton>
            </Stack>

            <div className="w-full h-px bg-neutral-300 dark:!bg-neutral-600 !my-4" />


            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto !p-6 animate-pulse">
                <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1" />
                <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1" />
                <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1" />
                <div className="col-span-3 grid gap-4">
                    <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                    <div className="h-40 bg-gray-200 dark:bg-neutral-700 rounded-md" />
                </div>
                <div className="h-86 col-span-3 bg-gray-200 dark:bg-neutral-700 rounded-md" />
            </div> :
                // Se il prodotto è selezionato, mostra le variazioni
                (product && data.length > 0) ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto !p-6">
                    <div className="col-span-1" data-tour="comp-variaz-prezzo">
                        <PriceVariationCard data={data} />
                    </div>
                    <div className="col-span-1" data-tour="comp-variaz-stock">
                        <StockVariation data={data} />
                    </div>

                    <div className="col-span-1 flex flex-col gap-4" data-tour="comp-variaz-trend">
                        <TrendAndVolatility data={data} />
                        <CoverageAndLeadTime data={data} />
                    </div>

                    <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-1 gap-4" data-tour="comp-variaz-prez-stock">
                        <AggregatePriceStats data={data} />
                        <AggregateStockStats data={data} />
                    </div>

                    <div className="col-span-1 lg:col-span-3" data-tour="comp-variaz-prez-disp">
                        <GeneralChart productName={product.CodiceProduttore} data={data} />
                    </div>
                </div> : <div className='flex items-center justify-center h-full w-full'>
                    <MDTypography variant='body2'>
                        Nessun dato di variazione disponibile per il prodotto e fornitore selezionato.
                    </MDTypography>
                </div>
            }

        </Card>
        <Tooltip id="general-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </Backdrop>
}