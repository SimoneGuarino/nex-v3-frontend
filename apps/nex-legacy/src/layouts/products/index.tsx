//src\layouts\products\index.tsx
import React, { useContext, useEffect, useState, useRef, useCallback, Fragment } from "react";
import { SearchDataContext } from "../../context/SearchDataContext";
import { FiltersToSend } from "./filter/filtersToSend";

import { UserContext } from "../../context/UserContext";

//  components
import MDSnackbar from "components/MDSnackbar";
import Loader from "../../Loader";

//  Layouts components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import ErrorIMG from 'assets/images/5203299_trasparent.webp';

//Sistema logico per il fetch dei relativi dati
import { DataRetrive } from './virtualziedTable/fetchData/data';
import { CategoriesData } from './virtualziedTable/fetchData/categories';
import { CSVDataRequest } from "./virtualziedTable/fetchData/CSVDataRequest";

import { SendFilters } from "./virtualziedTable/fetchData/sendFilters";
import { Tooltip } from "react-tooltip";
import { FiltersPanel } from "./extraPanel/filters";
import { SearchBar } from "./extraPanel/searchBar";
import { Fade } from "@mui/material";
import { GeneralError } from "components/NoData/generalError";
import { OrderPanel } from "./extraPanel/makeOrder/order";
import { RetriveCookie, SaveCookie } from "utils/cookie";
import { Success } from "components/Success";
import { CookieCompareV3 } from "./utils/CookieData";
import { InfiniteScrollAPI } from "./fetchData/InfiniteScrollAPI";
import { enqueueSnackbar } from "components/MessageBox";
import { VirtualizedTable } from "./virtualziedTable";


interface ProductProps {
    productCode: string;
    title: string;
    avatar: any;
    codBuyer: string;
    category: string;
    brand: string;
    price: number;
    order: {
        quantity: number;
        total: number;
    }
}

const cookieName = 'productCart_'

