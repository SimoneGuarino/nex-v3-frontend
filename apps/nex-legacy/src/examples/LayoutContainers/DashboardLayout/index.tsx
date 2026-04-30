import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useMaterialUIController, setLayout } from "context/index";
import FDBox from "components/UI/box/FDBox";

export interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [controller, dispatch] = useMaterialUIController() as any;
    const { miniSidenav } = controller ?? {};
    const { pathname } = useLocation();

    useEffect(() => {
        setLayout(dispatch, "dashboard");
    }, [pathname, dispatch]);

    // replicate breakpoints.up("xl") margin-left dinamico + transizione
    const xlMargin = miniSidenav ? "xl:ml-[105px]" : "xl:ml-[300px]";

    return (
        <FDBox
            className={`p-3 relative h-full flex flex-col ${xlMargin}`}
            variant="ghost"
            color="light"
            asMotion={true}
        >
            {children}
        </FDBox>
    );
};

export default DashboardLayout;