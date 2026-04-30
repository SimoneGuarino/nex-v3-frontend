import FDButton from "components/UI/buttons/FDButton";
import { CustomersPanel } from "components/UI/panels/customersPanel";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useState } from "react";



export function TestPage() {
    const [aperto, setAperto] = useState(false);
    const cliente = "042760"

    return (
        <DashboardLayout>
            <div className="w-full h-full flex items-center justify-center">
                <FDButton onClick={() => setAperto(true)}>{cliente}</FDButton>
            </div>

            <CustomersPanel
                cliente={cliente}
                openFor={aperto}
                onClose={() => setAperto(false)}
            />
        </DashboardLayout>
    );
}

export default TestPage;
