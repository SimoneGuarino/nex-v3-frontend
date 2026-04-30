import React from 'react';

import { icon_cart, icon_multiFunction, icon_travelExplore, icon_update } from 'config/icons';
import SearchHere from '../../filter/Search/searchHere';
import MinLoader from '../../../../minLoader';
import { CartPanel } from '../cart/cart';
import { NumberToEuro } from 'utils/numberToEuro';
import FDIconButton from 'components/UI/buttons/FDIconButton';

interface ProductObject {
    productCode: string;
    title: string;
    avatar: any;
    codBuyer: string;
    category: string;
    brand: string;
    price: number;
    order: {
        quantity: number;
        total: number;
    };
}

interface SearchBarProps {
    hintsBoxActive: Boolean;
    setHintBoxActive: (prev: any) => void;
    setTransitionLoad: (prev: any) => void;
    transitionLoad: Boolean;
    openErrorSB: (icon: string, message: string) => void;
    UpdateTablePrice: () => void;
    err: Boolean;
    mainLoad: Boolean;
    cartData: Array<ProductObject>;
    setCartData: (prev: any) => void;
    ChangeOrderPanelStatus: () => void;
    orderPanelStatus: boolean;

    DelFromCart: (index: number) => void;
    ChangeValueOfQuantity: (index: number, quantity: number) => void;
    successStatus: boolean;
}

interface CartIconProps {
    ChangeCartStatus: () => void;
    cartDataNumber: number;
    cartDataEuroTotal: number;
}

/** -------------------------
 *  CART ICON (Tailwind)
 *  ------------------------- */
/*const CartIcon: React.FC<CartIconProps> = ({
    ChangeCartStatus,
    cartDataNumber,
    cartDataEuroTotal,
}) => {
    return (
        <div
            className="flex items-center border border-gray-300 text-[0.8rem] leading-none whitespace-nowrap p-2 rounded-full"
            translate="no"
        >
            <div className="relative">
                <FDIconButton
                    variant='text'
                    size='small'
                    onClick={ChangeCartStatus}
                    icon={<>
                        {icon_multiFunction()}
                        {icon_cart({width: 22, height: 22})}
                    </>}
                />

                {cartDataNumber > 0 && (
                    <span
                        className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-[1rem] px-[2px] rounded-full bg-red-600 text-white text-[0.65rem] leading-[1rem] text-center"
                        aria-label={`Articoli nel carrello: ${cartDataNumber}`}
                    >
                        {cartDataNumber}
                    </span>
                )}
            </div>

            <div className="hidden lg:flex flex-col items-center pl-1 pr-1 lg:pr-2">
                <span className="inline text-[0.6rem] leading-none">CARRELLO</span>
                <span className="text-[0.8rem] font-semibold leading-tight">
                    {NumberToEuro({ toSum: [cartDataEuroTotal] })}
                </span>
            </div>
        </div>
    );
};*/

/** -------------------------
 *  SEARCH BAR (Tailwind, responsive)
 *  ------------------------- */
export const SearchBar: React.FC<SearchBarProps> = ({
    //ChangeOrderPanelStatus,
    hintsBoxActive,
    setHintBoxActive,
    setTransitionLoad,
    transitionLoad,
    //openErrorSB,
    UpdateTablePrice,
    err,
    mainLoad,
    //cartData,
    //setCartData,
    //orderPanelStatus,
    //DelFromCart,
    //ChangeValueOfQuantity,
    successStatus,
}) => {
    /*const [cartOpen, setCartOpen] = React.useState<boolean>(false);
    const ChangeCartStatus: () => void = () => setCartOpen((prev) => !prev);

    const cartDataEuroTotal = cartData.reduce((accumulator: number, currentProduct: ProductObject) => {
        return accumulator + currentProduct.order.total;
    }, 0);*/

    return (
        <div className="shadow rounded p-2 mt-2 mb-6
        rounded-2xl
        bg-white/90 dark:bg-neutral-900/80
        backdrop-blur supports-[backdrop-filter]:backdrop-blur border border-black/5 dark:border-white/10" translate="no">
            {/* container: mobile/tablet a colonne, da sm in su a riga */}
            <div className="flex w-full rounded-[4px] flex-col sm:flex-row sm:items-center">
                {/* riga 1: iconcina + barra di ricerca */}
                <div className="flex items-center sm:flex-1">
                    <div className="mr-3">{icon_travelExplore({ mr: 1.5 })}</div>

                    <div className="flex-1">
                        <SearchHere
                            hintsBoxActive={hintsBoxActive}
                            setHintBoxActive={setHintBoxActive}
                            infiniteScrollAnim={transitionLoad}
                            setInfiniteSCrollAnim={setTransitionLoad}
                            loadStatus={{ err, mainLoad, successStatus }}
                        />
                    </div>
                </div>

                {/* primo divisore: solo da sm in su */}
                <div className="hidden sm:block w-px h-10 bg-gray-300" />

                {/* riga 2: allineata a destra su mobile/tablet, a destra anche su desktop */}
                <div className="mt-2 sm:mt-0 flex items-center w-full justify-end sm:w-auto sm:ml-auto">
                    {/* cart */}
                    {/*<div className="self-center sm:px-2 shrink-0 mr-3">
                        <CartIcon
                            ChangeCartStatus={ChangeCartStatus}
                            cartDataNumber={cartData.length}
                            cartDataEuroTotal={cartDataEuroTotal}
                        />

                        {cartOpen && (
                            <CartPanel
                                openErrorSB={openErrorSB}
                                ChangeCartStatus={ChangeCartStatus}
                                cartData={cartData}
                                setCartData={setCartData}
                                cartDataEuroTotal={cartDataEuroTotal}
                                ChangeOrderPanelStatus={ChangeOrderPanelStatus}
                                DelFromCart={DelFromCart}
                                ChangeValueOfQuantity={ChangeValueOfQuantity}
                            />
                        )}
                    </div>

                    <div className="w-px h-10 bg-gray-300 mx-2" />*/}

                    {/* stato "Prodotto non Configurato" */}
                    <div className="flex flex-col items-center px-1 sm:px-3 shrink-0">
                        <span className="text-[0.7rem]">Prodotto non Configurato</span>
                        <span className="w-1/2 h-[15px] bg-[#ff56561f] rounded-[10px]" />
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-gray-300 mx-2" />

                    {/* loader */}
                    {!err && (mainLoad || transitionLoad) && (
                        <div className="mr-2 shrink-0">
                            <MinLoader sx={{ width: 25, heigth: 25, mr: 2 }} />
                        </div>
                    )}
                    <FDIconButton
                        variant='text'
                        dataTooltipId='general-compare-tooltip'
                        dataTooltipContent='Reset della Tabella'
                        onClick={() => {
                            setTransitionLoad(true);
                            UpdateTablePrice();
                        }}
                        icon={icon_update({ width: 20, height: 20 })} 
                    />
                </div>
            </div>
        </div>
    );
};
