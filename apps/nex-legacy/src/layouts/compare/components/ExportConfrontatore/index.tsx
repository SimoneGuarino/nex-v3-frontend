import { useMemo, useState, useEffect, useRef } from "react";
import ExportConfrontatoreRoot, { ExportConfrontatoreRootProps } from "layouts/compare/components/ExportConfrontatore/ExportConfrontatoreRoot";
import { MenuItem, Select, FormControl, InputLabel, LinearProgress, OutlinedInput, IconButton, Tooltip } from "@mui/material";

import { DownloadConfrontatoreFileV2 } from "layouts/compare/virtualziedTable/fetchData/confrontatore-v2";
import { Tag } from "components/Tag/Tag";
import { FDBox, FDButton } from "@nex/fd-ui";
import { MdOutlineKeyboardArrowUp, MdClose as MdCloseRaw } from "react-icons/md";
import { IoNewspaperOutline } from "react-icons/io5";

const ExpandLess = MdOutlineKeyboardArrowUp as React.FC<{ size?: number; className?: string }>;
const CloseIcon = MdCloseRaw as React.FC<{ size?: number; className?: string }>;
const NewIcon = IoNewspaperOutline as React.FC<{ size?: number; className?: string }>;

type JobStatus = "pending" | "running" | "done" | "error";
type DaysWindow = 7 | 14 | 30;

type ExportConfrontatoreProps = {
    open?: boolean;
    onClose?: () => void;
    distList: string[];
    userContext: { token: string };
    darkMode: boolean;
    pollIntervalMs?: number;
    disabled?: boolean;
};

const DEFAULT_FORMAT: "CSV" | "XLSX" = "CSV";
const DEFAULT_RANGE: DaysWindow = 7;

