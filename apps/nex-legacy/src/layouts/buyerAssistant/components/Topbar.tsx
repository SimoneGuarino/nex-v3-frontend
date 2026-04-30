import { useEffect, useRef, useState } from "react";
//UI
import FDBox from "components/UI/box/FDBox"
import FDButton from "components/UI/buttons/FDButton"
import { ContextMenu } from "components/UI/menu/ContextMenu";
import FDDialog from "components/UI/box/FDDialog";
//fetchdatas
import { GetCategoriesAPI, GetNoPromoMysqlFiltersAPI, NoPromoMysqlFilters } from "../fetchData/filters";
import { ExportGlossarioAPI } from "../fetchData/exportGlossario";
//componenti
import FiltersMenu from "./FiltersMenu";
import ReservationMenu from "./ReservationMenu";
import QuickReservationMenu from "./QuickReservationMenu";
import BsgContent from "./BsgContent";
//types
import { BuyerAssistantFiltersProps } from "../types/types";
import { BrandDoc } from "../types/types";
//icons
import { IoFilterSharp, IoSearch, IoCalendarOutline } from "react-icons/io5";
import { MdToday, MdFilterAlt } from "react-icons/md";
import { BsFiletypeCsv, BsFiletypeXlsx } from "react-icons/bs";
import { LuSettings, LuDownload, LuInfo } from "react-icons/lu";

