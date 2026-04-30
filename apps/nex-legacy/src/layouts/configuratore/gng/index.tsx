import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import conf from "./conf.json";
import { useMemo } from "react";

export default function ConfiguratorPanel() {
    const token = import.meta.env.VITE_GNG_API_KEY;

    // Crea un blob URL stabile del JSON
    const confUrl = useMemo(() => {
        const blob = new Blob([JSON.stringify(conf)], { type: "application/json" });
        return URL.createObjectURL(blob);
    }, [conf]);


    return <DashboardLayout>
        <div className="w-full h-full">
            {(token && confUrl) && (
                <gg-configurator
                    data-client="ACME123"
                    data-token={token}
                    data-conf={confUrl}
                    data-poll="15"
                    style={{ display: "block", width: "100%", minHeight: 600 }}
                    // opzionale: cambia key per forzare re-mount quando cambia il token
                    key={token + "|" + confUrl}
                />
            )}
        </div>

    </DashboardLayout>
}
