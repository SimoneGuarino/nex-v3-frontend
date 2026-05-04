// src/components/UI/panels/customersPanel/hooks/useCustomersPanelController.ts
/**
 * descrizione: Controller del CustomersPanel.
 * compito:     orchestra fetch dati cliente e collega stato base/section al container UI.
 */
import React from "react";
import { getData } from "../fetchdata";
import type { AnyRecord } from "../types";
import { useCustomersPanelState } from "./useCustomersPanelState";
import { useUserContext } from "context/UserContext";

type UseCustomersPanelControllerArgs = {
    open: boolean;
    customerCode: string | number;
};

export function useCustomersPanelController({
    open,
    customerCode,
}: UseCustomersPanelControllerArgs) {
    /** Contesto autenticazione utente usato dalle fetch del panel. */
    const [userContext] = useUserContext();
    // Sequenza richieste: evita che risposte lente di richieste precedenti
    // sovrascrivano lo stato del cliente corrente.
    const requestSeqRef = React.useRef(0);

    const {
        /** Loading globale panel proveniente da `useCustomersPanelState`. */
        loading,
        setLoading,
        /** Errore globale panel proveniente da `useCustomersPanelState`. */
        hasErr,
        setHasErr,
        /** Loading per section (summary/details) proveniente da stato condiviso. */
        loadingStates,
        setSectionLoading,
        /** Esito fetch per section (`idle/success/error`) proveniente da stato condiviso. */
        sectionFetchStates,
        setSectionFetchState,
        /** Payload dati panel centralizzato proveniente da stato condiviso. */
        data,
        setPanelData,
        resetDataState,
        /** Apertura pannello secondario details proveniente da stato condiviso. */
        secondaryOpen,
        /** Section details attiva proveniente da stato condiviso. */
        activeSection,
        openDetails,
        closeSecondary,
    } = useCustomersPanelState();

    React.useEffect(() => {
        if (!open) return;
        if (!customerCode) return;

        // Ogni apertura cliente crea una "sessione fetch" isolata.
        // I callback di stato applicano update solo se la sessione e ancora corrente.
        const abortController = new AbortController();
        const requestSeq = ++requestSeqRef.current;
        const isCurrentRequest = () =>
            requestSeqRef.current === requestSeq && !abortController.signal.aborted;

        setLoading(true);
        resetDataState();

        getData({
            userContext,
            abortController,
            customerCode,
            body: {},
            setData: (updater: any) => {
                if (!isCurrentRequest()) return;
                setPanelData(updater);
            },
            setErr: (value: boolean) => {
                if (!isCurrentRequest()) return;
                setHasErr(!!value);
            },
            setLoadingState: (section, isLoading) => {
                if (!isCurrentRequest()) return;
                setSectionLoading(section, isLoading);
            },
            setFetchState: (section, fetchState) => {
                if (!isCurrentRequest()) return;
                setSectionFetchState(section, fetchState);
            },
        })
            .catch((error) => {
                if (error?.name !== "AbortError") console.error(error);
            })
            .finally(() => {
                if (isCurrentRequest()) setLoading(false);
            });

        // Cancella in-flight request quando pannello/cliente cambia.
        return () => abortController.abort();
    }, [
        open,
        customerCode,
        resetDataState,
        setHasErr,
        setLoading,
        setPanelData,
        setSectionLoading,
        setSectionFetchState,
        userContext,
    ]);

    return {
        loading,
        hasErr,
        loadingStates,
        sectionFetchStates,
        data,
        secondaryOpen,
        activeSection,
        openDetails,
        closeSecondary,
        setPanelData,
        anagrafica: data.anagrafica as AnyRecord | null,
        creditsProfile: data.creditsProfile as AnyRecord | null,
        creditsYears: data.creditsYears as AnyRecord | null,
        profilazioneReport: data.profilazioneReport as AnyRecord | null,
    };
}

