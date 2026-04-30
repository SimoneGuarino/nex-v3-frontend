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

    // ------- opzionali --------
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
        <div
            onClick={callRequestData}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && callRequestData()}
            className="
        itemHintBox w-full
        cursor-pointer select-none
        px-3 py-2 md:px-3.5 md:py-2.5
        hover:bg-gray-50 dark:hover:bg-white/5
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 rounded
      "
        >
            <div className="flex items-start gap-3 ">
                <Avatar
                    src={avatarUrl}
                    className="w-8 h-8 md:w-10 md:h-10 shrink-0"
                    data-tooltip-id="general-compare-tooltip"
                    data-tooltip-content={from}
                />
                <div className="flex flex-col gap-1 w-full min-w-0">
                    {/* titolo prodotto: 2 righe max su mobile, ellissi */}
                    <h5
                        className={`!text-base md:!text-[1.05rem] font-medium ${valueColor} leading-snug break-words line-clamp-2`}
                        data-tooltip-id="general-compare-tooltip"
                        data-tooltip-content={prod_name}
                    >
                        {prod_name}
                    </h5>

                    {/* blocco dati: su mobile in colonna, da md in riga; testo allineato a sinistra */}
                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 text-left">
                        {/* codice produttore */}
                        <div className="flex flex-col min-w-0">
                            <MDTypography component="h5" className={`!text-[0.67rem] ${labelColor}`}>
                                Codice Produttore
                            </MDTypography>
                            <MDTypography
                                component="h5"
                                className={`!text-[0.82rem] !font-light ${valueColor} break-words`}
                            >
                                {String(SKU)}
                            </MDTypography>
                        </div>

                        {/* EAN (può essere molto lungo) */}
                        <div className="flex flex-col min-w-0">
                            <MDTypography component="h5" className={`!text-[0.67rem] ${labelColor}`}>
                                Codice EAN
                            </MDTypography>
                            <MDTypography
                                component="h5"
                                className={`!text-[0.82rem] !font-light ${valueColor} break-words break-all`}
                            >
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
