import { Stack } from "@mui/material";
import { MainTheme } from "assets/settingsTheme";
import OverView from "./components/overview";
import React, { useEffect, useState } from "react";
import { DataAPI } from "./fetchData/getSummaryFile";
import { UserContext } from "context/UserContext";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import TopBar from "./components/topBar";
import { User, UserContextTypes } from "types/user";
import { GetCategoriesAPI } from "./fetchData/get/getCategories";
import { GetUsersAPI } from "./fetchData/get/getUsers";
import { Tooltip } from "react-tooltip";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { enqueueSnackbar } from "components/MessageBox";
import { SaveObjectiveAPI } from "./fetchData/post/saveObjective";
import ObjectiveDialog from "./components/ObjectiveDialog";
import { GetTableDataAPI } from "./fetchData/get/getTableData";
import { useNexTheme } from "@nex/theme-system";

// Le chiavi dei quattro quarter
type QuarterKey = keyof DataOverviewProps['quarters']; // "q1"|"q2"|"q3"|"q4"

// Solo le sezioni che hanno davvero .contratti
type SectionKey = 'vendita' | 'acquisto';

type FormObjectiveValues = {
    brand: { [key: string]: string | number } | null;
    linea: { [key: string]: string | number } | null;
    gruppo: { [key: string]: string | number } | null;
    famiglia: { [key: string]: string | number } | null;
    target: string; // Target può essere un numero o una stringa
    quarter: number;
};

export type TabTypeProps = {
    key: number;
    label: string;
    prop_key: 'acquisto' | 'vendita';
    roleRef: number; // Riferimento al ruolo per il tab
}

export const tabType: TabTypeProps[] = [
    {
        key: 0,
        label: "PURCHASES",
        prop_key: "acquisto",
        roleRef: 2,
    },
    {
        key: 1,
        label: "SALES",
        prop_key: "vendita",
        roleRef: 3,
    },
];

export type Contract = {
    _id: string;
    nome: string;
    dimensione?: number; // Dimensione del file in byte
    tipo?: string;
    createdAt: Date;
    expiresAt?: Date;
}

export type QuarterData = {
    vendita?: {
        valore: number;
        id_quarter_target?: string;
        valore_target?: number;
        contratti: Contract[];
    }
    acquisto?: {
        valore: number;
        id_quarter_target?: string;
        valore_target?: number;
        contratti: Contract[];
    }
    data_inizio?: string;
    data_fine?: string;
}

type IdentificationData = {
    codice: string;
    descrizione: string;
}

export interface DataOverviewProps {
    brand?: string;
    linea?: IdentificationData;
    gruppo?: IdentificationData;
    famiglia?: IdentificationData;
    quarters: {
        q1: QuarterData;
        q2: QuarterData;
        q3: QuarterData;
        q4: QuarterData;
    }
}

