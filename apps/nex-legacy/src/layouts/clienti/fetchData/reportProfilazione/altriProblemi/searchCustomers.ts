//src\layouts\clienti\fetchData\reportProfilazione\richCambioAgente\searchCustomers.ts
import { isKeyInObject } from "vdck";
import { FetchData } from "examples/Fetch";
import { enqueueSnackbar } from "components/MessageBox";

interface SearchArgs {
    userContext: { [key: string]: any };
    abortController: any;
    body: any;
    setOptions: (opts: { label: string; value: string }[]) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
}

/**
 * Recupera la lista COMPLETA dei clienti (codice + denominazione)
 * coerente con i filtri della pagina "Richieste cambio agente".
 * Usa la rotta /customers/search/cambio-agente.
 */
export function searchCustomers({
    userContext,
    abortController,
    body,
    setOptions,
    ChangeLoadStatus,
}: SearchArgs): void {
    // opzionale: evita chiamata se manca il token
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    ChangeLoadStatus({ from: "customers", bool: true });

    FetchData(
        `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/report/altri-problemi/search`,
        "POST",
        body,
        abortController
    )
        .then((res: any) => {
            const list = Array.isArray(res) ? res : [];
            const seen = new Set<string>();
            const opts: { label: string; value: string }[] = [];

            list.forEach((row: any) => {
                const codice = String(row.codice ?? "").trim();
                if (!codice || seen.has(codice)) return;
                seen.add(codice);

                const denominazione = String(row.denominazione ?? "").trim();
                opts.push({
                    value: codice,
                    label: `${codice} - ${denominazione}`,
                });
            });

            setOptions(opts);
            ChangeLoadStatus({ from: "customers", bool: false });
        })
        .catch((error: any) => {
            if (error?.name !== "AbortError") {
                console.error(error);
                let msg =
                    "Si è verificato un errore nel recupero della lista clienti con altri problemi, riprova o contatta un tecnico.";
                if (error && (error.msg || error.message)) {
                    msg = error.msg || error.message;
                }
                enqueueSnackbar(msg, {
                    title: "Ops..",
                    type: "error",
                });
            }
            ChangeLoadStatus({ from: "customers", bool: false });
        });
}
