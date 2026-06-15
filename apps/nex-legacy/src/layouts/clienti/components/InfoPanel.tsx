import React from "react";
import { NumberToEuro } from "utils/numberToEuro";
import { FDBox } from "@nex/fd-ui";
import { useNexTheme } from "@nex/theme-system";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface InfoPanelProps {
    data: Array<object>; //righe attualmente caricate (usate solo per capire se mostrare i totali)
    extraTotalprops: {
        sfrs: number; //somma fido residuo
        sftot: number; //somma fido totale
    };
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pannello riassuntivo Totali (usato in FidoView).
 * Mostra "Fido Residuo" e "Fido Totale" formattati in EUR.
 * @returns
 */
export const InfoPanel: React.FC<InfoPanelProps> = ({ data, extraTotalprops }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    /**
     * Genera le card dei totali (se ci sono righe).
     * @returns
     */
    const GenereteTotals = () => {
        if (!data || (data && data.length === 0)) return null;

        const propToTake = [
            { name: "Fido Residuo", keyProp: "sfrs" },
            { name: "Fido Totale", keyProp: "sftot" },
        ];

        const ret_: React.ReactNode[] = [];

        for (let i = 0; i < propToTake.length; i++) {
            const name = propToTake[i].name;
            const val_ = (extraTotalprops as any)[propToTake[i].keyProp];

            ret_.push(
                <div key={i} className="flex flex-col items-center gap-1">
                    <span
                        className={`${darkMode ? "bg-gray-700" : "bg-gray-300"
                            } px-2 rounded-full text-sm py-1 flex items-center justify-center`}
                    >
                        {name}
                    </span>

                    <span className="text-sm">{NumberToEuro({ convert: val_ })}</span>
                </div>
            );
        }

        return <div className="flex items-center gap-7">{ret_}</div>;
    };

    return (
        <FDBox radius="lg" pad="md">
            <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Totale</span>
                <div className="flex items-center gap-2">{GenereteTotals()}</div>
            </div>
        </FDBox>
    );
};
