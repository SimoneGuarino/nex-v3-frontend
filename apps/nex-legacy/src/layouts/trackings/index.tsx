import { useUserContext } from "context/UserContext";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useLocation } from "react-router-dom";
import Loader from "../../Loader";
import { useTrackingsState } from "layouts/trackings/hook/useTrackingsState";

import TablePanel from "./components/TablePanel";
import Topbar from "./components/Topbar";
import { Tooltip } from "react-tooltip";

type TrackingsLocationState = {
    payload?: {
        ccli?: Array<{ codice?: string | null }>;
    };
    ccli?: Array<{ codice?: string | null }>;
};

/**
 * Pagina trackings.
 * La logica applicativa e demandata all'hook dedicato e ai componenti specializzati.
 */
export default function Trackings() {
    const location = useLocation();

    /** Contesto utente usato per bootstrap e fetch del layout trackings. */
    const [userContext] = useUserContext();
    const state = (location.state || null) as TrackingsLocationState | null;
    const initialCustomerCode = String(
        state?.payload?.ccli?.[0]?.codice ?? state?.ccli?.[0]?.codice ?? ""
    ).trim();

    /** Hook feature-specifico che incapsula stato, fetch e azioni del layout. */
    const { filters, table, trackingMenu, handleSearch } = useTrackingsState({
        userContext: userContext || undefined,
        initialCustomerCode,
    });

    if (userContext?.details === null) {
        return <>Error Loading Trackings</>;
    }

    if (!userContext?.details) {
        return (
            <div>
                <Loader />
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-2 h-full">
                <Topbar
                    onSearch={handleSearch}
                    searching={table.loadStatus.search || table.loadStatus.table}
                    filters={filters}
                />
                <TablePanel table={table} trackingMenu={trackingMenu} />
            </div>

            <Tooltip
                id="trackings-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </DashboardLayout>
    );
}
