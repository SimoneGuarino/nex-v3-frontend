import React, { MutableRefObject } from "react"
import { UserMultiRoles } from "./multiRole";
import { VERSION } from "VERSION";

interface SideNavFooterProps {
    menuRef: MutableRefObject<HTMLDivElement | null>;
    setMenuRole: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SideNavFooter: React.FC<SideNavFooterProps> = ({ menuRef, setMenuRole }) => {
    return <React.Fragment>
        <div className="flex flex-col">
            <UserMultiRoles menuRef={menuRef} setMenuRole={setMenuRole} />
            <div className="flex flex-col items-center justify-center mt-2 border-t border-gray-200 dark:border-stone-800">
                <p className="text-xs p-4 text-center text-gray-400 dark:text-gray-600 mt-2 mb-1">
                    @ 2025 NEX v{VERSION}, Focelda S.p.A
                </p>
            </div>
        </div>
    </React.Fragment>
}