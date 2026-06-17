/**
 * descrizione: Hook form state della section Profilazione.
 * compito:     normalizza report backend -> valori form e produce payload salvataggio.
 */
import React from "react";
import { isFlagOn, pickFieldInsensitive, toSN, toTrimmedText } from "utils/data/record";
import type { AnyRecord } from "../types";

type ProfilazioneFormValues = {
    cambioAgente: boolean;
    motivazioneCambioAgente: string;
    diffEconomiche: boolean;
    clienteRischioso: boolean;
    prodottiNonTrattati: boolean;
    textProdottiNonTrattati: string;
    clientNonRedditizio: boolean;
    margineMiglioramento: boolean;
    prezziNonCompetitivi: boolean;
    textPrezziNonCompetitivi: string;
    problemaResi: boolean;
    problemaTrasporto: boolean;
    problemiAmministrativi: boolean;
    clienteDiscontinuo: boolean;
    modPagamento: boolean;
    textModPagamento: string;
};

function createInitialValues(): ProfilazioneFormValues {
    return {
        cambioAgente: false,
        motivazioneCambioAgente: "",
        diffEconomiche: false,
        clienteRischioso: false,
        prodottiNonTrattati: false,
        textProdottiNonTrattati: "",
        clientNonRedditizio: false,
        margineMiglioramento: false,
        prezziNonCompetitivi: false,
        textPrezziNonCompetitivi: "",
        problemaResi: false,
        problemaTrasporto: false,
        problemiAmministrativi: false,
        clienteDiscontinuo: false,
        modPagamento: false,
        textModPagamento: "",
    };
}

