import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface DistributorsListAPIProps {
    userContext: UserContext;
    abortController: any;
    setDistributorList: (arg0: any) => void;
    setDistributorStructure: (arg0: any) => void;
};


export function DistributorsListAPI({ userContext, abortController, setDistributorList, setDistributorStructure }: DistributorsListAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/dists/gt-flt`, 'POST', {
        tk: userContext.token,
    }, abortController).then((data: any) => {
        if (data.fornitori && Array.isArray(data.fornitori) && data.fornitori.length > 0) {
            setDistributorList(data.fornitori);
        };


        if (Boolean(data.focelda)) {
            let uniqueGroups: any = [];
            let uniqueFamilies: any = [];

            if(data.focelda.categorie && Array.isArray(data.focelda.categorie) && data.focelda.categorie.length > 0) {
                uniqueGroups = [...new Map(
                    data.focelda.categorie.flatMap((item: any) => item.gruppi)
                        .map((g: any) => [g.gruppo, g]) // Mappa con chiave `gruppo`
                ).values()];
    
                // Estrazione delle famiglie uniche
                uniqueFamilies = [...new Map(
                    data.focelda.categorie.flatMap((item: any) => item.gruppi)
                        .flatMap((group: any) => group.famiglie)
                        .map((f: any) => [f.famiglia, f]) // Usa la famiglia come chiave
                ).values()];
            };

            setDistributorStructure((prev: any) => ({
                focelda: {
                    categorie: data.focelda.categorie,
                    gruppi: uniqueGroups,
                    famiglie: uniqueFamilies,
                    raggruppamenti: data.focelda.raggruppamenti,
                }, fornitore: prev.fornitore
            }));
        }
    }).catch((errorState: { name: string, status: number, message?: string | { [key: string]: string } }) => {
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
                error_ = "Sembra che non è stato possibile salvare i dati, perfavore contatta un tecnico."
            }

            enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
            return;
        };
    });
}