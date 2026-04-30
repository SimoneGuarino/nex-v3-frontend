import { GeneralError } from "components/NoData/generalError";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import React from "react";
import ErrorIMG from 'assets/images/5203299_trasparent.webp';

export const PageNotFound: React.FC<{}> = () => {
    return <DashboardLayout>
        <GeneralError img={ErrorIMG} text="La pagina che attualmente stai cercando non esiste." />
    </DashboardLayout>
}