export function useProfilazioneForm(report: AnyRecord | null | undefined) {
    /**
     * Stato unico del form profilazione.
     * Contiene sia i flag booleani sia i campi testuali condizionati dai rispettivi toggle.
     * Viene inizializzato con default e riallineato a ogni cambio `report`.
     */
    const [values, setValues] = React.useState<ProfilazioneFormValues>(() => createInitialValues());

    const setBoolean = React.useCallback((field: keyof ProfilazioneFormValues, next: boolean) => {
        setValues((prev) => ({ ...prev, [field]: next }));
    }, []);

    const setText = React.useCallback((field: keyof ProfilazioneFormValues, next: string) => {
        setValues((prev) => ({ ...prev, [field]: next }));
    }, []);

    const toggleWithReset = React.useCallback((flagField: keyof ProfilazioneFormValues, textField: keyof ProfilazioneFormValues, next: boolean) => {
        setValues((prev) => ({
            ...prev,
            [flagField]: next,
            [textField]: next ? prev[textField] : "",
        }));
    }, []);

    const handleCambioAgenteToggle = React.useCallback((next: boolean) => {
        toggleWithReset("cambioAgente", "motivazioneCambioAgente", next);
    }, [toggleWithReset]);

    const handleModPagamentoToggle = React.useCallback((next: boolean) => {
        toggleWithReset("modPagamento", "textModPagamento", next);
    }, [toggleWithReset]);

    const handleProdottiNonTrattatiToggle = React.useCallback((next: boolean) => {
        toggleWithReset("prodottiNonTrattati", "textProdottiNonTrattati", next);
    }, [toggleWithReset]);

    const handlePrezziNonCompetitiviToggle = React.useCallback((next: boolean) => {
        toggleWithReset("prezziNonCompetitivi", "textPrezziNonCompetitivi", next);
    }, [toggleWithReset]);

    React.useEffect(() => {
        const motivoCambioAgente = toTrimmedText(
            pickFieldInsensitive(report, ["MOTIVO CAMBIO AGENTE", "PMCAG", "motivazioneCambioAgente"])
        );
        const prodottiNonTrattatiText = toTrimmedText(
            pickFieldInsensitive(report, ["INTER. PROD. NON TATT.", "PIPNT", "textProdottiNonTrattati"])
        );
        const modPagamentoText = toTrimmedText(
            pickFieldInsensitive(report, ["MOD. PAG. RICH. CLT", "PMPRC", "motivazioneModificaPagamento"])
        );
        const prezziNonCompetitiviText = toTrimmedText(
            pickFieldInsensitive(report, ["PREZZI NON COMP.", "PNPCO", "textPrezziNonCompetitivi"])
        );

        setValues({
            cambioAgente: !!motivoCambioAgente,
            motivazioneCambioAgente: motivoCambioAgente,
            diffEconomiche: isFlagOn(pickFieldInsensitive(report, ["DIFFICOLTA ECONOMICA", "PDFEC"])),
            clienteRischioso: isFlagOn(pickFieldInsensitive(report, ["CLIENTE RISCHIOSO", "PCLRI"])),
            prodottiNonTrattati: !!prodottiNonTrattatiText,
            textProdottiNonTrattati: prodottiNonTrattatiText,
            clientNonRedditizio: isFlagOn(pickFieldInsensitive(report, ["CLT NON REDDIT.", "PCLNR"])),
            margineMiglioramento: isFlagOn(pickFieldInsensitive(report, ["MARG. MIGL. FATT.", "PEMMF"])),
            prezziNonCompetitivi: !!prezziNonCompetitiviText,
            textPrezziNonCompetitivi: prezziNonCompetitiviText,
            problemaResi: isFlagOn(pickFieldInsensitive(report, ["PROB. RESI", "PPRRE"])),
            problemaTrasporto: isFlagOn(pickFieldInsensitive(report, ["PROB. TRASP.", "PPRTR"])),
            problemiAmministrativi: isFlagOn(pickFieldInsensitive(report, ["PROB. AMMINI.", "PPRAM"])),
            clienteDiscontinuo: isFlagOn(pickFieldInsensitive(report, ["CLT. DISCONTINUO", "PESAS"])),
            modPagamento: !!modPagamentoText,
            textModPagamento: modPagamentoText,
        });
    }, [report]);

    const buildSaveData = React.useCallback((customerCode: string | number | undefined | null) => {
        const motivoCambioAgente = values.motivazioneCambioAgente.trim();
        const prodottiText = values.textProdottiNonTrattati.trim();
        const modPagamentoText = values.textModPagamento.trim();
        const prezziText = values.textPrezziNonCompetitivi.trim();

        const resolvedCustomerCode = String(
            customerCode ?? pickFieldInsensitive(report, ["CODICE CLIENTE", "PCDCL", "numeroCliente", "customerCode", "ccli"]) ?? ""
        ).trim();

        const missingText: string[] = [];
        if (values.cambioAgente && !motivoCambioAgente) missingText.push("motivo cambio agente");
        if (values.prodottiNonTrattati && !prodottiText) missingText.push("prodotti non trattati");
        if (values.modPagamento && !modPagamentoText) missingText.push("modifica modalita di pagamento");
        if (values.prezziNonCompetitivi && !prezziText) missingText.push("prezzi non competitivi");

        const payload: AnyRecord = {
            "CODICE CLIENTE": resolvedCustomerCode,
            "CAMBIO AGENTE": toSN(values.cambioAgente && !!motivoCambioAgente),
            "MOTIVO CAMBIO AGENTE": values.cambioAgente ? motivoCambioAgente : "",
            "DIFFICOLTA ECONOMICA": toSN(values.diffEconomiche),
            "INTER. PROD. NON TATT.": values.prodottiNonTrattati ? prodottiText : "",
            "MOD. PAG. RICH. CLT": values.modPagamento ? modPagamentoText : "",
            "CLT NON REDDIT.": toSN(values.clientNonRedditizio),
            "MARG. MIGL. FATT.": toSN(values.margineMiglioramento),
            "PREZZI NON COMP.": values.prezziNonCompetitivi ? prezziText : "",
            "CLIENTE RISCHIOSO": toSN(values.clienteRischioso),
            "PROB. RESI": toSN(values.problemaResi),
            "PROB. TRASP.": toSN(values.problemaTrasporto),
            "PROB. AMMINI.": toSN(values.problemiAmministrativi),
            "CLT. DISCONTINUO": toSN(values.clienteDiscontinuo),
        };

        return {
            resolvedCustomerCode,
            missingText,
            payload,
        };
    }, [report, values]);

    return {
        values,
        setMotivazioneCambioAgente: (next: string) => setText("motivazioneCambioAgente", next),
        setTextProdottiNonTrattati: (next: string) => setText("textProdottiNonTrattati", next),
        setTextModPagamento: (next: string) => setText("textModPagamento", next),
        setTextPrezziNonCompetitivi: (next: string) => setText("textPrezziNonCompetitivi", next),
        setDiffEconomiche: (next: boolean) => setBoolean("diffEconomiche", next),
        setClienteRischioso: (next: boolean) => setBoolean("clienteRischioso", next),
        setClientNonRedditizio: (next: boolean) => setBoolean("clientNonRedditizio", next),
        setMargineMiglioramento: (next: boolean) => setBoolean("margineMiglioramento", next),
        setClienteDiscontinuo: (next: boolean) => setBoolean("clienteDiscontinuo", next),
        setProblemaResi: (next: boolean) => setBoolean("problemaResi", next),
        setProblemaTrasporto: (next: boolean) => setBoolean("problemaTrasporto", next),
        setProblemiAmministrativi: (next: boolean) => setBoolean("problemiAmministrativi", next),
        handleCambioAgenteToggle,
        handleModPagamentoToggle,
        handleProdottiNonTrattatiToggle,
        handlePrezziNonCompetitiviToggle,
        buildSaveData,
    };
}
