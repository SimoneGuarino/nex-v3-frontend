import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { resolveTrackingsErrorMessage } from "../utils/helpers";

const PAGE_SIZE = 50;

type ChangeLoadStatusArgs = {
    from: string;
    bool: boolean;
};

type OffsetRef = {
    current: number;
};

export function getData({
    userContext,
    abortController,
    body,
    offset,
    setData,
    setErr,
    ChangeLoadStatus,
    setTotal,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    body: { [key: string]: any };
    offset: OffsetRef | any;
    setData: (updater: any) => void;
    setErr?: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
    setTotal?: (n: number) => void;
}): Promise<any> {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const ofs =
        offset && typeof offset.current === "number" && offset.current >= 0
            ? offset.current
            : 0;

    const url = `${import.meta.env.VITE_API_API_LOGISTICS}trackings?ofs=${ofs}`;
    const payload = { ...body, offset: ofs, limit: PAGE_SIZE };

    return FetchData(url, "POST", payload, abortController)
        .then((res: any) => {
            const items = Array.isArray(res?.items) ? res.items : [];

            if (typeof setTotal === "function" && Number.isFinite(res?.total)) {
                setTotal(Number(res.total));
            }

            setData((prev: any[]) => (ofs === 0 ? items : [...(prev || []), ...items]));
            ChangeLoadStatus({ from: "infiniteScroll", bool: false });
            if (ofs === 0) {
                ChangeLoadStatus({ from: "search", bool: false });
            }

            offset.current = ofs + items.length;
            return true;
        })
        .catch((error: any) => {
            if (error?.name !== "AbortError") {
                ChangeLoadStatus({ from: "infiniteScroll", bool: false });
                ChangeLoadStatus({ from: "search", bool: false });
                console.error(error);

                const fallbackMessage =
                    "Sembra che ci sia stato un problema nel retrive dei tracking cliente, perfavore contatta un tecnico.";
                const errorMessage = resolveTrackingsErrorMessage(error, fallbackMessage);

                enqueueSnackbar(errorMessage, {
                    title: "Ops..",
                    type: "error",
                });
                setErr?.(true);
            }

            throw error;
        });
}
