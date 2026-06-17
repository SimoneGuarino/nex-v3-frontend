//src\layouts\sellout\components\ControlButtons.tsx

import React from "react";
import { FDIconButton } from "@nex/fd-ui";
import { IoCheckmark } from "react-icons/io5";
import { HiOutlineXMark } from "react-icons/hi2";
import { MdUpload } from "react-icons/md";
import { HiDownload } from "react-icons/hi";
import { type SelloutFile } from "layouts/sellout/fetchdata/list";
import { Tooltip } from "react-tooltip";

/** objectId-like di Mongo */
const isObjectIdLike = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

const getMongoId = (row: SelloutFile): string | null => {
    const cand1 = (row as any)?._id;
    if (isObjectIdLike(cand1)) return cand1;
    const cand2 = (row as any)?.id;
    if (isObjectIdLike(cand2)) return cand2;
    return null;
};

export type ControlButtonsProps = {
    row: SelloutFile;
    onDownload: (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => void;
    onApprove: (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => void;
    onReject: (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => void;
    onUploadClick: (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => void;
    /** se l’azione async è in corso per questa riga */
    busy?: boolean;
    /** true se dopo upload alternativo va abilitato Approva da “Bocciato” */
    uploadedOk?: boolean;
};

const ControlButtons: React.FC<ControlButtonsProps> = ({
    row,
    onDownload,
    onApprove,
    onReject,
    onUploadClick,
    busy,
    uploadedOk = false,
}) => {
    const stato = row.stato as string | null | undefined;
    const mongoId = getMongoId(row);
    const showOnlyDownload = stato == null || String(stato) === "Approvato" || !mongoId;

    if (showOnlyDownload) {
        return (
            <div className="flex items-center gap-2" data-tour="sellout-download">
                <FDIconButton
                    icon={HiDownload({ width: 20, height: 20 })}
                    aria-label="Download"
                    onClick={(e) => onDownload(row, e)}
                    dataTooltipId="contol-buttons-tooltip"
                    dataTooltipContent="Download"
                    data-allow-true
                />
            </div>
        );
    }

    const isInRevisione = String(stato) === "In Revisione";
    const isBocciato = String(stato) === "Bocciato";
    const approveDisabled = !!busy || (isBocciato && !uploadedOk);
    const rejectDisabled = !!busy ? true : false;
    const uploadDisabled = isInRevisione;

    return (
        <div className="flex items-center gap-2">
            <FDIconButton
                icon={IoCheckmark({ width: 20, height: 20 })}
                aria-label="Approva"
                onClick={(e) => onApprove(row, e)}
                disabled={approveDisabled}
                dataTooltipId="contol-buttons-tooltip"
                dataTooltipContent="Approva"
            />
            <FDIconButton
                icon={HiOutlineXMark({ width: 20, height: 20 })}
                aria-label="Boccia"
                onClick={(e) => onReject(row, e)}
                disabled={rejectDisabled}
                dataTooltipId="contol-buttons-tooltip"
                dataTooltipContent="Boccia"
            />
            <FDIconButton
                icon={MdUpload({ width: 20, height: 20 })}
                aria-label="Upload"
                onClick={(e) => onUploadClick(row, e)}
                disabled={uploadDisabled}
                variant={uploadedOk ? ("success" as any) : undefined}
                dataTooltipId="contol-buttons-tooltip"
                dataTooltipContent="Upload"
            />
            <FDIconButton
                icon={HiDownload({ width: 20, height: 20 })}
                aria-label="Download"
                onClick={(e) => onDownload(row, e)}
                dataTooltipId="contol-buttons-tooltip"
                dataTooltipContent="Download"
            />
            <Tooltip
                id="contol-buttons-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </div>

    );
};

export default ControlButtons;
