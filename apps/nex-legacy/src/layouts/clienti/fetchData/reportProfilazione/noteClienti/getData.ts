import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { ChangeLoadArgs, ImpaginationState, NotesFederatedCursor } from "components/UI/panels/customerNotes";

export function getData({
    userContext,
    abortController,
    body,
    offset,
    cursor,
    useCursor,
    setData,
    setErr,
    ChangeLoadStatus,
    changeMainLoadStatus,
    setPagination,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    body: { [key: string]: any };
    offset: React.MutableRefObject<number>;
    cursor: React.MutableRefObject<NotesFederatedCursor | null>;
    useCursor: boolean;
    setData: (updater: any) => void;
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadArgs) => void;
    changeMainLoadStatus?: any;
    setPagination: React.Dispatch<React.SetStateAction<ImpaginationState>>;
}): Promise<any> {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const PAGE_SIZE = 50;
    const hasCursor = !!cursor?.current;
    const ofs =
        offset && typeof offset.current === "number" && offset.current >= 0
            ? offset.current
            : 0;

    const url = hasCursor
        ? `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/report/note-clienti/list`
        : `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/report/note-clienti/list?ofs=${ofs}`;

    const payload = hasCursor
        ? { ...body, limit: PAGE_SIZE, cursor: cursor.current }
        : { ...body, limit: PAGE_SIZE };

    return FetchData(url, "POST", payload, abortController)
        .then((res: any) => {
            const items = Array.isArray(res?.items) ? res.items : [];
            const nextCursor = res?.nextCursor ?? null;
            const hasMore = !!res?.hasMore;

            setPagination((prev) => ({
                ...prev,
                hasMore,
                nextOffset: hasCursor ? prev?.nextOffset : ofs + items.length,
                cursor: nextCursor,
            }));

            setData((prev: any[]) => {
                if (useCursor) {
                    return cursor?.current ? [...(prev || []), ...items] : items;
                }

                if (ofs > 0) {
                    return [...(prev || []), ...items];
                }

                return items;
            });

            if (nextCursor) {
                cursor.current = nextCursor;
            }

            if (!hasCursor) {
                offset.current = ofs + items.length;
            }

            if (!hasCursor && ofs === 0) {
                ChangeLoadStatus({ from: "search", bool: false });
                changeMainLoadStatus?.({ from: "search", bool: false });
            } else if (hasCursor && !body?.cursor) {
                ChangeLoadStatus({ from: "search", bool: false });
                changeMainLoadStatus?.({ from: "search", bool: false });
            }

            return true;
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({ from: "search", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema nel retrive dei dati nella tabella delle note clienti, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = error.msg || error.message;
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}