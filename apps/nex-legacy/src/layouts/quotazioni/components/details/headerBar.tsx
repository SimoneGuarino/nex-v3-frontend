import { memo } from "react";
import { useNavigate } from "react-router-dom";
//components UI
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDBox from "components/UI/box/FDBox";
//icons
import { IoReturnUpBackSharp, IoReload } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";
import { QuotazioneDTO } from "layouts/quotazioni/types/quotations";

const IoReturnUpBackSharpIcon = IoReturnUpBackSharp as React.FC<{ size?: number; className?: string }>;
const IoReloadIcon = IoReload as React.FC<{ size?: number; className?: string }>;
const AiOutlineDeleteIcon = AiOutlineDelete as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES AND INTERFACES
// ——————————————————————————————————————————————————————————
interface FiltersProps {
    qts: QuotazioneDTO | null;
    loading: boolean;
    onDeleteQuotation: () => void;
    refreshAll: () => void;
};

const HeaderBar: React.FC<FiltersProps> = ({
    qts,
    loading,
    onDeleteQuotation,
    refreshAll,
}) => {
    const navigate = useNavigate();
    // torna indietro
    const goBack = () => navigate(`/commerciale/quotazioni`);
    return (
        <FDBox variant="gradient" border={true} radius="md" pad="sm" className="flex gap-2 px-6 items-center">
            <FDIconButton variant='text' rounded='md'
                dataTooltipContent='Torna indietro' dataTooltipId='general-quotations-tooltip'
                data-tour="quotazioni-details-back"
                size='small' className='border border-neutral-200 dark:border-neutral-800'
                onClick={goBack} icon={<IoReturnUpBackSharpIcon size={18} />} />
            <FDIconButton variant='text' rounded='md' disabled={loading}
                dataTooltipContent='Ricarica i dati' dataTooltipId='general-quotations-tooltip'
                size='small' className='border border-neutral-200 dark:border-neutral-800'
                onClick={refreshAll} icon={<IoReloadIcon size={18} />} />
            {qts && qts.stato == "BOZZA" && <FDIconButton variant='danger' rounded='md' disabled={!qts}
                dataTooltipContent='Elimina la richiesta di quotazione' dataTooltipId='general-quotations-tooltip'
                size='small' className='ml-auto'
                onClick={onDeleteQuotation} icon={<AiOutlineDeleteIcon size={18} />} />}
        </FDBox>
    );
};

export default memo(HeaderBar);