import React from "react";
import { SidePanelShell } from "layouts/quotazioni/sidePanel/SidePanelShell";
import { HeaderSection } from "./components/HeaderSection";
import MainInfoSection from "./components/MainInfoSection";
import SideInfoSection from "./components/SideInfoSection";
import RelatedProductsSection from "./components/RelatedProductsSection";
import SuppliersSection from "./components/SuppliersSection";
import { useProductDetails } from "./hook/useProductDetails";
import { Tooltip } from "react-tooltip";

type ProductDetailsPanelProps = {
    onClose: () => void;
    productId: string | null;
};

export const ProductDetailsPanel: React.FC<ProductDetailsPanelProps> = ({
    onClose,
    productId,
}) => {
    const {
        product,
        isLoading,
        error,
        reload,
        canSeePrices,
        variationHistory,
        isVariationLoading,
        variationError,
        variationRange,
        setVariationRange,
        selectedSupplier,
        selectSupplier,
    } = useProductDetails(productId);

    return (
        <>
            <SidePanelShell
                title={product?.codiceProduttore || product?.codice || "Dettagli prodotto"}
                animateVariant="visible"
                contentState="front"
                onClose={onClose}
            >
                {/* LOADING / ERROR */}
                {isLoading && (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent dark:border-neutral-700" />
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Carico i dettagli del prodotto…
                            </p>
                        </div>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={reload}
                            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
                        >
                            Riprova
                        </button>
                    </div>
                )}

                {!isLoading && !error && product && (
                    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-5">
                        {/* HEADER VISIVO */}
                        <HeaderSection product={product} />

                        {/* FORNITORI / OFFERTE */}
                        {canSeePrices && <SuppliersSection
                                product={product}
                                variationHistory={variationHistory}
                                isVariationLoading={isVariationLoading}
                                variationError={variationError}
                                selectedKey={selectedSupplier}
                                onChangeSelectedKey={selectSupplier}
                                trendRange={variationRange}
                                onChangeTrendRange={setVariationRange}
                            />}

                        {/* INFO PRINCIPALI + META */}
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
                            <MainInfoSection product={product} />
                            <SideInfoSection product={product} canSeePrices={canSeePrices} />
                        </div>

                        {/* PRODOTTI CORRELATI */}
                        {product.relatedProducts && product.relatedProducts.length > 0 && (
                            <RelatedProductsSection related={product.relatedProducts} />
                        )}
                    </div>
                )}
            </SidePanelShell>
            <Tooltip
                id="general-product-details-tooltip"
                place="bottom"
                className="
                    max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md
                    !bg-white !text-neutral-900
                    dark:!bg-neutral-900 dark:!text-neutral-100
                "
            />
        </>
    );
};