export function Products() {
    const [success, setSuccess] = React.useState<boolean>(false); //Success Opereation
    const ChangeSuccessPanel = () => setSuccess(!success);
    const [userContext, setUserContext] = React.useContext<any>(UserContext);

    //contiene i dati dei prodotti inseriti nel carello.
    const [orderPanelStatus, setOrderPanelStatus] = React.useState<boolean>(false);
    const ChangeOrderPanelStatus = () => setOrderPanelStatus(!orderPanelStatus);
    const [cartData, setCartData] = React.useState<Array<ProductProps>>([]);
    const [clientSelected, setClientSelected] = React.useState(null);
    //stato che mantiene la data dell'ultimo retrive dei vari fornitori.
    const [lastDateDist, setLastDateDist] = useState([]);

    //___________________Dati relativi al compare/search
    const [searchDataContext, setSearchDataContext] = useContext<any>(SearchDataContext);
    const [brandSelected, setBrandSelected] = useState<any>(null);
    const [brandPrefix, setBrandPrefix] = useState<any>(null);
    const [categorySelected, setCategorySelected] = useState<any>(null);
    const [subcategorySelected, setSubCategorySelected] = useState<any>(null);

    //dedicato all'animazione di loading del'infinite scroll
    //const [transitionLoad, setTransitionLoad] = React.useState(true);
    const [transitionLoad, setTransitionLoad] = React.useState(false);
    const [mainLoad, setMainLoad] = useState(true);

    // Abort il panding del fetch all server
    const abortController = useRef<AbortController>(new AbortController());

    // id progressivo per riconoscere l'ultima richiesta (evita race tra risposte)
    const lastReqId = useRef(0);

    // prepara una nuova richiesta: abortisce la precedente e setta i loader
    const [impTableStatus, setImpTableStatus] = useState(false);

    function beginRequest() {
        if (abortController.current) {
            try { abortController.current.abort(); } catch { }
        }
        abortController.current = new AbortController(); // resta invariato il modo in cui lo passi ai fetch
        setTransitionLoad(true);  // blocca UI subito
        setImpTableStatus(true);  // blocca impostazioni tabella
        const reqId = ++lastReqId.current;
        return reqId;
    }

    // chiudi i loader SOLO se è ancora l'ultima richiesta partita
    function endRequest(reqId: number) {
        if (reqId === lastReqId.current) {
            setTransitionLoad(false);
            setImpTableStatus(false);
        }
    }

    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    const offset = React.useRef<number>(0);

    //dopo aver effutato la richiesta delle colonne difinisci uno stato di caricamento che non permette il click di altri
    //elementi nelle impostazioni tabella.


    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = useState(false);
    //--- Stato del Messaggio se aperto o meno
    const [errorSB, setErrorSB] = useState(false);
    const closeErrorSB = () => setErrorSB(false);
    const openErrorSB = (icon: string, message: string) => { setErrorSB(true); setDymIcon(icon); setError(message) };
    // --- Richiamando e settando uno di questi valori definisce il colore e l'icona in utilizzo dal pop-up
    const [dymIcon, setDymIcon] = useState("warning");
    //--- Messaggio di Errore
    const [error, setError] = useState("");
    const renderErrorSB = (
        <MDSnackbar
            color={dymIcon}
            icon={dymIcon}
            title="Focelda Dashboard"
            content={error}
            dateTime="1 sec fa"
            open={errorSB}
            onClose={closeErrorSB}
            close={closeErrorSB}
            bgWhite
        />
    );

    //tiene conto dello stato attuale dello stateHook
    const dataLengthRef = useRef(searchDataContext.dataLength);
    //variabile per il pannello dei suggerimenti nel campo di ricerca
    const [hintsBoxActive, setHintBoxActive] = useState(false);

    const ResetCookie = () => {
        SaveCookie({ name: cookieName, data: [] });
    }


    const CategoriesRetriveData = useCallback((queryColumns: string) => {
        if (transitionLoad) {
            enqueueSnackbar("Il sistema è impegnato in un’altra comunicazione al server, riprova tra poco.", {
                title: 'Ops..',
                type: 'info',
            });
            return;
        }

        const reqId = beginRequest();

        const ret: any = CategoriesData(
            setSearchDataContext,
            userContext,
            setMainLoad,
            abortController,
            queryColumns,
            setTransitionLoad
        );

        if (ret?.finally) {
            ret.catch?.(() => { }).finally(() => endRequest(reqId));
        }
    }, [userContext.details, transitionLoad]);


    // se DataRetrive/CategoriesData impostano mainLoad=false internamente,
    // qui chiudiamo la transizione solo se è ancora l'ultima richiesta
    useEffect(() => {
        if (!mainLoad) {
            endRequest(lastReqId.current);
        }
    }, [mainLoad]);

    useEffect(() => {
        if (userContext.details === undefined) { return; }
        const __dist: any = CookieCompareV3('stored_settings_prodotti');
        CategoriesRetriveData(__dist);

        RetriveCookie({ name: cookieName, setData: setCartData });

        return () => {
            cancelRequest();
        };
    }, [userContext.details]);

    const UpdateTablePrice = useCallback((query?: string) => {
        if (mainLoad) {
            enqueueSnackbar("Caricamento in corso, riprova tra poco.", { title: "Ops..", type: "info" });
            return;
        }
        // anti-spam: se c'è già una comunicazione in corso, informo e ignoro il click
        if (transitionLoad) {
            enqueueSnackbar("Il sistema è impegnato in un’altra comunicazione al server, riprova tra poco.", {
                title: 'Ops..',
                type: 'info',
            });
            return;
        }

        const reqId = beginRequest();

        const ret: any = DataRetrive(
            setSearchDataContext,
            userContext,
            setMainLoad,
            abortController,        // NON cambiamo le firme degli helper interni
            CategoriesRetriveData,
            setImpTableStatus,
            query,
            setErr
        );

        // se ritorna una Promise, chiudi i loader in .finally (single-flight)
        // se è davvero una Promise ha .finally; altrimenti salta
        if (ret?.finally) {
            ret.catch?.(() => { }).finally(() => endRequest(reqId));
        }
    }, [userContext.details, CategoriesRetriveData, mainLoad, transitionLoad]);



    const SendFiltersAPI_TAG = useCallback((query: string) => {
        if (mainLoad) {
            enqueueSnackbar("Caricamento in corso, riprova tra poco.", { title: "Ops..", type: "info" });
            return;
        }

        if (transitionLoad) {
            enqueueSnackbar("Il sistema è impegnato in un’altra comunicazione al server, riprova tra poco.", {
                title: 'Ops..',
                type: 'info',
            });
            return;
        }

        offset.current = 0;
        const reqId = beginRequest();

        const ret: any = SendFilters(
            setSearchDataContext,
            userContext,
            query,
            abortController,
            setTransitionLoad,
            offset
        );

        if (ret?.finally) {
            ret.catch?.(() => { }).finally(() => endRequest(reqId));
        }
    }, [userContext.details, mainLoad, transitionLoad]);

    const calcFilters = (obj?: any) => {
        const brandSelTAG_cond = obj?.setBrandSelected ? null : brandSelected;
        const prefixTAG_cond = obj?.setBrandPrefix ? null : brandPrefix;
        const categoryTAG_cond = obj?.setCategorySelected ? null : categorySelected;
        const subcategoryTAG_cond = obj?.setSubCategorySelected ? null : subcategorySelected;

        const query = FiltersToSend({
            brandSelected: brandSelTAG_cond,
            brandPrefix: prefixTAG_cond,
            categorySelected: categoryTAG_cond,
            subcategorySelected: subcategoryTAG_cond
        });

        return query;
    };

    const composeFiltersFunc = (from: string, obj?: any) => {
        if (mainLoad) {
            enqueueSnackbar("Caricamento in corso, riprova tra poco.", { title: "Ops..", type: "info" });
            return;
        }
        if (transitionLoad) {
            enqueueSnackbar("Il sistema è impegnato in un’altra comunicazione al server, riprova tra poco.", {
                title: 'Ops..',
                type: 'info',
            });
            return;
        }

        const query = calcFilters(obj);

        switch (from) {
            case "csv":
                CSVRequest(query);
                break;
            case 'changeBuyer':
                SendFiltersAPI_TAG(query);
                break;
            default:
                SendFiltersAPI_TAG(query);
                break;
        }
    };

    const CSVRequest = useCallback((query: string) => {
        if (mainLoad) {
            enqueueSnackbar("Caricamento in corso, riprova tra poco.", { title: "Ops..", type: "info" });
            return;
        }

        if (transitionLoad) {
            enqueueSnackbar("Il sistema è impegnato in un’altra comunicazione al server, riprova tra poco.", {
                title: 'Ops..',
                type: 'info',
            });
            return;
        }

        const reqId = beginRequest();

        const ret: any = CSVDataRequest(
            userContext,
            abortController,
            query
        );

        if (ret?.finally) {
            ret.catch?.(() => { }).finally(() => endRequest(reqId));
        }
    }, [userContext, mainLoad, transitionLoad]);

    useEffect(() => {
        dataLengthRef.current = searchDataContext.dataLength;
    }, [searchDataContext.dataLength])

    function DelFromCart(index: number) {
        setCartData((prev: any) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
        });
    }

    function ChangeValueOfQuantity(index: number, quantity: number) {
        setCartData((prev: Array<ProductProps>) => {
            const copy = [...prev];
            copy[index].order.quantity = quantity;
            copy[index].order.total = quantity * copy[index].price;
            return copy;
        })
    }

    React.useEffect(() => {
        SaveCookie({ name: cookieName, data: cartData })
    }, [cartData]);

    const infiniteScroll = () => {
        const reqId = beginRequest();

        const ret = InfiniteScrollAPI({
            userContext,
            abortController,
            query: calcFilters(),
            setData: setSearchDataContext,
            offset: offset.current
        });

        if ((ret as any)?.finally) {
            (ret as any).catch?.(() => { }).finally(() => endRequest(reqId));
        }
        return ret;
    };


    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div>
            <Loader />
        </div>
    ) : (
        <Fragment>
            <DashboardLayout>
                {!err ? <div className="flex flex-col h-full">
                    <FiltersPanel
                            brandSelected={brandSelected} setBrandSelected={setBrandSelected}
                            brandPrefix={brandPrefix} setBrandPrefix={setBrandPrefix}
                            categorySelected={categorySelected} setCategorySelected={setCategorySelected}
                            subcategorySelected={subcategorySelected} setSubCategorySelected={setSubCategorySelected}
                            searchDataContext={searchDataContext} composeFiltersFunc={composeFiltersFunc}
                            generalLoad={(mainLoad || transitionLoad)}
                        />
                        <SearchBar
                            hintsBoxActive={hintsBoxActive} setHintBoxActive={setHintBoxActive}
                            setTransitionLoad={setTransitionLoad} transitionLoad={transitionLoad}
                            openErrorSB={openErrorSB}
                            UpdateTablePrice={UpdateTablePrice} err={err} mainLoad={mainLoad} cartData={cartData}
                            setCartData={setCartData} ChangeOrderPanelStatus={ChangeOrderPanelStatus}
                            orderPanelStatus={orderPanelStatus} DelFromCart={DelFromCart} ChangeValueOfQuantity={ChangeValueOfQuantity}
                            successStatus={success}
                        />

                        {!err && !mainLoad && (
                            <Fade in={true}>
                                <div className="flex flex-col mt-2 h-full bg-white/90 dark:bg-neutral-900/80
                                backdrop-blur supports-[backdrop-filter]:backdrop-blur border border-black/5 dark:border-white/10
                                transition-all-css rounded-md"
                                >
                                    <VirtualizedTable
                                        data={(searchDataContext.dati || [])}
                                        setData={setSearchDataContext}
                                        results={searchDataContext.totale || (searchDataContext?.dati?.length ? searchDataContext?.dati?.length : 0)}
                                        totWarehouse={parseFloat(parseFloat(searchDataContext.warehouseToT).toFixed(2)).toLocaleString("it-IT") + "€"}
                                        lastDateDist={lastDateDist}
                                        UpdateTablePrice={UpdateTablePrice}
                                        impTableStatus={impTableStatus}
                                        setImpTableStatus={setImpTableStatus}
                                        cartData={cartData}
                                        setCartData={setCartData}
                                        infiniteScroll={{
                                            func: infiniteScroll,
                                            offset: offset
                                        }}
                                    />
                                    
                                </div>
                            </Fade>
                        )}
                </div> : <GeneralError img={ErrorIMG} />}
            </DashboardLayout>

            <OrderPanel
                cartData={cartData} orderPanelStatus={orderPanelStatus}
                ChangeOrderPanelStatus={ChangeOrderPanelStatus}
                cartDataEuroTotal={
                    cartData.reduce((accumulator: number, currentProduct: ProductProps) => {
                        return accumulator + currentProduct.order.total;
                    }, 0)
                }
                DelFromCart={DelFromCart} ChangeValueOfQuantity={ChangeValueOfQuantity}
                searchDataContext={searchDataContext} setClientSelected={setClientSelected}
                clientSelected={clientSelected} userContext={userContext} abortController={abortController}
                openErrorSB={openErrorSB} ChangeSuccessPanel={ChangeSuccessPanel} ResetCookie={ResetCookie}
                setCartData={setCartData}
            />
            {renderErrorSB}
            <Success success={success} setSuccess={setSuccess} />

            {hintsBoxActive && <span style={{
                position: 'absolute',
                zIndex: 9999, left: 0, top: 0, width: '100%', height: '100%',
                backgroundColor: '#0000004d'
            }}></span>}
            <Tooltip id="general-compare-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem',
                textAlign: 'center', zIndex: 99999
            }} />
        </Fragment>
    );
}
