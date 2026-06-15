import React from "react";
import { FDIconButton, FDButton, FDBox, FDSkeletonLayout, FDSkeletonSwitch } from "@nex/fd-ui";
import { clsx } from "clsx";
import cartEmpty from 'assets/images/emptyCart/shopping-cart-with-boxes-concept-illustration_114360-18772-noBg.png';
import { CartProductDTO, TextRequestCartDTO } from "layouts/quotazioni/types/qts_product";
import placeholder from 'assets/images/placeholder/av5c8336583e291842624.webp';

// icons
import { BsCart3, BsCartCheck, BsCartX } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { TruncateText } from "utils";
import { QuotazioneDTO } from "layouts/quotazioni/types/quotations";

const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const BSCartCheck = BsCartCheck as React.FC<{ size?: number; className?: string }>;
const BSCart3 = BsCart3 as React.FC<{ size?: number; className?: string }>;
const BSCartX = BsCartX as React.FC<{ size?: number; className?: string }>;
const FiChevronDownIcon = FiChevronDown as React.FC<{ size?: number; className?: string }>;
const FiChevronUpIcon = FiChevronUp as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type RowsIndexItem = {
    description?: string;
    brand?: string;
    detailsParts?: string[];
    buyerCode?: string;
};

type CartPanelProps = {
    qts: QuotazioneDTO;
    cart: Array<CartProductDTO | TextRequestCartDTO>;
    rowsIndex?: Map<string, RowsIndexItem>;
    //indica quali prodotti stanno subendo un'operazione asincrona di modifica quantità o rimozione, per mostrare uno stato di loading solo su quegli item specifici
    loadingCart: Map<string, boolean>;
    updateCartItemQuantity: (id: string, quantity: number) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    openQuotation: () => void;
};

// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export default function CartPanel({
    qts,
    cart,
    loadingCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    openQuotation,
}: CartPanelProps) {
    const [isOpen, setIsOpen] = React.useState(true);

    // Separiamo le righe per tipo per pilotare UI e validazioni di apertura.
    const textRequestCount = cart.filter(item => item.kind === "TEXT_REQUEST").length;
    const products = cart.filter(item => (item.kind ?? "PRODUCT") === "PRODUCT");
    // controllo validità data fine se presente, per disabilitare il pulsante di apertura se la data è già scaduta, se il giorno è uguale o inferiore ad ora
    const existValidDate = qts && qts.finestraValidita && qts.finestraValidita.fine && new Date(qts.finestraValidita.fine) <= new Date();

    const hasProducts = products.length > 0;
    const hasTextRequests = textRequestCount > 0;
    // La quotazione è apribile se il carrello contiene almeno una riga utile:
    // PRODUCT e/o TEXT_REQUEST.
    const hasOpenableRows = hasProducts || hasTextRequests;
    const totalRows = products.length + textRequestCount;
    const productsWithoutBuyer = products.filter(
        item => !item.codice_buyer || item.codice_buyer.trim() === "",
    );

    const layout = {
        type: "col",
        gap: 0.75,
        children: [
            { type: "block", className: "h-18 w-full" }, // titolo
        ],
    } as const;


    return (
        <FDBox
            variant="soft"
            color="light"
            radius="md"
            shadow="sm"
            pad="lg"
            className={[
                "relative",
                "flex flex-col",
                "bg-white/90 dark:bg-neutral-900/80",
                "border border-black/5 dark:border-white/10",
                "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
                "transition-colors duration-200",
            ].join(" ")}
        >
            {/* HEADER - sempre visibile */}
            <div
                className="flex items-center justify-between gap-3 mb-1 cursor-pointer select-none"
                onClick={() => setIsOpen((v) => !v)}
            >
                <div className="flex items-center gap-2">
                    <BSCart3 className="opacity-80 dark:text-neutral-200" size={18} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Carrello Prodotti
                    </span>
                    <span className="text-xs text-neutral-500">
                        ({hasOpenableRows ? `${totalRows} articoli` : "vuoto"})
                    </span>
                    {textRequestCount > 0 && (
                        <span
                            className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600
                                       dark:bg-sky-900/40 dark:text-sky-200"
                            data-tooltip-id="general-quotations-tooltip"
                            data-tooltip-content="Questa quotazione contiene richieste descrittive separate."
                        >
                            Richieste descrittive: {textRequestCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <FDIconButton
                        size="small"
                        dataTooltipId="general-quotations-tooltip"
                        dataTooltipContent={isOpen ? "Chiudi carrello" : "Apri carrello"}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen((v) => !v);
                        }}
                        icon={
                            isOpen ? (
                                <FiChevronUpIcon className="transition-transform duration-200" />
                            ) : (
                                <FiChevronDownIcon className="transition-transform duration-200" />
                            )
                        }
                    />
                </div>
            </div>

            {/* CONTENUTO + FOOTER con animazione */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="cart-content"
                        initial={{ height: 0, opacity: 0, y: -4 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -4 }}
                        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        {/* Contenuto */}
                        {!hasOpenableRows ? (
                            <div className="flex flex-col items-center justify-center opacity-50 grayscale py-3">
                                <img src={cartEmpty} alt="Carrello vuoto" className="max-h-28 object-contain avoid-drag" />
                                <span className="text-xs text-center mt-1 dark:text-white">
                                    il carrello è vuoto
                                </span>
                            </div>
                        ) : hasProducts ? (
                            <div className="space-y-2 max-h-[350px] overflow-y-auto overflow-x-hidden pr-1 my-3">
                                {products.map((doc, index) => {
                                    if (doc.kind !== "PRODUCT") return null;
                                    const item = doc as CartProductDTO;
                                    const src = item.dettagli_prodotto.anteprima;
                                    const loading = !!loadingCart.get(item.product_id);
                                    return <FDSkeletonSwitch
                                        loading={loading}
                                        key={item._id + "-" + index}
                                        skeleton={<FDSkeletonLayout layout={layout} />}
                                    ><FDBox
                                        variant="ghost"
                                        radius="md"
                                        className="w-full flex items-center gap-3"
                                    >
                                            <FDIconButton
                                                size="small"
                                                dataTooltipId="general-quotations-tooltip"
                                                dataTooltipContent="Rimuovi"
                                                variant="text"
                                                icon={<MdCloseIcon size={14} className="text-red-400" />}
                                                onClick={() => removeFromCart(item.product_id)}
                                            />

                                            {/* Immagine Prodotto */}
                                            <div
                                                className={clsx(
                                                    "flex items-center justify-center w-11 h-11 rounded-xl",
                                                    "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700",
                                                    "overflow-hidden shrink-0"
                                                )}
                                            >
                                                {src ? (
                                                    <img
                                                        src={src}
                                                        alt={src ?? "Prodotto"}
                                                        className="w-full h-full object-contain bg-white dark:bg-neutral-900"
                                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                            if (e.currentTarget.src !== placeholder) {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = placeholder;
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 text-center px-2">
                                                        Nessuna immagine
                                                    </span>
                                                )}
                                            </div>

                                            <div className="w-full flex flex-col">
                                                <span
                                                    className="truncate text-xs"
                                                    data-tooltip-content={item.dettagli_prodotto.descrizione}
                                                    data-tooltip-id="general-quotations-tooltip"
                                                >
                                                    {TruncateText(item.dettagli_prodotto.descrizione, 25)}
                                                </span>
                                                <span className="truncate text-xs text-gray-400">
                                                    {item.dettagli_prodotto.marca}
                                                </span>
                                                <div className="flex space-x-2 items-center mt-2">
                                                    <label className="text-xs">q.tà</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        step={1}
                                                        value={item.quantita ?? 1}
                                                        onChange={(e) =>
                                                            updateCartItemQuantity(
                                                                item.product_id,
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        className="w-20 px-2 py-1 text-sm dark:text-inherit rounded-md border border-gray-200 dark:border-neutral-700 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </FDBox>
                                    </FDSkeletonSwitch>
                                })}
                            </div>
                        ) : (
                            <div className="py-3 text-xs text-neutral-500 dark:text-neutral-300">
                                Sono presenti richieste descrittive senza prodotti a catalogo.
                            </div>
                        )}

                        {/* Footer */}
                        {hasOpenableRows && (
                            <div className="flex items-center gap-2 border-t border-gray-200 dark:border-neutral-700 pt-3 mt-3">
                                <FDButton
                                    disabled={!hasOpenableRows}
                                    variant="outline"
                                    color="error"
                                    size="small"
                                    dataTooltipId="general-quotations-tooltip"
                                    dataTooltipContent="Svuota il carrello"
                                    icon={<BSCartX size={18} />}
                                    onClick={clearCart}
                                />

                                <FDButton
                                    data-tour="quotazioni-open"
                                    disabled={!hasOpenableRows || (hasProducts && productsWithoutBuyer.length > 0) || existValidDate}
                                    color="primary"
                                    dataTooltipId="general-quotations-tooltip"
                                    dataTooltipContent={existValidDate ? "La finestra di validità è scaduta, modificala per poter inviare la richiesta di quotazione" :
                                        !hasOpenableRows ? "Aggiungi almeno una necessità prima di richiedere la quotazione" :
                                            (hasProducts && productsWithoutBuyer.length > 0) ? "Assegna un buyer a tutti i prodotti prima di richiedere la quotazione"
                                                : "Invia richiesta di quotazione dei prodotti nel carrello"}
                                    size="small"
                                    className="mt-auto ml-auto"
                                    icon={<BSCartCheck size={18} />}
                                    onClick={openQuotation}
                                >
                                    Richiedi Quotazione
                                </FDButton>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </FDBox>
    );
}