const TodayIcon = MdToday as React.FC<{ size?: number }>;
const FilterIcon = MdFilterAlt as React.FC<{ size?: number }>;
const DownloadIcon = LuDownload as React.FC<{ size?: number }>;
const InfoIcon = LuInfo as React.FC<{ size?: number }>;
const SettingsIcon = LuSettings as React.FC<{ size?: number }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface TopbarProps {
    handleChangeFilters: ({key, value, deleteProps}: {key: keyof BuyerAssistantFiltersProps; value: any; deleteProps?: (keyof BuyerAssistantFiltersProps)[]}) => void;
    filters: BuyerAssistantFiltersProps;
    setFilters: React.Dispatch<React.SetStateAction<BuyerAssistantFiltersProps>>;
    onDownloadTableCsv?: () => void;
    canDownloadTableCsv?: boolean;
    onDownloadTableXlsx?: () => void;
    canDownloadTableXlsx?: boolean;
    runSearch: () => void;
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Calcola il numero totale di filtri attivi
 */
function countActiveFilters(filters: BuyerAssistantFiltersProps | undefined): number {
    if (!filters) return 0;
    let count = 0;
    if (filters.brand?.length) count += filters.brand.length;
    if (filters.prefisso?.length) count += filters.prefisso.length;
    if (filters.linea?.length) count += filters.linea.length;
    if (filters.gruppo?.length) count += filters.gruppo.length;
    if (filters.famiglia?.length) count += filters.famiglia.length;
    if (filters.flagGest?.length) count += filters.flagGest.length;
    if (filters.ragProd?.length) count += filters.ragProd.length;
    if (filters.buyer?.length) count += filters.buyer.length;
    if (filters.denomBreve?.trim()) count += 1;
    return count;
}

/**
 * Costruisce il messaggio tooltip con i filtri attivi
 */
function buildFiltersTooltip(filters: BuyerAssistantFiltersProps | undefined): string {
    if (!filters) return "Filtri";

    const parts: string[] = [];
    if (filters.brand?.length) parts.push(`Brand: ${filters.brand.join(", ")}`);
    if (filters.prefisso?.length) parts.push(`Prefisso: ${filters.prefisso.join(", ")}`);
    if (filters.linea?.length) parts.push(`Linea: ${filters.linea.join(", ")}`);
    if (filters.gruppo?.length) parts.push(`Gruppo: ${filters.gruppo.join(", ")}`);
    if (filters.famiglia?.length) parts.push(`Famiglia: ${filters.famiglia.join(", ")}`);
    if (filters.flagGest?.length) parts.push(`Flag Gestionale: ${filters.flagGest.join(", ")}`);
    if (filters.ragProd?.length) parts.push(`Raggruppamento: ${filters.ragProd.join(", ")}`);
    if (filters.buyer?.length) parts.push(`Buyer: ${filters.buyer.join(", ")}`);
    if (filters.denomBreve?.trim()) parts.push(`Denominazione Breve: ${filters.denomBreve.trim()}`);

    return parts.length > 0 ? parts.join("\n") : "Filtri";
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function Topbar({
    handleChangeFilters,
    filters = {}, setFilters,
    onDownloadTableCsv,
    canDownloadTableCsv = true,
    onDownloadTableXlsx,
    canDownloadTableXlsx = true,
    runSearch,
}: TopbarProps) {
    const [openFilters, setOpenFilters] = useState(false)//stato apertura menù filtri
    const filterBtnRef = useRef<HTMLButtonElement | null>(null);//ref pulsante filtri 

    const [openReserve, setOpenReserve] = useState(false) //stato apertura menu prenotazioni
    const reserveBtnRef = useRef<HTMLButtonElement | null>(null); //ref pulsante prenotazioni

    const [openDownload, setOpenDownload] = useState(false); //stato per aprire il menu download
    const downloadBtnRef = useRef<HTMLButtonElement | null>(null) //ref pulsante download

    const [openBsg, setOpenBsg] = useState(false) //stato apertura bsg
    const [downloadingGlossario, setDownloadingGlossario] = useState(false); // stato export glossario

    const [brands, setBrands] = useState<BrandDoc[]>([]); // Cache dei brand per evitare re-fetch quando si apre/chiude il menu
    const [brandsLoading, setBrandsLoading] = useState<boolean>(true);//stato di loading di categories
    const [mysqlFilters, setMysqlFilters] = useState<NoPromoMysqlFilters>({ flag_gest: [], buyer: [], rag_prod: [] }); //state per popolare i filtri recuperati da mysql (flag, buyer, raggruppamento)
    const [mysqlFiltersLoading, setMysqlFiltersLoading] = useState<boolean>(true); //stato di loading dei filtri recuperati da mysql (flag, buyer, raggruppamento)
    const fetchInitialized = useRef(false);

    // Fetch categorie una sola volta
    useEffect(() => {
        if (fetchInitialized.current) return;
        fetchInitialized.current = true;

        let cancelled = false;
        const ac = new AbortController();

        setBrandsLoading(true);
        setMysqlFiltersLoading(true);

        const setData = (res: any) => {
            const arr = Array.isArray(res) ? (res as BrandDoc[]) : [];
            if (!cancelled) {
                setBrands(arr);
            }
        };

        const ChangeLoadStatus = ({ bool }: { from: string; bool: boolean }) => {
            if (!cancelled) {
                setBrandsLoading(bool);
            }
        };

        GetCategoriesAPI({
            abortController: ac,
            setData,
            ChangeLoadStatus,
        });

        GetNoPromoMysqlFiltersAPI({
            abortController: ac,
            setData: setMysqlFilters,
            ChangeLoadStatus: ({ bool }) => {
                if (!cancelled) {
                    setMysqlFiltersLoading(bool);
                }
            },
        });

        return () => {
            cancelled = true;
            ac.abort();
        };
    }, []);

    const handleSearch = () => {
        runSearch();
        setOpenFilters(false);
    };

    const handleDownloadGlossario = async (format: "csv" | "xlsx") => {
        if (downloadingGlossario) return;
        setDownloadingGlossario(true);
        await ExportGlossarioAPI({ format });
        setDownloadingGlossario(false);
        setOpenDownload(false);
    };


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <>
            <FDBox
                pad="sm"
                radius="lg"
                fullWidth
            >
                <div className="w-full flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
                    {/* lato sinistro: prenotazione + bsg */}
                    <div className="flex items-center gap-2">
                        <FDButton
                            variant="solid"
                            radius="md"
                            size="small"
                            color="success"
                            rightIcon={IoCalendarOutline({})}
                            ref={reserveBtnRef}
                            onClick={() => setOpenReserve(true)}
                        >
                            Prenota Elaborazione
                        </FDButton>
                        <FDButton
                            variant="outline"
                            radius="md"
                            size="small"
                            rightIcon={<SettingsIcon size={16} />}
                            dataTooltipId="buyer-assistant-tooltip"
                            dataTooltipContent="Visualizza le Buyer Strategy Guidelines"
                            onClick={() => setOpenBsg(true)}
                        >
                            BSG
                        </FDButton>
                    </div>

                    {/* lato destro: download + filtri + cerca */}
                    <div className="flex justify-end items-center gap-2">
                        <FDButton
                            ref={downloadBtnRef}
                            radius="md"
                            size="small"
                            variant="outline"
                            rightIcon={<DownloadIcon size={16} />}
                            onClick={() => setOpenDownload(true)}
                        >
                            Scarica
                        </FDButton>

                        <FDButton
                            ref={filterBtnRef}
                            radius="md"
                            size="small"
                            variant="outline"
                            rightIcon={IoFilterSharp({})}
                            onClick={() => setOpenFilters(true)}
                            dataTooltipId="buyer-assistant-tooltip"
                            dataTooltipContent={buildFiltersTooltip(filters)}
                        >
                            Filtri
                            {countActiveFilters(filters) > 0 && (
                                <span className="text-xs text-sky-500 ml-1 font-bold">
                                    ({countActiveFilters(filters)})
                                </span>
                            )}
                        </FDButton>

                        <FDButton
                            radius="md"
                            size="small"
                            variant="solid"
                            color="primary"
                            rightIcon={IoSearch({})}
                            onClick={handleSearch}
                        >
                            Cerca
                        </FDButton>
                    </div>
                </div>
            </FDBox>

            {/* prenotazione */}
            <ContextMenu
                openFor={openReserve}
                pos={reserveBtnRef}
                onClose={() => setOpenReserve(false)}
                placement="bottom"
                menuButtons={[
                    {
                        title: "Prenota tutti per domani",
                        icon: <TodayIcon size={16} />,
                        childrenMenu: [
                            {
                                component: (
                                    <QuickReservationMenu
                                        onClose={() => setOpenReserve(false)}
                                    />
                                ),
                            },
                        ],
                    },
                    {
                        title: "Prenota per Brand",
                        icon: <FilterIcon size={16} />,
                        childrenMenu: [
                            {
                                component: (
                                    <ReservationMenu
                                        brands={brands}
                                        brandsLoading={brandsLoading}
                                        onClose={() => setOpenReserve(false)}
                                    />
                                ),
                            },
                        ],
                    },
                ]}
            />

            {/* bsg */}
            <FDDialog
                open={openBsg}
                onClose={() => setOpenBsg(false)}
                title="Buyer Strategy Guidelines"
                size="xl"
                hideActions
            >
                <BsgContent
                    open={openBsg}
                    brands={brands}
                    brandsLoading={brandsLoading}
                />
            </FDDialog>

            {/* download */}
            <ContextMenu
                openFor={openDownload}
                pos={downloadBtnRef}
                onClose={() => setOpenDownload(false)}
                placement="bottom"
                menuButtons={[
                    {
                        title: "Scarica Tabella",
                        icon: <DownloadIcon size={16} />,
                        childrenMenu: [
                            {
                                component: (
                                    <div className="flex items-center gap-1">
                                        <FDButton
                                            fullWidth
                                            variant="outline"
                                            color="dark"
                                            size="small"
                                            radius="md"
                                            rightIcon={BsFiletypeCsv({})}
                                            disabled={!canDownloadTableCsv}
                                            onClick={() => {
                                                onDownloadTableCsv?.();
                                                setOpenDownload(false);
                                            }}
                                        >
                                            CSV
                                        </FDButton>

                                        <FDButton
                                            fullWidth
                                            variant="outline"
                                            color="dark"
                                            size="small"
                                            radius="md"
                                            rightIcon={BsFiletypeXlsx({})}
                                            disabled={!canDownloadTableXlsx}
                                            onClick={() => {
                                                onDownloadTableXlsx?.();
                                                setOpenDownload(false);
                                            }}
                                        >
                                            XLSX
                                        </FDButton>
                                    </div>
                                ),
                            },
                        ],
                    },
                    {
                        title: "Scarica Glossario",
                        icon: <InfoIcon size={16} />,
                        childrenMenu: [
                            {
                                component: (
                                    <div className="flex items-center gap-1">
                                        <FDButton
                                            fullWidth
                                            variant="outline"
                                            color="dark"
                                            size="small"
                                            radius="md"
                                            rightIcon={BsFiletypeCsv({})}
                                            disabled={downloadingGlossario}
                                            onClick={() => handleDownloadGlossario("csv")}
                                        >
                                            CSV
                                        </FDButton>

                                        <FDButton
                                            fullWidth
                                            variant="outline"
                                            color="dark"
                                            size="small"
                                            radius="md"
                                            rightIcon={BsFiletypeXlsx({})}
                                            disabled={downloadingGlossario}
                                            onClick={() => handleDownloadGlossario("xlsx")}
                                        >
                                            XLSX
                                        </FDButton>
                                    </div>
                                ),
                            },
                        ],
                    }
                ]}
            />

            {/* filtri */}
            <ContextMenu
                openFor={openFilters}
                pos={filterBtnRef}
                onClose={() => setOpenFilters(false)}
                placement="left-start"
                panel={
                    <FiltersMenu
                        handleChangeFilters={handleChangeFilters}
                        onClose={() => setOpenFilters(false)}
                        brands={brands}
                        brandsLoading={brandsLoading}
                        mysqlFilters={mysqlFilters}
                        mysqlFiltersLoading={mysqlFiltersLoading}
                        filters={filters}
                        setFilters={setFilters}
                    />
                }
            />
        </>
    )
}

export default Topbar
