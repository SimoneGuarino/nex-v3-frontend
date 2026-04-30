import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function ChangeStatusAPI({ userContext, abortController, elementSelected, csts, commento,
setData, rowSelected, statusID, setLoadActionState, CommentsVisibilityOff }) {
    if (userContext.details === undefined) { return; }
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'csts-fdo', 'POST', {
        tk: userContext.token,
        eID: elementSelected._id,
        csts: csts,
        cmt: commento
    }, abortController).then(_ => {
        setData(prev => {
            const copyOfPrev = [...prev];
            if (rowSelected != null) {
                copyOfPrev[rowSelected].Stato = statusID;
                if (statusID === 0) {
                    copyOfPrev[rowSelected].DettagliUtenteTaskInCarico.ID = null;
                    copyOfPrev[rowSelected].DettagliUtenteTaskInCarico.NomeCompleto = null;
                };
            };

            return copyOfPrev;
        });
        CommentsVisibilityOff();
        setLoadActionState(false);
        return enqueueSnackbar("Lo stato della richiesta è stato modificato correttamente.", {
            title: 'Successo',
            type: 'success',
        });
    }).catch(error => {
        setLoadActionState(false);

        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile modificare tale richiesta, perfavore contatta un tecnico."
            if (error && (error?.msg || error?.message)) { error_ = (error.msg || error.message); };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}