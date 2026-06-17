import React, { memo } from 'react';

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { FDIconButton } from '@nex/fd-ui';


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type ActionItem = {
    key: string;
    type: "icon" | "icons" | "button" | "custom";
    icon: React.ReactNode;

    title?: string;
    loadState?: boolean;
    funcAction: (...args: any[]) => any; // può ricevere (indexRow, allData) oppure (event, elm)
    ariaLabel?: string;
    onHoverColor?: string;
    dataTour?: string;
};

type CustomActionItem = {
    key: string;
    render: ({elm, index}: {elm: any, index: number}) => React.ReactNode;
    type: "custom";
}

type ColumnConfig = {
    sx?: any;
    fieldToTake: ActionItem[];
    dataTour?: string;
};

interface TypeInfoProps {
    colIndex: ColumnConfig;
    indexRow: number;
    allData: any[];
    elm: any;
    /** opzionale: il chiamante lo passa, anche se qui non lo usiamo */
    handleOpenMenu?: (e: React.MouseEvent<HTMLElement>, data: any[]) => void;
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
function TypeInfo(props: TypeInfoProps): JSX.Element {
    const { colIndex, indexRow, allData, elm } = props;

    /**
     * Renderizza la tipologia di colonna con i bottoni
     * @param data ActionItem (colonna)
     * @param index numero indice
     * @return JSX.Element
     */
    const RenderButtons = (data: ActionItem, index: number) => (
        <Tooltip key={index} title={data.title} disableInteractive>
            <FDIconButton
                icon={data.icon}
                disabled={data.loadState !== undefined ? data.loadState : false}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                    //if (data.key !== "Comments") return data.funcAction(indexRow, allData);
                    //return data.funcAction(e, elm[0] ?? elm);
                    return data.funcAction(indexRow, allData, e);
                }}
                aria-label={data.ariaLabel}
                dataTour={data.dataTour}
            />
        </Tooltip>
    );

    /**
     * Renderizza la tipologia di colonna con le icone
     * @param data ActionItem (colonna)
     * @param index numero indice
     * @return JSX.Element
     */
    const RenderIcons = (data: ActionItem, index: number) => (
        <Tooltip key={index} title={data.title} disableInteractive>
            <span>{data.icon}</span>
        </Tooltip>
    );

    /**
     * Renderizza la tipologia di colonna custom
     * @param data CustomActionItem (colonna)
     * @param index numero indice
     * @return JSX.Element
     */
    const Rendercustom = (data: CustomActionItem, index: number) => data.render({elm, index});

    return (
        <Stack direction="row" width="100%" gap={1.5} height="100%" style={{ overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
            <Stack sx={colIndex.sx}>
                {colIndex.fieldToTake.map((data: ActionItem | CustomActionItem, index) => {
                    switch (data.type) {
                        case "button":
                            return RenderButtons(data as ActionItem, index);
                        case "icon":
                            case "icons":
                            return RenderIcons(data as ActionItem, index);
                        case "custom":
                            return Rendercustom(data as CustomActionItem, index);          
                        default:
                            return RenderButtons(data as ActionItem, index);
                    }
                })}
            </Stack>
        </Stack>
    );
}


export default memo(TypeInfo);
