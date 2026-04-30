import React, { MutableRefObject } from 'react';

// Global State Hook User
import { UserContext } from "context/UserContext";

import { IoDiamondSharp } from "react-icons/io5";
import { IoIosArrowUp } from "react-icons/io";
import { useMaterialUIController } from 'context/index';

const DiamondIcon = IoDiamondSharp as React.FC<{ size?: number; className?: string }>;
const ArrowUpIcon = IoIosArrowUp as React.FC<{ size?: number; className?: string }>;

interface UserContextProps {
    details: {
        ruolo: string;
        nome: string;
        cognome: string;
        multiRuolo: string[];
    };
    token: string;
};

interface UserMultiRolesProps {
    menuRef: MutableRefObject<HTMLDivElement | null>;
    setMenuRole: React.Dispatch<React.SetStateAction<boolean>>;
};

export const UserMultiRoles: React.FC<UserMultiRolesProps> = ({ menuRef, setMenuRole }) => {
    const [userContext] = React.useContext<UserContextProps | any>(UserContext);
    const [controller] = useMaterialUIController();
    const { miniSidenav } = controller;

    return (
        <div ref={menuRef} translate="no" className={`flex items-center gap-2 p-2 overflow-hidden
            mx-4 rounded-md cursor-pointer 
            bg-gray-100 dark:bg-neutral-800
            hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors duration-200`}
            onClick={_ => setMenuRole(true)}
            data-tooltip-id="general-sidenav-tooltip"
            data-tooltip-content={userContext?.details?.multiRuolo?.length > 0 ? "Cambia Ruolo Attuale" : "Ruolo Attuale"}
        >
            <div className="p-2 bg-teal-500 rounded-md">
                <DiamondIcon size={20} className="text-white" />
            </div>
            {!miniSidenav && <>
                <div>
                    <p className='text-xs uppercase text-neutral-500'>Team</p>
                    <p className='text-sm'>{userContext.details?.ruolo}</p>
                </div>
                {userContext?.details?.multiRuolo?.length > 0 && <ArrowUpIcon size={15} className="ml-auto text-gray-500/70 dark:text-neutral-700" />}
            </>}
        </div>
    )
};