import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function DataRetriveAPI(userContext, abortController, setData, userChoose, setTableLoad, 
backupData, CheckAdminDev, setConfigsData, detailsCheck, RegrupArray) {
    if(userContext.details === undefined){return;}

    let details = {
        dsd: userChoose.dsd,
        dft: userChoose.dft
    };


    if (Boolean(userChoose)) {
        Object.assign(details, {byr : userChoose.byr});
    };
    if (Boolean(userChoose.brd)) {
        Object.assign(details, {brd : userChoose.brd});
    };
    if (Boolean(userChoose.lin)) {
        Object.assign(details, {lin : userChoose.lin});
    };

    //assegna alla variabile byr se l'utente non è un admin
    if (!CheckAdminDev && details) {
        Object.assign(details, {byr : userContext.details.CodiceBuyer});
    };


    FetchData(import.meta.env.VITE_API_STOCKS + 'targetStock/rt-st-dt', 'POST', {
        tk: userContext.token,
        usrch: details,
    }, abortController).then(res => {
        backupData.current = res.data;
        setConfigsData(res.configs);
        if(!detailsCheck){
            setData(_ => {
                const copy = [...res.data];
                const newArr = RegrupArray ? RegrupArray({
                    data: copy, groupBy: ['buyer', 'marca', 'linea'],
                    paramsListToSum: ['stock', 'fatturatoTrimestreAttuale', 'fatturatoTrimestrePrecedente', 
                        'fatturatoTrimestreAttualeNew', 'fatturatoTrimestrePrecedenteNew', 'backorder', 'ocfb'],
                    configsData_props: res.configs
                }) : copy;

                let conditions = [];

                const filter = (Boolean(userChoose.byr) || Boolean(userChoose.brd)) ?
                    newArr.filter((x) => conditions.every((prop) => {
                        let nameOfpropX = "";
                        if (prop == 'byr') {
                            nameOfpropX = "buyer";
                        } else if (prop == 'brd') {
                            nameOfpropX = "marca";
                        }

                        return x[nameOfpropX] == userChoose[prop];
                    })
                    ) : newArr;

                    console.log(filter)
                return filter;
            });
        }else{
            setData(res.data);
        };
        //disattiva il caricamento
        setTableLoad(false);
    }).catch(error => {
        console.error(error);
        let error_ = "Sembra che ci sia stato un problema nel recuperare i dati dal server, perfavore contatta l'assistenza"
        if(error && error?.msg){    error_ = error.msg;     };
        return enqueueSnackbar(error_, {
            title: 'Ops..',
            type: 'error',
        });
    })
}