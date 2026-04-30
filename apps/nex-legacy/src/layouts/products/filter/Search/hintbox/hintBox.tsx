// src/layouts/compare/filter/Search/hintbox/hintBox.tsx
import React, { memo } from "react";

import MDTypography from "components/MDTypography";
import { getDistributorAvatar } from "config/dist_avatars";
import { Avatar } from "@mui/material";

// ---------------------- tipi ----------------------

type HintBoxProps = {
    SendDataAPI: (e_id: string, e_da: string | number) => void;
    setInfiniteSCrollAnim: React.Dispatch<React.SetStateAction<boolean>>;
    prod_name: string;
    SKU: string | number;
    CodiciGTIN?: string | string[] | null;
    from: string;
    _id: string;
    da: string | number;

    // ------- opzionali, passati da searchHere ma non usati qui --------
    itemKey?: number;
    price?: number | string;
    disp?: unknown;
    hintDataStatus?: unknown;
    amazon?: unknown;
    ebay?: unknown;
    userImage?: string;
    userFullName?: string;
    setHintBoxActive?: React.Dispatch<React.SetStateAction<boolean>>;
};

// ---------------------- componente ----------------------

function HintBox(props: HintBoxProps) {
    const { SendDataAPI, setInfiniteSCrollAnim, prod_name, SKU, CodiciGTIN, from, _id, da } = props;

    const callRequestData = () => {
        console.log("HintBox, callRequestData", _id, da);
        setInfiniteSCrollAnim(true);
        SendDataAPI(_id, da);
    };

    const labelColor = "!text-gray-500 dark:!text-gray-400";
    const valueColor = "!text-gray-800 dark:!text-gray-300";

    const distributor = getDistributorAvatar(from);
    const avatarUrl = distributor?.avatarUrl || "";

    // visualizzazione EAN: accetta stringa o array (fallback "Non Presente")
    const eanText =
        Array.isArray(CodiciGTIN)
            ? (CodiciGTIN.length ? CodiciGTIN.join(", ") : "Non Presente")
            : (typeof CodiciGTIN === "string" && CodiciGTIN.trim() !== "" ? CodiciGTIN : "Non Presente");

    return (
        <div onClick={callRequestData} className="itemHintBox w-full">
            <div className="flex items-center gap-3">
                <Avatar src={avatarUrl} className="max-w-[50px] h-8"
                    data-tooltip-id="general-compare-tooltip"
                    data-tooltip-content={from} />
                <div className="flex flex-col gap-1 w-full">
                    <h5 className="!text-base font-medium text-gray-800 dark:text-gray-100"
                        data-tooltip-id="general-compare-tooltip"
                        data-tooltip-content={prod_name}
                    >
                        {prod_name.length > 120 ? prod_name.substring(0, 120) + "..." : prod_name}
                    </h5>

                    <div className="flex flex-wrap md:flex-nowrap gap-6 text-center mt-1">
                        <div className="flex flex-col">
                            <MDTypography component="h5" className={`!text-[0.67rem] ${labelColor}`}>
                                Codice Produttore
                            </MDTypography>
                            <MDTypography component="h5" className={`!text-[0.82rem] !font-light ${valueColor}`}>
                                {String(SKU)}
                            </MDTypography>
                        </div>

                        <div className="flex flex-col">
                            <MDTypography component="h5" className={`!text-[0.67rem] ${labelColor}`}>
                                Codice EAN
                            </MDTypography>
                            <MDTypography component="h5" className={`!text-[0.82rem] !font-light ${valueColor}`}>
                                {eanText}
                            </MDTypography>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(HintBox);
