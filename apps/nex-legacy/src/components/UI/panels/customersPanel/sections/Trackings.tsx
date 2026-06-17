import React from "react";
import { useNavigate } from "react-router-dom";
import { IoCopy } from "react-icons/io5";
import { RxOpenInNewWindow } from "react-icons/rx";
import { enqueueSnackbar } from "components/MessageBox";
import { ContextMenu } from "@nex/fd-ui";
import { CopyToClipboard } from "utils/string/copy";
import type { PanelMode, TrackingPreviewRow, TrackingsDetailsPayload } from "../types";
import { cn, formatDateMaybe, formatNumberIt, toDisplayText } from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionContainer,
    SectionHeader,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

const PREVIEW_LIMIT = 5;

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <td className={cn("px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300", className)}>
        {children}
    </td>
);

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th
        className={cn(
            "px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50",
            className
        )}
    >
        {children}
    </th>
);

function hasValue(value: unknown): boolean {
    return String(value ?? "").trim().length > 0;
}

function pickField(row: TrackingPreviewRow, keys: string[]): unknown {
    for (const key of keys) {
        const value = row?.[key];
        if (hasValue(value)) return value;
    }
    return undefined;
}

function toTrackingHref(url: unknown): string {
    const raw = String(url ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
}

function toDateTimestamp(value: unknown): number {
    const text = String(value ?? "").trim();
    if (!text) return Number.NEGATIVE_INFINITY;

    if (/^\d{8}$/.test(text)) {
        const year = Number(text.slice(0, 4));
        const month = Number(text.slice(4, 6));
        const day = Number(text.slice(6, 8));
        return new Date(year, month - 1, day).getTime();
    }

    const parsed = new Date(text).getTime();
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

export const Trackings: React.FC<{
    mode: PanelMode;
    customerCode: string | number;
    details?: TrackingsDetailsPayload | null;
}> = ({ mode, customerCode, details }) => {
    const navigate = useNavigate();
    const isSummary = mode === "summary";
    const normalizedCustomerCode = String(customerCode ?? "").trim();
    const trackingMenuAnchorRef = React.useRef<HTMLButtonElement | null>(null);
    const [openTrackingMenuFor, setOpenTrackingMenuFor] = React.useState<string | null>(null);
    const [selectedTrackingHref, setSelectedTrackingHref] = React.useState("");

    const items = React.useMemo<TrackingPreviewRow[]>(
        () => (Array.isArray(details?.items) ? (details?.items as TrackingPreviewRow[]) : []),
        [details?.items]
    );
    const total = Number(details?.total ?? 0) || 0;

    const previewRows = React.useMemo(() => {
        const sorted = [...items].sort((a, b) => {
            const dateA = toDateTimestamp(
                pickField(a, ["DATA_INSERIMENTO_TRACKING", "data_inserimento_tracking", "dataInserimentoTracking"])
            );
            const dateB = toDateTimestamp(
                pickField(b, ["DATA_INSERIMENTO_TRACKING", "data_inserimento_tracking", "dataInserimentoTracking"])
            );
            return dateB - dateA;
        });

        return sorted.slice(0, PREVIEW_LIMIT);
    }, [items]);

    const handleOpenTrackings = React.useCallback(() => {
        if (!normalizedCustomerCode) return;

        const customerFilter = [{ codice: normalizedCustomerCode }];
        navigate("/logistica/trackings", {
            state: {
                payload: { ccli: customerFilter },
                ccli: customerFilter,
            },
        });
    }, [navigate, normalizedCustomerCode]);

    const closeTrackingMenu = React.useCallback(() => {
        setOpenTrackingMenuFor(null);
        setSelectedTrackingHref("");
    }, []);

    const openTrackingMenu = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>, rowId: string, rawUrl: unknown) => {
            const href = toTrackingHref(rawUrl);
            if (!href) return;

            event.stopPropagation();
            trackingMenuAnchorRef.current = event.currentTarget;
            setSelectedTrackingHref(href);
            setOpenTrackingMenuFor(rowId);
        },
        []
    );

    const copyTrackingUrl = React.useCallback(async () => {
        if (!selectedTrackingHref) return;

        const copied = await CopyToClipboard(selectedTrackingHref, {
            preserveSelection: true,
        });

        enqueueSnackbar(
            copied
                ? "URL tracking copiato negli appunti."
                : "Impossibile copiare l'URL tracking.",
            {
                title: copied ? "Successo" : "Ops..",
                type: copied ? "success" : "error",
            }
        );

        closeTrackingMenu();
    }, [closeTrackingMenu, selectedTrackingHref]);

    const openTrackingUrl = React.useCallback(() => {
        if (!selectedTrackingHref) return;
        window.open(selectedTrackingHref, "_blank", "noopener,noreferrer");
        closeTrackingMenu();
    }, [closeTrackingMenu, selectedTrackingHref]);

    if (!isSummary) return null;

    return (
        <SectionContainer dataTour="scheda-cliente-trakings">
            <SectionHeader
                title="Trackings"
                description={`${formatNumberIt(total)} tracking totali`}
                rightContent={
                    total > 0 && normalizedCustomerCode ? (
                        <SectionActionButton
                            rightIcon={FaPlus({})}
                            onClick={handleOpenTrackings}>
                            Dettagli
                        </SectionActionButton>
                    ) : null
                }
            />

            {previewRows.length > 0 ? (
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                    <TableHeader>Data</TableHeader>
                                    <TableHeader>Corriere</TableHeader>
                                    <TableHeader>Num FB</TableHeader>
                                    <TableHeader>Tracking</TableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row, idx) => {
                                    const dateValue = pickField(row, [
                                        "DATA_INSERIMENTO_TRACKING",
                                        "data_inserimento_tracking",
                                        "dataInserimentoTracking",
                                    ]);
                                    const courierValue = pickField(row, ["CORRIERE", "corriere"]);
                                    const fbValue = pickField(row, ["NUM_FB", "num_fb", "numFb"]);
                                    const trackingUrl = pickField(row, [
                                        "URL_TRACKING",
                                        "url_tracking",
                                        "urlTracking",
                                        "tracking",
                                    ]);
                                    const rowId = `${toDisplayText(fbValue)}-${toDisplayText(dateValue)}-${idx}`;
                                    const hasTrackingUrl = toTrackingHref(trackingUrl).length > 0;

                                    return (
                                        <tr
                                            key={rowId}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                        >
                                            <TableCell>{formatDateMaybe(dateValue)}</TableCell>
                                            <TableCell>{toDisplayText(courierValue)}</TableCell>
                                            <TableCell>{toDisplayText(fbValue)}</TableCell>
                                            <TableCell>
                                                {hasTrackingUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={(event) =>
                                                            openTrackingMenu(event, rowId, trackingUrl)
                                                        }
                                                        className="font-medium text-sky-700 hover:text-sky-800 hover:underline dark:text-sky-300 dark:hover:text-sky-200 cursor-pointer"
                                                    >
                                                        Tracking
                                                    </button>
                                                ) : (
                                                    <span className="text-neutral-400 dark:text-neutral-500">-</span>
                                                )}
                                            </TableCell>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-6 text-center">
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        Nessun tracking disponibile
                    </p>
                </div>
            )}

            <ContextMenu
                openFor={openTrackingMenuFor}
                onClose={closeTrackingMenu}
                pos={trackingMenuAnchorRef}
                menuButtons={[
                    {
                        title: "Copia",
                        icon: IoCopy({}),
                        onClick: copyTrackingUrl,
                    },
                    {
                        title: "Apri",
                        icon: RxOpenInNewWindow({}),
                        onClick: openTrackingUrl,
                    },
                ]}
            />
        </SectionContainer>
    );
};
