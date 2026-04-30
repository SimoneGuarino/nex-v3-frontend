import { useContext, useEffect, useState } from "react";
//componenti
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { GeneralError } from "components/NoData/generalError";
import ErrorIMG from "assets/images/5203299_trasparent.webp";
import Topbar from "./components/Topbar";
import TablePanel from "./components/TablePanel";
//context
import { AIContext } from "context/AIContext";
//utils
import { downloadCsvFromRows } from "utils/exportCsv";
import { downloadXlsxFromRows } from "utils/exportXlsx";
import { useBuyerAssistant } from "./hook/useBuyerAssistant";


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function BuyerAssistant() {
    const { setOpen } = useContext(AIContext); //setopen del AIContext per aprire il pannello AI appena si entra in pagina
    const {
        tableData, setTableData,
        tableTotalData,
        filters, setFilters,
        handleChangeFilters,
        err, setErr,
        loading,
        runSearch,
    } = useBuyerAssistant(); //hook principale per la gestione della logica del buyer assistant (fetch dati, filtri, stati di loading/errore, ecc.)

    const [tableExportSnapshot, setTableExportSnapshot] = useState<{
        rows: Record<string, unknown>[];
        columns: string[];
    }>({ rows: [], columns: [] }); //state per settare i filtri attivi


    // ——————————————————————————————————————————————————————————
    // EFFECTS
    // ——————————————————————————————————————————————————————————
    useEffect(() => {
        // apre il pannello AI all'ingresso
        setOpen(true);
    }, []);

    /**
     * handleDownloadTableCsv
     * Trigger CSV export for the current `tableExportSnapshot`.
     */
    const handleDownloadTableCsv = () => {
        downloadCsvFromRows(tableExportSnapshot.rows, {
            columns: tableExportSnapshot.columns,
            filenameBase: "buyer-assistant-tabella",
        });
    };

    /**
     * handleDownloadTableXlsx
     * Trigger XLSX export for the current `tableExportSnapshot`.
     */
    const handleDownloadTableXlsx = () => {
        downloadXlsxFromRows(tableExportSnapshot.rows, {
            columns: tableExportSnapshot.columns,
            filenameBase: "buyer-assistant-tabella",
        });
    };


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <DashboardLayout>
            {!err ? (
                <div className="w-full h-full flex flex-col gap-2">
                    <Topbar
                        handleChangeFilters={handleChangeFilters}
                        filters={filters} setFilters={setFilters}
                        onDownloadTableCsv={handleDownloadTableCsv}
                        canDownloadTableCsv={tableExportSnapshot.rows.length > 0 && tableExportSnapshot.columns.length > 0}
                        onDownloadTableXlsx={handleDownloadTableXlsx}
                        canDownloadTableXlsx={tableExportSnapshot.rows.length > 0 && tableExportSnapshot.columns.length > 0}
                        runSearch={runSearch}
                    />
                    <TablePanel
                        tableData={tableData} setTableData={setTableData}
                        tableTotalData={tableTotalData}
                        filters={filters}
                        loading={loading.table_of_products}
                        onExportSnapshotChange={setTableExportSnapshot}
                    />
                </div>
            ) : (
                <GeneralError img={ErrorIMG} />
            )}
        </DashboardLayout>
    );
};

export default BuyerAssistant;