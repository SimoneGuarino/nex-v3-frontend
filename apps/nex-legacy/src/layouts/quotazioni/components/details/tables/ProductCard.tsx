import React, { memo, useState } from 'react';
import { ProductDoc } from 'layouts/quotazioni/types/qts_product';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import placeholder from 'assets/images/placeholder/av5c8336583e291842624.webp';
import { CopyToClipboard, TruncateText } from 'utils';
import { BsCartPlus } from "react-icons/bs";
import { IoCopyOutline } from "react-icons/io5";

const IoCopyOutlineIcon = IoCopyOutline as React.FC<{ size?: number; className?: string }>;
const BsCartPlusIcon = BsCartPlus as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES AND INTERFACES
// ——————————————————————————————————————————————————————————
interface Props {
    item: ProductDoc;
    addToCart: (ProductDoc: ProductDoc) => void;
    loadingAddingToCart: boolean;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const Tag = ({ title, value }: { title: string; value: any }) => (
    <span className='inline-block bg-gray-200 dark:bg-neutral-800 rounded-md text-[10px] px-3 w-fit'
        data-tooltip-id='general-quotations-tooltip' data-tooltip-content={title}>
        {TruncateText(value, 15)}
    </span>
);


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const DocumentCard: React.FC<Props> = ({ item, addToCart, loadingAddingToCart }) => {
    const [src, setSrc] = useState<string>(item.anteprima || placeholder);
    const [isPlaceholder, setIsPlaceholder] = useState<boolean>(!item.anteprima);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        // Se fallisce l'immagine originale, passa al placeholder
        if (!isPlaceholder) {
            e.currentTarget.onerror = null;
            setSrc(placeholder);
        }
    };

    return (<>
        <img
            src={src}
            alt={item.codiceProduttore ?? "N/A"}
            onError={handleError}
            className={
                `w-32 h-32 object-contain self-center rounded-md ` +
                (!isPlaceholder ? "bg-white" : "")
            }
        />
        <div>
            <div className='flex gap-2'>
                <p className='text-sm mt-2' data-tooltip-content={item.codiceProduttore}
                    data-tooltip-id='general-quotations-tooltip'>{TruncateText(item.codiceProduttore ?? "N/A", 15)}</p>
                <FDIconButton
                    variant="text"
                    icon={<IoCopyOutlineIcon />}
                    onClick={(e) => {
                        e.stopPropagation();
                        CopyToClipboard(item.codiceProduttore ?? "N/A");
                    }}
                    className="inline-flex"
                    dataTooltipContent="Copia codice produttore"
                    dataTooltipId="general-quotations-tooltip"
                />
            </div>

            <p className='text-sm mt-2 text-gray-400 dark:text-neutral-400 w-full truncate' data-tooltip-content={item.descrizione}
                data-tooltip-id='general-quotations-tooltip'>{item.descrizione ?? "N/A"}</p>
        </div>

        {/* Divider */}
        <span className="h-1 w-full my-2 border-b border-gray-200 dark:border-gray-700" />

        <div className='space-x-2 w-full flex flex-wrap mt-2 gap-2'>
            <Tag title={`Marca: ${item.marca ?? "N/A"}`} value={item.marca ?? "N/A"} />
            <Tag title={`Linea: ${item.descrizioneLinea ?? "N/A"}`} value={item.descrizioneLinea ?? "N/A"} />
            <Tag title={`Gruppo: ${item.descrizioneGruppo ?? "N/A"}`} value={item.descrizioneGruppo ?? "N/A"} />
        </div>

        <FDIconButton dataTooltipContent='Aggiungi alla quotazione'
            dataTooltipId='general-quotations-tooltip' 
            icon={<BsCartPlusIcon />} 
            onClick={() => addToCart(item)} 
            loading={loadingAddingToCart}
            className='absolute top-2 right-2' 
        />
    </>
    );
};

export default memo(DocumentCard);