const SwotDashboard: React.FC<{}> = () => {
    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const [userContext, setUserContext] = React.useContext<UserContextTypes | any>(UserContext);

    const CheckAdminDev = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        rolesToCheck: [0, 1],
        permissions: userContext.details.permissions,
        panelToCheck: "swot",
        where: 0,
    });

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    // Stato per il tab attivo
    // Questo stato gestisce quale tab è attivo nella dashboard SWOT
    const [tabActived, setTabActived] = useState<TabTypeProps>(tabType[0]);
    const changeTab = ({ index }: { index: number }) => {
        setTabActived(tabType[index]);
    };
    // Stato per il dialog degli obiettivi
    // Questo stato controlla l'apertura e la chiusura del dialog per inserire gli obiettivi
    const [objectiveDialog, setObjectiveDialog] = useState(false);
    // Stato per l'utente corrente
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // Stato per la lista degli utenti
    const [userList, setUserList] = useState<User[]>([]);
    // Stato per i dati delle categorie
    const [categoryData, setCategoryData] = useState<Array<object>>([]);
    // Stato per i dati della overview
    const [data, setData] = React.useState<null | DataOverviewProps>(/*{
        brand: 'SAMSUNG',
        linea: {
            codice: 'NBNE',
            descrizione: 'NOTEBOOK ULTRABOOK TABLET',
        },
        gruppo: {
            codice: 'NB',
            descrizione: 'NOTEBOOK',
        },
        famiglia: {
            codice: 'NBP',
            descrizione: 'NOTEBOOK DA 11.6\" A 14\"',
        },
        quarters: {
            q1: {
                vendita: {
                    valore: 1000,
                    valore_target: 2000,
                    contratti: [{
                        _id: "1",
                        nome: "contract1.pdf",
                        dimensione: 1500000, // Dimensione in byte (1.5 MB)
                        tipo: "pdf",
                        createdAt: new Date("2025-01-01"),
                        expiresAt: new Date("2025-12-31")
                    }, {
                        _id: "2",
                        nome: "contract2.pdf",
                        dimensione: 1500000, // Dimensione in byte (1.5 MB)
                        tipo: "pdf",
                        createdAt: new Date("2025-02-01"),
                        expiresAt: new Date("2025-12-31")
                    }, {
                        _id: "3",
                        nome: "contract3.pdf",
                        dimensione: 1500000, // Dimensione in byte (1.5 MB)
                        tipo: "pdf",
                        createdAt: new Date("2025-03-01"),
                        expiresAt: new Date("2025-12-31")
                    }]
                },
                acquisto: {
                    valore: 8030,
                    valore_target: 9500,
                    contratti: []
                },
                data_inizio: '2025-07-10T06:05:38.676+00:00',
                data_fine: '2025-07-15T06:05:38.676+00:00',
            },
            q2: { acquisto: { valore: 34002, valore_target: 5300, contratti: [] } },
            q3: { acquisto: { valore: 31002, valore_target: 5300, contratti: [] } },
            q4: { acquisto: { valore: 27002, valore_target: 5300, contratti: [] } },
        },
    }*/ null);
    // Stato per i dati della tabella
    // Questo stato gestisce i dati che vengono visualizzati nella tabella della dashboard SWOT
    const [tableData, setTableData] = useState<DataOverviewProps[] | null>(null);
    const [backUpTableData, setBackUpTableData] = useState<DataOverviewProps[] | null>(null); // Aggiunto per gestire i dati di backup della tabella
    // Stato per i valori predefiniti dell'obiettivo
    // Questo stato viene utilizzato per gestire i valori predefiniti del form degli obiettivi
    // Inizialmente è impostato come un oggetto vuoto, ma può essere popolato con i valori predefiniti necessari per il form
    // Questo è utile per resettare il form quando si apre il dialog degli obiettivi
    // e per fornire un punto di partenza per l'utente che sta inserendo un nuovo obiettivo
    const [defaultObjectiveValues, setDefaultObjectiveValues] = useState<Partial<FormObjectiveValues>>({});

    const [loadStatus, setLoadStatus] = React.useState<{ [key: string]: any }>({
        overview: false,
        table: false,
        categories: false, // Per il caricamento delle categorie
        users: true, // Per il caricamento dei dati degli utenti
        download: false,
        objective: false,
        uploadContract: false,
    });
    const ChangeLoadStatus = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    const defaultStyles = {
        bg: {
            100: `${darkMode ? palette.grey[900] : palette.grey[100]}`,
            200: `${darkMode ? palette.grey[800] : palette.grey[200]}`,
        },
        icon: `${darkMode ? palette.common.white : palette.grey[900]}`,
        button: {
            default: "text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-neutral-900 hover:bg-gray-300 dark:hover:bg-gray-700",
            active: "text-gray-800 dark:text-gray-200 bg-gray-300 dark:bg-neutral-800 hover:bg-gray-400 dark:hover:bg-neutral-700",
        }
    };

    // Abort il panding del fetch all server
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    const DataRetrive = React.useCallback(async (format: "xlsx" | "csv", utenteId: string) => {
        ChangeLoadStatus({ from: 'download', bool: true });
        console.log("Exporting data in format:", format);

        try {
            await DataAPI(userContext, abortController, utenteId, format);
        } catch (error) {
            console.error("Errore durante l'esportazione:", error);
        } finally {
            ChangeLoadStatus({ from: 'download', bool: false });;
        }
    }, [userContext, abortController]);

    //operazioni iniziali.
    useEffect(() => {
        if (userContext.details === undefined) { return; }
        GetUsersAPI({
            abortController,
            setData: setUserList,
            ChangeLoadStatus
        });

        GetCategoriesAPI({
            abortController,
            setData: setCategoryData,
            ChangeLoadStatus
        });

        if (!CheckAdminDev) {
            //TODO: Quando avviene lo switch dell'utente, ricaricare i dati della tabella e del overview
            GetTableDataAPI({
                abortController,
                userId: userContext.details._id,
                setOverviewData: setData,
                setTableData,
                setBackUpTableData,
                ChangeLoadStatus
            });
        };

        return () => {
            cancelRequest();
        }
    }, [userContext.details]);


    // Funzione per gestire l'invio dell'obiettivo
    const handleObjectiveSubmit = async (payload: FormObjectiveValues): Promise<boolean> => {
        return await new Promise<boolean>((resolve, reject) => {
            if (loadStatus.objective || !currentUser) {
                enqueueSnackbar("E' presente già una richiesta al server in fase di elaborazione.", {
                    title: 'Ops..',
                    type: 'error',
                });
                return false;
            };

            const quarterKey = `q${payload.quarter + 1}` as QuarterKey;
            const sectionKey = tabActived.prop_key as SectionKey;

            //inserire la condizione sul id dell elemento obiettivo se presente
            let payload_: { [key: string]: any } = {
                target: Number(payload.target), // Assicurati che il target sia un numero
            };

            if (quarterKey && sectionKey && data?.quarters[quarterKey]?.[sectionKey]?.id_quarter_target) {
                payload_._id = data.quarters[quarterKey]?.[sectionKey]?.id_quarter_target;
            } else {
                payload_ = {
                    utenteId: currentUser._id,
                    ...payload,
                    quarter: payload.quarter + 1, // Converti l'indice del trimestre in un numero 1-4
                    tipo: tabActived.prop_key, // Usa il prop_key del tab attivo
                };
            };


            function successOperation(objectiveId?: string | null) {
                if (!objectiveId && typeof objectiveId !== 'string') {
                    console.warn("Objective ID is missing after saving the objective.");
                    objectiveId = null;
                };
                // Aggiorna lo stato dei dati con il nuovo obiettivo
                setData((prevData) => {
                    if (!prevData) return prevData;
                    const updatedQuarters = {
                        ...prevData.quarters,
                        [quarterKey]: {
                            ...prevData.quarters[quarterKey],
                            [sectionKey]: {
                                ...prevData.quarters[quarterKey][sectionKey],
                                id_quarter_target: objectiveId || prevData.quarters[quarterKey][sectionKey]?.id_quarter_target || null,
                                valore_target: Number(payload.target),
                            }
                        }
                    };
                    return {
                        ...prevData,
                        quarters: updatedQuarters,
                    };
                });
                enqueueSnackbar("Obiettivo del trimestre salvato con successo.", {
                    title: 'Successo',
                    type: 'success',
                });
                ChangeLoadStatus({ from: 'objective', bool: false });
                resolve(true);
            };

            // Chiamata API per salvare l'obiettivo
            SaveObjectiveAPI({
                abortController, payload: payload_, ChangeLoadStatus, successOperation, reject
            });
        }).catch((error: any) => {
            console.error("Errore durante il salvataggio dell'obiettivo:", error);
            ChangeLoadStatus({ from: 'objective', bool: false });
            enqueueSnackbar("Si è verificato un errore durante il salvataggio dell'obiettivo.", {
                title: 'Ops..',
                type: 'error',
            });
            return false;
        });
    };

    // Funzione per trovare il percorso predefinito della categoria
    // Questa funzione cerca il percorso predefinito della categoria basandosi sui dati forniti
    // e restituisce un oggetto contenente le informazioni sulla marca, linea, gruppo e famiglia
    // Se non trova una corrispondenza, restituisce un oggetto con le informazioni disponibili
    function findDefaultCategoryPath(data: DataOverviewProps, categoryData: any[]) {
        if (!categoryData || categoryData.length === 0) {
            return {};
        };

        // Assicurati che i dati siano validi e che contengano le proprietà necessarie
        if (!data.brand || !data.linea || !data.gruppo || !data.famiglia) {
            return {};
        };

        if (!data) return {};

        const brand = categoryData.find((b: any) => b.Marca === data.brand);
        if (!brand) return {};

        const linea = brand.Categories.find((l: any) => l.Linea === data?.linea?.codice);
        if (!linea) return { brand };

        const gruppo = linea.SubCategory.find((g: any) => g.Gruppo === data?.gruppo?.codice);
        if (!gruppo) return { brand, linea };

        const famiglia = gruppo.famiglie.find((f: any) => f.famiglia === data?.famiglia?.codice);
        if (!famiglia) return { brand, linea, gruppo };

        return { brand, linea, gruppo, famiglia };
    };

    // Aprire il dialog degli obiettivi quando viene richiamata la funzione
    // Questa funzione verifica se l'utente corrente è selezionato e se i dati sono disponibili
    // Se l'utente non è selezionato, mostra un messaggio di avviso
    const openObjectiveDialog = (quarterIndex: number) => {
        //Verifica se è stato selezionato un elemento della tabella
        if (!data || !data.linea || !data.gruppo || !data.famiglia || !data.brand) {
            // Se i dati sono disponibili, imposta i valori predefiniti per l'obiettivo
            return enqueueSnackbar("Seleziona un elemento (linea, gruppo, famiglia, brand) per inserire un obiettivo.", {
                title: 'Attenzione',
                type: 'warning',
            });
        }

        // Verifica se l'utente corrente è selezionato
        // Se non è selezionato, mostra un messaggio di avviso
        if (!currentUser) {
            return enqueueSnackbar("Seleziona un utente per inserire un obiettivo.", {
                title: 'Attenzione',
                type: 'warning',
            });

        };

        if (data) {
            const defaults = findDefaultCategoryPath(data, categoryData);
            // cast sicuro a QuarterKey
            const quarterKey = `q${quarterIndex + 1}` as QuarterKey;
            // cast sicuro a SectionKey
            const sectionKey = tabType[tabActived.key].prop_key as SectionKey;
            const target = data.quarters[quarterKey]?.[sectionKey]?.valore_target;

            setDefaultObjectiveValues({
                ...defaults,
                target: target?.toString() || "", // Imposta il target del trimestre corrente
                quarter: quarterIndex || 0, // Impostazione predefinita per il trimestre
            });
        };

        setObjectiveDialog(true);
    };

    // somma tutti i quarter di tutti gli elementi nella risposta e genera un unico oggetto con la somma
    // del valore e valore_target dei vari quarters e salvalo in setOverviewData
    const CreateOverviewData = (data_?: DataOverviewProps[] | null) => {
        const data__ = data_ || tableData;
        if (!data__ || data__.length === 0) return;

        const overviewData = data__.reduce((acc: any, item: any) => {
            Object.keys(item.quarters).forEach((quarterKey) => {
                const quarterData = item.quarters[quarterKey];
                if (!acc[quarterKey]) {
                    acc[quarterKey] = { vendita: { valore: 0, valore_target: 0 }, acquisto: { valore: 0, valore_target: 0 } };
                }
                acc[quarterKey].vendita.valore += quarterData.vendita?.valore || 0;
                acc[quarterKey].vendita.valore_target += quarterData.vendita?.valore_target || 0;
                acc[quarterKey].acquisto.valore += quarterData.acquisto?.valore || 0;
                acc[quarterKey].acquisto.valore_target += quarterData.acquisto?.valore_target || 0;
            });
            return acc;
        }, {});

        setData(({ quarters: overviewData }));
    };


    return (
        <DashboardLayout>
            <Stack width="100%" gap={2}>
                <TopBar
                    data={data} setData={setData} // Passa i dati della overview
                    tableData={tableData} setTableData={setTableData} // Passa i dati della tabella
                    tabActived={tabActived} changeTab={changeTab}
                    defaultStyles={defaultStyles} onExport={DataRetrive}
                    loadStatus={loadStatus} setObjectiveDialog={setObjectiveDialog}
                    userList={userList}
                    currentUser={currentUser} setCurrentUser={setCurrentUser}
                    ChangeLoadStatus={ChangeLoadStatus}
                    CheckAdminDev={CheckAdminDev}
                    setBackUpTableData={setBackUpTableData}
                    CreateOverviewData={CreateOverviewData} />
                <OverView
                    tabActived={tabActived}
                    data={data} setData={setData} // Passa i dati della overview
                    tableData={tableData} setTableData={setTableData} // Passa i dati della tabella
                    loadStatus={loadStatus}
                    ChangeLoadStatus={ChangeLoadStatus}
                    currentUser={currentUser}
                    CheckAdminDev={CheckAdminDev}
                    openObjectiveDialog={openObjectiveDialog}
                    backUpTableData={backUpTableData}
                    CreateOverviewData={CreateOverviewData}
                />
            </Stack>
            <Tooltip id="general-swot-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem',
                textAlign: 'center', zIndex: 9999
            }} />
            <ObjectiveDialog
                defaultStyles={defaultStyles}
                open={objectiveDialog}
                onClose={() => setObjectiveDialog(false)}
                onSubmit={handleObjectiveSubmit}
                loadStatus={loadStatus}
                ChangeLoadStatus={ChangeLoadStatus}
                categoryData={categoryData}
                defaultValues={defaultObjectiveValues}
                setDefaultObjectiveValues={setDefaultObjectiveValues}
            />
        </DashboardLayout>
    );
};

export default SwotDashboard;
