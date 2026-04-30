// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

// Lista dei brands e types disponibili
export function GetTableDataAPI({ abortController, userId, setTableData, setBackUpTableData, ChangeLoadStatus, setOverviewData }: {
    abortController: any,
    userId: string,
    setTableData: (prev: any) => void,
    setBackUpTableData: (prev: any) => void, // Aggiunto per gestire i dati di backup della tabella
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    setOverviewData: (data: any) => void;
}): void {
    /*const response_ = [{
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
                    valore: 800,
                    valore_target: 1500,
                    contratti: []
                },
                data_inizio: '2025-07-10T06:05:38.676+00:00',
                data_fine: '2025-07-15T06:05:38.676+00:00',
            },
            q2: { vendita: { valore: 1230, valore_target: 2300, contratti: [] } },
            q3: { vendita: { valore: 1230, valore_target: 2300, contratti: [] } },
            q4: { vendita: { valore: 1230, valore_target: 2300, contratti: [] } },
        },
    }];*/

    FetchData(`${import.meta.env.VITE_API_STOCKS}swot/quarter/data/${userId}`, "GET", null, abortController)
        .then((response: any) => {
            if (response && Array.isArray(response) && response.length > 0) {
                // funzione per unire i dati che hanno lo stesso brand, linea, gruppo e famiglia unendo i valori dei quarter
                const mergedData: { [key: string]: any } = {};
                response.forEach((item: any) => {
                    const key = `${item.brand}-${item.linea.codice}-${item.gruppo.codice}-${item.famiglia.codice}`;
                    if (!mergedData[key]) {
                        mergedData[key] = {
                            ...item,
                            quarters: {
                                q1: { vendita: { valore: 0, valore_target: 0, contratti: [] }, acquisto: { valore: 0, valore_target: 0, contratti: [] } },
                                q2: { vendita: { valore: 0, valore_target: 0, contratti: [] }, acquisto: { valore: 0, valore_target: 0, contratti: [] } },
                                q3: { vendita: { valore: 0, valore_target: 0, contratti: [] }, acquisto: { valore: 0, valore_target: 0, contratti: [] } },
                                q4: { vendita: { valore: 0, valore_target: 0, contratti: [] }, acquisto: { valore: 0, valore_target: 0, contratti: [] } },
                            },
                        };
                    }
                    // Unisci i dati dei quarter
                    Object.keys(item.quarters).forEach((quarterKey) => {
                        const quarterData = item.quarters[quarterKey];
                        mergedData[key].quarters[quarterKey].vendita.valore += quarterData.vendita?.valore || 0;
                        mergedData[key].quarters[quarterKey].vendita.valore_target += quarterData.vendita?.valore_target || 0;
                        mergedData[key].quarters[quarterKey].acquisto.valore += quarterData.acquisto?.valore || 0;
                        mergedData[key].quarters[quarterKey].acquisto.valore_target += quarterData.acquisto?.valore_target || 0;
                        // Unisci i contratti
                        mergedData[key].quarters[quarterKey].vendita.contratti = [
                            ...mergedData[key].quarters[quarterKey].vendita.contratti,
                            ...(quarterData.vendita?.contratti || [])
                        ];
                        mergedData[key].quarters[quarterKey].acquisto.contratti = [
                            ...mergedData[key].quarters[quarterKey].acquisto.contratti,
                            ...(quarterData.acquisto?.contratti || [])
                        ];
                    }
                    );
                });

                setTableData(Object.values(mergedData));
                setBackUpTableData(Object.values(mergedData)); // Salva i dati di backup della tabella
                // somma tutti i quarter di tutti gli elementi nella risposta e genera un unico oggetto con la somma
                // del valore e valore_target dei vari quarters e salvalo in setOverviewData
                const overviewData = Object.values(mergedData).reduce((acc: any, item: any) => {
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

                // Setta i dati di overviewData
                setOverviewData({quarters: overviewData});
            };
            ChangeLoadStatus({ from: 'overview', bool: false });
            ChangeLoadStatus({ from: 'table', bool: false });
        }).catch((errorState: any) => {
            ChangeLoadStatus({ from: 'overview', bool: false });
            ChangeLoadStatus({ from: 'table', bool: false });
            if (errorState.name !== 'AbortError') {
                let error_ = "";
                const error: string | { [key: string]: string } | undefined = errorState?.message;
                console.error(errorState);
                if (error) {
                    if (typeof error === 'string') {
                        error_ = (error as any).message;
                    } else if (error !== undefined && error?.msg) {
                        error_ = error.msg;
                    };
                };

                if (!error_ || error_.trim() == "") {
                    error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico."
                }

                enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
                return;
            };
        });
}