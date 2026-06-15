import React from "react";
import { FDDialog } from "@nex/fd-ui";
import { TableVirtualized } from "components/Virtualized/table";
import { getCustomerAddresses, type CustomerAddressItem } from "../fetchData/getCustomerAddresses";

type AddressesDialogProps = {
    open: boolean;
    onClose: () => void;
    userContext: { [key: string]: any };
    customerCode?: string | null;
    customerLabel?: string | null;
};

function asDigitString(value: unknown): string | null {
    const text = String(value ?? "").trim();
    if (!text) return null;
    return /^\d+$/.test(text) ? text : null;
}

export default function AddressesDialog({
    open,
    onClose,
    userContext,
    customerCode,
    customerLabel,
}: AddressesDialogProps) {
    const [rows, setRows] = React.useState<CustomerAddressItem[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const abortRef = React.useRef<AbortController | null>(null);
    const token = String(userContext?.token ?? "").trim();
    const validCustomerCode = asDigitString(customerCode);

    React.useEffect(() => {
        if (!open) {
            abortRef.current?.abort();
            abortRef.current = null;
            setRows([]);
            setHasError(false);
            setLoading(false);
            return;
        }

        if (!token || !validCustomerCode) {
            setRows([]);
            setHasError(false);
            setLoading(false);
            return;
        }

        const abortController = new AbortController();
        abortRef.current?.abort();
        abortRef.current = abortController;
        setLoading(true);
        setHasError(false);

        getCustomerAddresses({
            userContext: { token },
            abortController,
            customerCode: validCustomerCode,
            setData: setRows,
            setErr: setHasError,
        })
            .catch((error: any) => {
                if (error?.name !== "AbortError") {
                    console.error(error);
                }
            })
            .finally(() => {
                if (abortRef.current === abortController) {
                    abortRef.current = null;
                    setLoading(false);
                }
            });

        return () => {
            abortController.abort();
            if (abortRef.current === abortController) {
                abortRef.current = null;
            }
        };
    }, [open, token, validCustomerCode]);

    const title = `Indirizzi cliente ${String(customerCode ?? "").trim() || "-"}${customerLabel ? ` - ${customerLabel}` : ""}`;
    const showTable = loading || rows.length > 0;

    return (
        <FDDialog
            open={open}
            onClose={onClose}
            hideActions
            size="full"
            title={title}
            className="max-w-7xl"
        >
            <div className="h-[68vh] min-h-[360px]">
                {showTable ? (
                    <TableVirtualized
                        data={rows}
                        setData={setRows}
                        tableName="Indirizzi Cliente"
                        textCenter
                        loadStatus={loading}
                        results={rows.length}
                        whereToFindData={false}
                        footer={false}
                        className="h-full"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-neutral-600 dark:text-neutral-300">
                        {hasError
                            ? "Impossibile recuperare gli indirizzi del cliente."
                            : "Nessun indirizzo disponibile per questo cliente."}
                    </div>
                )}
            </div>
        </FDDialog>
    );
}
