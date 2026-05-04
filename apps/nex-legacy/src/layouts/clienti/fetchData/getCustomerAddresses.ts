import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export type CustomerAddressItem = {
    CDRND: string;
    CDNDD: string;
    RA1ND: string;
    RA2ND: string;
    CAPND: string;
    CITND: string;
    PROND: string;
    TELND: string;
    INEND: string;
};

type GetCustomerAddressesArgs = {
    userContext: { [key: string]: any };
    abortController: any;
    customerCode: string | number | null | undefined;
    setData?: (items: CustomerAddressItem[]) => void;
    setErr?: (prev: boolean) => void;
    ChangeLoadStatus?: ({ from, bool }: { from: string; bool: boolean }) => void;
};

function apiBase(): string {
    const base = import.meta.env.VITE_API_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : `${base}/`;
}

function asDigitString(value: unknown): string | null {
    const text = String(value ?? "").trim();
    if (!text) return null;
    return /^\d+$/.test(text) ? text : null;
}

function extractErrorMessage(error: any, fallback: string): string {
    if (typeof error?.msg === "string" && error.msg.trim()) {
        return error.msg.trim();
    }
    if (typeof error?.message === "string" && error.message.trim()) {
        return error.message.trim();
    }
    if (typeof error?.message?.msg === "string" && error.message.msg.trim()) {
        return error.message.msg.trim();
    }
    if (typeof error?.message?.message === "string" && error.message.message.trim()) {
        return error.message.message.trim();
    }
    return fallback;
}

export async function getCustomerAddresses({
    userContext,
    abortController,
    customerCode,
    setData,
    setErr,
    ChangeLoadStatus,
}: GetCustomerAddressesArgs): Promise<CustomerAddressItem[]> {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return [];
    }

    const customer = asDigitString(customerCode);
    if (!customer) {
        enqueueSnackbar("Numero cliente non valido", { title: "Ops..", type: "error" });
        setErr?.(true);
        return [];
    }

    const url = `${apiBase()}customer/addresses/${encodeURIComponent(customer)}`;

    ChangeLoadStatus?.({ from: "data", bool: true });

    try {
        const res = await FetchData<CustomerAddressItem[]>(url, "GET", null, abortController);
        const items = Array.isArray(res) ? res : [];
        setData?.(items);
        return items;
    } catch (error: any) {
        if (error?.name !== "AbortError") {
            enqueueSnackbar(
                extractErrorMessage(
                    error,
                    "Sembra che ci sia stato un problema nel recupero degli indirizzi cliente, contatta un tecnico."
                ),
                { title: "Ops..", type: "error" }
            );
            setErr?.(true);
        }
        throw error;
    } finally {
        ChangeLoadStatus?.({ from: "data", bool: false });
    }
}

export default getCustomerAddresses;
