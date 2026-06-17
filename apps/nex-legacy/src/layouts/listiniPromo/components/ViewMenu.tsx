//src\layouts\listiniPromo\components\ViewMenu.tsx

import React, { MutableRefObject, useMemo } from "react";
import { MdGridView, MdViewList, MdCheck } from "react-icons/md";
import { ContextMenu } from "@nex/fd-ui";

const MdGridViewIcon = MdGridView as React.FC<{ size?: number; className?: string }>;
const MdViewListIcon = MdViewList as React.FC<{ size?: number; className?: string }>;
const MdCheckIcon = MdCheck as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type ViewType = "grid" | "list";

type Props = {
    open: boolean; //true se il menu è visibile
    anchorRef: MutableRefObject<HTMLDivElement | null>; //ref dell’elemento che ancora il menu
    view: ViewType; //vista attuale selezionata
    onClose: () => void; //callback chiusura menu
    onChangeView: (view: ViewType) => void; //callback cambio vista (grid/list)
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * ViewMenu:
 * menu contestuale per cambiare la vista dei risultati (griglia/lista).
 * Mostra un check sulla vista attiva.
 * @returns
 */
const ViewMenu: React.FC<Props> = ({
    open,
    anchorRef,
    view,
    onClose,
    onChangeView,
}) => {
    const viewMenuButtons = useMemo(
        () => [
            {
                title: "Griglia",
                icon:
                    view === "grid" ? (
                        <MdCheckIcon size={16} />
                    ) : (
                        <MdGridViewIcon size={16} />
                    ),
                onClick: () => onChangeView("grid"), //switch vista griglia
                action: true,
                className: view === "grid" ? "bg-[#2e2e2e]" : undefined, //evidenzia item attivo
            },
            {
                title: "Lista",
                icon:
                    view === "list" ? (
                        <MdCheckIcon size={16} />
                    ) : (
                        <MdViewListIcon size={16} />
                    ),
                onClick: () => onChangeView("list"), //switch vista lista
                action: true,
                className: view === "list" ? "bg-[#2e2e2e]" : undefined, //evidenzia item attivo
            },
        ],
        [view, onChangeView]
    ); //bottoni menu derivati dalla view corrente

    return (
        <ContextMenu
            openFor={open}
            onClose={onClose}
            pos={anchorRef}
            placement="auto"
            menuButtons={viewMenuButtons}
        />
    );
};

export default ViewMenu;
