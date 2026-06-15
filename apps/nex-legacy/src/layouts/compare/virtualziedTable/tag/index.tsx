import React, { memo, useCallback, useMemo } from "react";
import { FDBox } from "@nex/fd-ui";
import {
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineCube,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowTrendingDown,
    HiOutlineXMark,
    HiOutlineCurrencyEuro,
    HiOutlineUser,
    HiOutlineTag,
} from "react-icons/hi2";
import FDIconButton from "components/UI/buttons/FDIconButton";

const HiOutlineChatBubbleLeftEllipsisIcon = HiOutlineChatBubbleLeftEllipsis as React.FC<{ size?: number, className?: string }>;
const HiOutlineCubeIcon = HiOutlineCube as React.FC<{ size?: number, className?: string }>;
const HiOutlineArrowTrendingUpIcon = HiOutlineArrowTrendingUp as React.FC<{ size?: number, className?: string }>;
const HiOutlineArrowTrendingDownIcon = HiOutlineArrowTrendingDown as React.FC<{ size?: number, className?: string }>;
const HiOutlineXMarkIcon = HiOutlineXMark as React.FC<{ size?: number, className?: string }>;
const HiOutlineCurrencyEuroIcon = HiOutlineCurrencyEuro as React.FC<{ size?: number, className?: string }>;
const HiOutlineUserIcon = HiOutlineUser as React.FC<{ size?: number, className?: string }>;
const HiOutlineTagIcon = HiOutlineTag as React.FC<{ size?: number, className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type BuyerObj = { nome?: string; cognome?: string } & Record<string, unknown>;

type FilterSelectedShape = Partial<{
    setBrandSelected: string | null;
    setBrandPrefix: string | null;
    setCategorySelected: string | null;
    setSubCategorySelected: string | null;
    setBuyerTargetObject: BuyerObj | null;
    setPriceFilter: number;
    setDispWithout0: boolean;
    setNoteWith: boolean;
}>;

type ComposeFiltersFn = (
    from: "changeBuyer" | "csv" | null,
    payload: Record<string, boolean> | null
) => void;

type NullableSetter<T> = React.Dispatch<React.SetStateAction<T>>;
type TagKey = keyof FilterSelectedShape;

type TagFilterProps = {
    filterSelected: FilterSelectedShape;
    composeFiltersFunc: ComposeFiltersFn;

    setBrandSelected: NullableSetter<string | null>;
    setBrandPrefix: NullableSetter<string | null>;
    setCategorySelected: NullableSetter<string | null>;
    setSubCategorySelected: NullableSetter<string | null>;

    setBuyerTargetObject: NullableSetter<BuyerObj | null>;
    setBuyerTarget: NullableSetter<string | null>;

    setPriceFilter: NullableSetter<number>;
    setDispWithout0: NullableSetter<boolean>;
    setNoteWith: NullableSetter<boolean>;
};

type TagVisualSpec = {
    key: TagKey;
    label?: React.ReactNode;
    leftIcon?: React.ReactNode;
    trendIcon?: React.ReactNode;
    onRemove: () => void;
};


// ——————————————————————————————————————————————————————————
// CONSTANT
// ——————————————————————————————————————————————————————————
const ACTIVE_TAG_WRAPPER_CLASS =
    "flex flex-wrap items-center justify-center gap-2";
const TAG_TEXT_CLASS = "truncate text-[11px] font-semibold";
const SECTION_TITLE_CLASS =
    "text-[11px] sm:text-xs font-medium text-neutral-700 dark:text-neutral-300";

const BASE_TAG_BOX_CLASS =
    "bg-yellow-400 dark:bg-yellow-400/80 !text-black min-h-8 max-w-full shrink-0 items-center gap-1.5 px-1 py-0.5 sm:px-2.5 flex flex-row";


// ——————————————————————————————————————————————————————————
// HELPERS
// ——————————————————————————————————————————————————————————
function isRenderableFilterValue(key: TagKey, value: FilterSelectedShape[TagKey]) {
    if (key === "setPriceFilter") {
        return value !== null && value !== undefined;
    }

    if (key === "setDispWithout0" || key === "setNoteWith") {
        return value === true;
    }

    return value !== null && value !== undefined && value !== false && value !== "";
};

function getBuyerFullName(buyer: BuyerObj | null | undefined) {
    if (!buyer) return "Buyer";

    const fullName = `${buyer.nome ?? ""} ${buyer.cognome ?? ""}`.trim();
    return fullName || "Buyer";
};


// ——————————————————————————————————————————————————————————
// TAG CHIP COMPONENT, rappresenta un singolo tag con icona, label e pulsante di rimozione
// ——————————————————————————————————————————————————————————
type FilterTagChipProps = {
    label?: React.ReactNode;
    leftIcon?: React.ReactNode;
    trendIcon?: React.ReactNode;
    onRemove: () => void;
};

const FilterTagChip = memo(function FilterTagChip({
    label,
    leftIcon,
    trendIcon,
    onRemove,
}: FilterTagChipProps) {
    return (
        <FDBox
            asMotion
            variant="ghost"
            color="dark"
            radius="full"
            shadow="sm"
            className={BASE_TAG_BOX_CLASS}
        >
            {leftIcon ? (
                <span className="inline-flex shrink-0 text-sm sm:text-base text-neutral-800">
                    {leftIcon}
                </span>
            ) : null}

            {label ? (
                <span className={TAG_TEXT_CLASS}>
                    {label}
                </span>
            ) : null}

            {trendIcon ? (
                <span className="inline-flex shrink-0 text-sm sm:text-base text-neutral-800">
                    {trendIcon}
                </span>
            ) : null}

            <FDIconButton
                icon={<HiOutlineXMarkIcon className="text-red-900" />}
                ariaLabel="Rimuovi filtro"
                onClick={onRemove}
                variant="text"
                size="small"
                rounded="full"
                className="hover:bg-white/20 dark:hover:bg-white/20"
            />
        </FDBox>
    );
});


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export const TagFilter = memo(function TagFilter({
    filterSelected,
    composeFiltersFunc,
    setBrandSelected,
    setBrandPrefix,
    setCategorySelected,
    setSubCategorySelected,
    setBuyerTargetObject,
    setBuyerTarget,
    setPriceFilter,
    setDispWithout0,
    setNoteWith,
}: TagFilterProps) {
    const genericResetters = useMemo(
        () =>
            ({
                setBrandSelected: () => {
                    setBrandSelected(null);
                    composeFiltersFunc(null, { setBrandSelected: true });
                },
                setBrandPrefix: () => {
                    setBrandPrefix(null);
                    composeFiltersFunc(null, { setBrandPrefix: true });
                },
                setCategorySelected: () => {
                    setCategorySelected(null);
                    composeFiltersFunc(null, { setCategorySelected: true });
                },
                setSubCategorySelected: () => {
                    setSubCategorySelected(null);
                    composeFiltersFunc(null, { setSubCategorySelected: true });
                },
            }) satisfies Partial<Record<TagKey, () => void>>,
        [
            composeFiltersFunc,
            setBrandPrefix,
            setBrandSelected,
            setCategorySelected,
            setSubCategorySelected,
        ]
    );

    const removeNoteFilter = useCallback(() => {
        setNoteWith(false);
        composeFiltersFunc(null, { setNoteWith: true });
    }, [composeFiltersFunc, setNoteWith]);

    const removeDispWithout0Filter = useCallback(() => {
        setDispWithout0(false);
        composeFiltersFunc(null, { setDispWithout0: true });
    }, [composeFiltersFunc, setDispWithout0]);

    const removePriceFilter = useCallback(() => {
        setPriceFilter(0);
        composeFiltersFunc(null, { setPriceFilter: true });
    }, [composeFiltersFunc, setPriceFilter]);

    const removeBuyerFilter = useCallback(() => {
        setBuyerTargetObject(null);
        setBuyerTarget(null);
        composeFiltersFunc(null, { setBuyerTargetObject: true });
    }, [composeFiltersFunc, setBuyerTarget, setBuyerTargetObject]);

    const tagSpecs = useMemo<TagVisualSpec[]>(() => {
        const specs: TagVisualSpec[] = [];

        (Object.keys(filterSelected) as TagKey[]).forEach((key) => {
            const value = filterSelected[key];

            if (!isRenderableFilterValue(key, value)) return;

            switch (key) {
                case "setNoteWith":
                    specs.push({
                        key,
                        leftIcon: <HiOutlineChatBubbleLeftEllipsisIcon />,
                        label: "Note",
                        onRemove: removeNoteFilter,
                    });
                    break;

                case "setDispWithout0":
                    specs.push({
                        key,
                        leftIcon: <HiOutlineCubeIcon />,
                        label: "Disponibilità ≠ 0",
                        trendIcon: <HiOutlineArrowTrendingUpIcon />,
                        onRemove: removeDispWithout0Filter,
                    });
                    break;

                case "setPriceFilter": {
                    const numericValue = Number(value);

                    specs.push({
                        key,
                        leftIcon: <HiOutlineCurrencyEuroIcon />,
                        label: numericValue,
                        trendIcon:
                            numericValue === 0 ? undefined : numericValue > 0 ? (
                                <HiOutlineArrowTrendingUpIcon />
                            ) : (
                                <HiOutlineArrowTrendingDownIcon />
                            ),
                        onRemove: removePriceFilter,
                    });
                    break;
                }

                case "setBuyerTargetObject":
                    specs.push({
                        key,
                        leftIcon: <HiOutlineUserIcon />,
                        label: getBuyerFullName(value as BuyerObj),
                        onRemove: removeBuyerFilter,
                    });
                    break;

                case "setBrandSelected":
                case "setBrandPrefix":
                case "setCategorySelected":
                case "setSubCategorySelected": {
                    const reset = genericResetters[key];
                    if (!reset) return;

                    specs.push({
                        key,
                        leftIcon: <HiOutlineTagIcon />,
                        label: String(value),
                        onRemove: reset,
                    });
                    break;
                }

                default:
                    break;
            }
        });

        return specs;
    }, [
        filterSelected,
        genericResetters,
        removeBuyerFilter,
        removeDispWithout0Filter,
        removeNoteFilter,
        removePriceFilter,
    ]);

    const hasTags = tagSpecs.length > 0;

    return (
        <FDBox
            variant="ghost"
            className="w-full"
        >
            <div className="mb-2">
                <p className={SECTION_TITLE_CLASS}>Filtri attivi</p>
            </div>

            <div className={ACTIVE_TAG_WRAPPER_CLASS}>
                {hasTags ? (
                    tagSpecs.map((tag) => (
                        <FilterTagChip
                            key={tag.key}
                            label={tag.label}
                            leftIcon={tag.leftIcon}
                            trendIcon={tag.trendIcon}
                            onRemove={tag.onRemove}
                        />
                    ))
                ) : (
                    <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                        Nessun filtro attivo
                    </span>
                )}
            </div>
        </FDBox>
    );
});

export default TagFilter;