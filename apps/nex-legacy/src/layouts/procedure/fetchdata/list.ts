//src\layouts\procedure\fetchdata\list.ts

import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export interface ProcedureFileInfo {
    nome: string;
    dimensione: number;
    estensione: string;
    ultima_modifica: string;
}

export interface ProcedureCategoryInfo {
    categoria: string;
    numero_files: number;
    dimensione: number;
    ultima_modifica: string | null;
    files: ProcedureFileInfo[];
}

export function getProceduresList({
    userContext,
    abortController,
    setData,
    setErr,
    ChangeLoadStatus,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    setData: (items: ProcedureCategoryInfo[]) => void;
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
}): Promise<any> {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const url = `${import.meta.env.VITE_API_PDF_READER}procedure/list`;

    ChangeLoadStatus({ from: "data", bool: true });

    return FetchData<ProcedureCategoryInfo[]>(url, "GET", null, abortController)
        .then((res: ProcedureCategoryInfo[]) => {
            const items = Array.isArray(res) ? res : [];
            setData(items);
            ChangeLoadStatus({ from: "data", bool: false });
            return true;
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({ from: "data", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema nel recupero delle procedure, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = error.msg || error.message;
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}
