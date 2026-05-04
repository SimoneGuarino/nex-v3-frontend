import { memo } from "react";
import { ScopeTab } from "../../hook/useDetailsQuotation";

//components UI
import FDBox from "components/UI/box/FDBox";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";

//icons
import { MdSearch, MdFilterList, MdUpload } from 'react-icons/md';
import { VscTarget } from "react-icons/vsc";
const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const MdUploadIcon = MdUpload as React.FC<{ size?: number; className?: string }>;
const VscTargetIcon = VscTarget as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES AND INTERFACES
// ——————————————————————————————————————————————————————————
interface FiltersProps {
    menuRef: React.MutableRefObject<any>;
    chips: Array<any>;
    scope: ScopeTab; handleScopeChange: (s: ScopeTab) => void;
    isBozza: boolean;
    hasProducts: boolean;
    setOpenSearch: (open: boolean | { from: ScopeTab | "propose_qts_products"; bool: boolean }) => void;
    setOpenFilters: (open: boolean) => void;
    onImportFromFile: () => void; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const HeaderBar: React.FC<FiltersProps> = ({
    menuRef,
    chips,
    isBozza,
    hasProducts,
    scope, handleScopeChange,
    setOpenSearch,
    setOpenFilters,
    onImportFromFile,
}) => {
    return (
        <FDBox variant="gradient" border={true} radius="md" pad="sm" className="flex flex-wrap gap-4 items-center space-x-2">
            <div className="flex">
                <FDButton variant={scope === "quotazioni" ? "underline" : "ghost"}
                    color={scope === 'quotazioni' ? 'primary' : 'neutral'} radius="none" onClick={() => { handleScopeChange('quotazioni'); }}>
                    Quotazione Prodotti
                </FDButton>
                {isBozza && <>
                    <FDButton variant={scope === "prodotti" ? "underline" : "ghost"}
                        color={scope === 'prodotti' ? 'primary' : 'neutral'}
                        radius="none" onClick={() => { handleScopeChange('prodotti'); }}>
                        Lista Prodotti
                    </FDButton>
                    <FDButton variant={scope === "descrivi_necessita" ? "underline" : "ghost"}
                        disabled={hasProducts}
                        data-tooltip-content={hasProducts ? "Non puoi descrivere una necessità se hai già aggiunto prodotti alla quotazione" : "Descrivi la necessità per ricevere proposte personalizzate"}
                        data-tooltip-id="general-quotations-tooltip"
                        color={scope === 'descrivi_necessita' ? 'primary' : 'neutral'}
                        radius="none"
                        onClick={() => { handleScopeChange('descrivi_necessita'); }}>
                        Descrivi la necessità
                    </FDButton>
                </>}
            </div>
            {scope !== "descrivi_necessita" && <div className="flex gap-2 ml-auto">
                <FDIconButton variant='text' rounded='md'
                    dataTooltipContent="Ricerca mirata globale prodotti"
                    dataTooltipId='general-quotations-tooltip'
                    size='small' className='border border-neutral-200 dark:border-neutral-800'
                    onClick={() => setOpenSearch(scope === "prodotti"
                        ? { from: "prodotti", bool: true }
                        : { from: "quotazioni", bool: true }
                    )}
                    icon={<><MdSearchIcon size={18} /><VscTargetIcon size={18} /></>} />

                {/* Filters */}
                <div className="relative" onClick={(e: any) => menuRef.current = e.currentTarget}
                    data-tooltip-id='general-quotations-tooltip'
                    data-tooltip-content="Filtri Avanzati che verranno applicati in base al pannello corrente e nella ricerca mirata">
                    <FDButton icon={<MdFilterListIcon />} variant="outline" color='neutral' size="small" onClick={() => setOpenFilters(true)}>
                        Filtri {chips.length > 0 && (
                            <span
                                data-tooltip-id='general-quotations-tooltip'
                                data-tooltip-content={`${chips.length} filtr${chips.length > 1 ? "i" : "o"} attiv${chips.length > 1 ? "i" : "o"} - ${chips.map(c => c.label).join(", ")}`}
                                className="text-xs text-sky-500 ml-1 font-bold">({chips.length})</span>
                        )}
                    </FDButton>
                </div>

                {isBozza && (
                    <>
                        <FDButton
                            icon={<MdUploadIcon />}
                            variant="outline" color='neutral' size="small"
                            data-tooltip-id='general-quotations-tooltip'
                            data-tooltip-content="Importa prodotti nel carrello da un file CSV"
                            onClick={onImportFromFile}
                        >
                            Importa da file
                        </FDButton>
                    </>
                )}
            </div>}
        </FDBox>
    );
};

export default memo(HeaderBar);