const ExportConfrontatore = ({
    open = false,
    onClose,
    distList,
    userContext,
    darkMode,
    pollIntervalMs = 6000,
    disabled = false,
}: ExportConfrontatoreProps) => {
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<"CSV" | "XLSX">(DEFAULT_FORMAT);
    const [selectedRangeDays, setSelectedRangeDays] = useState<DaysWindow>(DEFAULT_RANGE);

    const [exportLoading, setExportLoading] = useState(false);
    const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
    const [writtenRows, setWrittenRows] = useState(0);

    const [openSuppliers, setOpenSuppliers] = useState(false);
    const [openFormat, setOpenFormat] = useState(false);
    const [openRange, setOpenRange] = useState(false);

    // NEW: controller per abort (poll + cancel)
    const abortRef = useRef<AbortController | null>(null);

    const ownerState: ExportConfrontatoreRootProps["ownerState"] = useMemo(
        () => ({ open, darkMode, loading: exportLoading }),
        [open, darkMode, exportLoading]
    );

    const statusLabel = useMemo(() => {
        if (!jobStatus) return "in attesa di avvio";
        if (jobStatus === "pending") return "preparazione in corso…";
        if (jobStatus === "running") return "generazione in corso…";
        if (jobStatus === "done") return "completato";
        if (jobStatus === "error") return "errore";
        return jobStatus;
    }, [jobStatus]);

    const resetAll = () => {
        setSelectedSuppliers([]);
        setSelectedFormat(DEFAULT_FORMAT);
        setSelectedRangeDays(DEFAULT_RANGE);

        setExportLoading(false);
        setJobStatus(null);
        setWrittenRows(0);

        setOpenSuppliers(false);
        setOpenFormat(false);
        setOpenRange(false);
    };

    const handleClose = (force = false) => {
        if (exportLoading && !force) {
            // NEW: se l’utente chiude mentre sta esportando -> abort + cancel best effort
            abortRef.current?.abort();
        }
        resetAll();
        onClose?.();
    };

    // reset automatico quando il dialog viene chiuso dal parent
    useEffect(() => {
        if (!open) {
            abortRef.current?.abort();
            abortRef.current = null;
            resetAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // NEW: cleanup su unmount
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleSubmit = async () => {
        if (disabled) return;
        if (!selectedSuppliers.length || !selectedFormat) return;
        if (!userContext?.token) return;

        setExportLoading(true);
        setJobStatus("pending");
        setWrittenRows(0);

        const fmt = selectedFormat.toLowerCase() as "csv" | "xlsx";

        // NEW: controller per questa run
        const ac = new AbortController();
        abortRef.current = ac;

        try {
            await DownloadConfrontatoreFileV2({
                suppliers: selectedSuppliers,
                format: fmt,
                rangeDays: selectedRangeDays,
                onStatus: ({ status, writtenRows }) => {
                    setJobStatus(status as JobStatus);
                    setWrittenRows(Number(writtenRows || 0));
                },
                pollIntervalMs,
                signal: ac.signal,
            });

            // se non è stato abortato, chiudi normalmente
            if (!ac.signal.aborted) handleClose(true);
        } catch {
            // error già gestito/notificato dalla fetch
        } finally {
            setExportLoading(false);
            if (abortRef.current === ac) abortRef.current = null;
        }
    };

    const showProgress = exportLoading || Boolean(jobStatus);

    const getIcon = (isOpen: boolean): JSX.Element => (
        <ExpandLess
            className={`
        absolute 
        right-3 
        top-1/2 
        -translate-y-1/2
        transform-gpu 
        transition-transform 
        duration-150 
        ease-in 
        pointer-events-none
        ${isOpen ? "rotate-0" : "rotate-180"}
        ${darkMode ? "text-white" : "text-[#555]"}
      `}
        />
    );

    
    return (
        <ExportConfrontatoreRoot ownerState={ownerState} open={open} onClose={() => handleClose(false)}>
            <div className="flex flex-auto flex-col items-center h-full w-full">
                <div className="p-2 mb-5">
                    <p className="text-sm italic border-2 border-dashed border-blue-500 bg-blue-100 text-blue-800 rounded-md px-4 py-2">
                        <NewIcon size={20} className="inline-block mr-2 mb-1" /> Novità: il file di esportazione ora include le colonne
                        <strong> Venduto Focelda</strong> e <strong>Media del venduto dei fornitori</strong>, entrambi in base al
                        periodo temporale selezionato.
                    </p>
                </div>

                {/* Fornitori */}
                <FormControl fullWidth sx={{ mb: 3, position: "relative" }}>
                    <InputLabel id="suppliers-label" required>
                        Seleziona i fornitori
                    </InputLabel>
                    <Select
                        required
                        multiple
                        labelId="suppliers-label"
                        value={selectedSuppliers}
                        label="Seleziona i fornitori"
                        onChange={(e) => setSelectedSuppliers(e.target.value as string[])}
                        onOpen={() => setOpenSuppliers(true)}
                        onClose={() => setOpenSuppliers(false)}
                        input={<OutlinedInput label="Seleziona i fornitori" />}
                        className="p-3 text-left"
                        endAdornment={getIcon(openSuppliers)}
                        disabled={disabled || exportLoading || showProgress}
                        renderValue={(selected: unknown) => {
                            const values = (selected as string[]) || [];
                            return (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {values.map((value) => (
                                        <Tag key={value} text={value} />
                                    ))}
                                </div>
                            );
                        }}
                        MenuProps={{
                            PaperProps: {
                                className: "max-h-[60vh] w-[min(92vw,520px)] sm:w-auto overflow-y-auto",
                            },
                        }}
                    >
                        {(distList || []).map((opt) => (
                            <MenuItem key={opt} value={opt}>
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>

                    {selectedSuppliers.length > 0 && (
                        <Tooltip title="Svuota tutto">
                            <IconButton
                                aria-label="svuota tutto"
                                size="small"
                                onClick={resetAll}
                                disabled={exportLoading || disabled}
                                className={`
                                  absolute!
                                  right-9
                                  top-1/2
                                  -translate-y-1/2
                                  transform-gpu
                                  z-10
                                  ${darkMode ? "text-white" : "text-[#555]"}
                                `}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </FormControl>

                {/* Intervallo */}
                <FormControl fullWidth sx={{ mb: 3, position: "relative" }}>
                    <InputLabel id="range-label" required>
                        Intervallo temporale
                    </InputLabel>
                    <Select
                        required
                        labelId="range-label"
                        value={selectedRangeDays}
                        label="Intervallo temporale"
                        onChange={(e) => setSelectedRangeDays(Number(e.target.value) as DaysWindow)}
                        onOpen={() => setOpenRange(true)}
                        onClose={() => setOpenRange(false)}
                        className="p-3 text-left"
                        endAdornment={getIcon(openRange)}
                        disabled={disabled || exportLoading || showProgress}
                        MenuProps={{
                            PaperProps: {
                                className: "max-h-[60vh] w-[min(92vw,520px)] sm:w-auto overflow-y-auto",
                            },
                        }}
                    >
                        <MenuItem value={7}>1 settimana</MenuItem>
                        <MenuItem value={14}>2 settimane</MenuItem>
                        <MenuItem value={30}>1 mese</MenuItem>
                    </Select>
                </FormControl>

                {/* Formato */}
                <FormControl fullWidth sx={{ mb: 6, position: "relative" }}>
                    <InputLabel id="format-label" required>
                        Seleziona il formato
                    </InputLabel>
                    <Select
                        required
                        labelId="format-label"
                        value={selectedFormat}
                        label="Seleziona il formato"
                        onChange={(e) => setSelectedFormat(e.target.value as "CSV" | "XLSX")}
                        onOpen={() => setOpenFormat(true)}
                        onClose={() => setOpenFormat(false)}
                        className="p-3 text-left"
                        endAdornment={getIcon(openFormat)}
                        disabled={disabled || exportLoading || showProgress}
                        MenuProps={{
                            PaperProps: {
                                className: "max-h-[60vh] w-[min(92vw,520px)] sm:w-auto overflow-y-auto",
                            },
                        }}
                    >
                        <MenuItem value="CSV">CSV</MenuItem>
                        <MenuItem value="XLSX">XLSX</MenuItem>
                    </Select>
                </FormControl>

                {/* Stato */}
                {showProgress && (
                    <FDBox variant="ghost" className="w-full mt-4 mb-4">
                        <LinearProgress variant="indeterminate" className="!overflow-hidden" />
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                            <p className="inline-flex text-sm">
                                stato: <Tag text={statusLabel} className="ml-2" />
                            </p>
                            <p className="text-sm">prodotti inclusi: {Number(writtenRows || 0)}</p>
                        </div>
                    </FDBox>
                )}

                <FDButton
                    variant="solid"
                    color="primary"
                    disabled={disabled || !selectedSuppliers.length || !selectedFormat}
                    loading={exportLoading || showProgress}
                    onClick={handleSubmit}
                    className="mt-auto"
                    fullWidth
                >
                    {exportLoading ? "Generazione in corso..." : "Conferma"}
                </FDButton>
            </div>
        </ExportConfrontatoreRoot>
    );
};

export default ExportConfrontatore;