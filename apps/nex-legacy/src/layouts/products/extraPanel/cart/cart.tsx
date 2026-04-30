import React from 'react';

import { Button, Card, Collapse, Divider, Fade, IconButton, Stack, TextField } from '@mui/material';

import noProductImageBlackAndWhite80Opaicty from './img/6605525-no-product-image-blackAndWhite_80percOpacity.png';
import cartEmpty from 'assets/images/emptyCart/shopping-cart-with-boxes-concept-illustration_114360-18772-noBg.png';

import { Tag } from 'components/Tag/Tag';
import { icon_close, icon_delete, icon_people } from 'config/icons';
import { TransitionGroup } from 'react-transition-group';
import { NumberToEuro } from 'utils/index.js';
import MDTypography from 'components/MDTypography';
import { useMaterialUIController } from 'context/index';
import theme from 'assets/theme';
import { MainTheme } from 'assets/settingsTheme';


interface ProductCartProps {
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
    }
}


interface FooterProps {
    cartDataEuroTotal: number;
    darkMode: boolean;
    ChangeOrderPanelStatus: () => void;
};


interface ProductProps {
    ChangeValueOfQuantity: (index: number, newValue: number) => void;
    DelFromCart: (index: number) => void;
    index: number;
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
    darkMode: boolean;
};
const Product: React.FC<ProductProps> = (({ DelFromCart, index, productCode, title, avatar,
    codBuyer, category, brand, price, order, darkMode, ChangeValueOfQuantity }) => {
    const palette = MainTheme().palette;

    return <Fade in={true}>
        <Stack sx={{ fontSize: '0.8rem', p: 1, flexDirection: 'row', borderBottom: `1px solid ${darkMode ? palette.grey[800] : palette.grey[300]}` }}>
            <img src={avatar ? avatar : noProductImageBlackAndWhite80Opaicty} loading='lazy'
                style={{ borderRadius: 2, maxWidth: 120, marginRight: 10, alignSelf: 'center', width: 'fit-content', height: 'fit-content' }} />

            <Stack className='product-descr-block'>
                <MDTypography variant='body1' sx={{ fontSize: '0.6rem' }}>
                    {category}
                </MDTypography>
                <MDTypography variant='h4' sx={{ fontSize: 'inherit', mb: 1 }}>
                    {title}
                </MDTypography>
                <MDTypography variant='body1' sx={{ fontSize: '0.6rem' }}>
                    {productCode}
                </MDTypography>
                <Stack direction='row' justifyContent='flex-start' gap={0.5}>
                    <Tag text={brand} data_tooltip_id='general-compare-tooltip' data_tooltip_content='Marca' />
                    <Tag text={codBuyer} icon={icon_people()}
                        data_tooltip_id='general-compare-tooltip' data_tooltip_content='Buyer di riferimento' />
                </Stack>

                <Stack direction='row' alignItems='center' mt={2} sx={{
                    maxHeight: 27,
                    '& input': { textAlignLast: 'center', height: '100%' },
                }}>
                    <Button variant='outlined' onClick={() => ChangeValueOfQuantity(index,
                        (order.quantity > 1 ? order.quantity - 1 : order.quantity))}
                        sx={{ p: 0, minWidth: 30, minHeight: 25, height: 25 }}>
                        -
                    </Button>
                    <TextField
                        defaultValue={order.quantity}
                        value={order.quantity}
                        sx={{ m: 1, width: 50, height: 25, minHeight: 25, textAlign: 'center' }}
                    />
                    <Button variant='outlined' onClick={() => ChangeValueOfQuantity(index, order.quantity + 1)}
                        sx={{ p: 0, minWidth: 30, minHeight: 25, height: 25 }}>
                        +
                    </Button>
                </Stack>

                <Stack alignItems='flex-end' mt={1}>
                    <MDTypography variant='body2'>
                        {NumberToEuro({ toSum: [price] })} cad.
                    </MDTypography>
                    <MDTypography variant='h6'>
                        {NumberToEuro({ toSum: [order.total] })}
                    </MDTypography>
                </Stack>
            </Stack>

            <IconButton onClick={() => DelFromCart(index)}
                sx={{ fontSize: '1rem', width: 25, height: 25, ml: 'auto' }}>
                {icon_delete()}
            </IconButton>
        </Stack>
    </Fade>
});

const Footer: React.FC<FooterProps> = (({ ChangeOrderPanelStatus,
cartDataEuroTotal, darkMode }) => {
    const palette = MainTheme().palette;

    return <Stack p={2} borderTop={`1px solid ${darkMode ? palette.grey[700] : palette.grey[400]}`} gap={1}>
        <Stack direction='row'>
            <MDTypography variant='body2' sx={{ fontSize: '0.6rem' }}>
                Totale
            </MDTypography>
            <MDTypography variant='h6' sx={{ marginLeft: 'auto' }}>
                {NumberToEuro({ toSum: [cartDataEuroTotal] })}
            </MDTypography>
        </Stack>

        <Button variant='contained' sx={{ color: '#fff' }} onClick={() => ChangeOrderPanelStatus()}>
            continua con l'ordine</Button>
    </Stack>
});

const NoProduct: React.FC<{}> = (() => {
    return <Stack p={2} alignItems='center' sx={{ opacity: '0.5', height: '100%' }} flex='100%' justifyContent='center'>
        <img src={cartEmpty} loading='lazy'
            style={{
                borderRadius: 2, maxWidth: 250, marginBottom: '1.5rem',
                width: 'fit-content', height: 'fit-content', filter: 'grayscale(1)'
            }} />
        <MDTypography>Non ci sono prodotti nel carrello.</MDTypography>
    </Stack>
});


interface CartPanelProps {
    openErrorSB: (icon: string, message: string) => void;
    ChangeCartStatus: () => void;
    cartData: Array<ProductCartProps>;
    setCartData: (prev: any) => void;
    cartDataEuroTotal: number;
    ChangeOrderPanelStatus: () => void;
    DelFromCart: (index: number) => void;
    ChangeValueOfQuantity: (index: number, quantity: number) => void;
};
export const CartPanel: React.FC<CartPanelProps> = ({ ChangeOrderPanelStatus,
openErrorSB, ChangeCartStatus, cartData, setCartData,
cartDataEuroTotal, DelFromCart, ChangeValueOfQuantity }) => {
    const [controller, dispatch] = useMaterialUIController();
    const { darkMode } = controller;
    const palette = MainTheme().palette;

    return <Stack id="hintBox" mt={1} sx={{
        maxWidth: '375px', minHeight: 650, maxHeight: 670, backgroundColor: `${palette.background.card}`, borderRadius: 3,
        border: "1px solid #1d344e26",
        boxShadow: "0rem 0rem 2rem 0rem rgb(0 0 0 / 24%)",
        position: "absolute", zIndex: 3
    }} translate="no">
        <Stack direction='row' alignItems='center' p={1} pl={2}>
            <MDTypography>Mio Carrello ({cartData.length})</MDTypography>
            <IconButton sx={{ ml: 'auto' }} onClick={() => ChangeCartStatus()}>
                {icon_close()}
            </IconButton>
        </Stack>
        <Divider sx={{ backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`, m: 0 }} />
        <Stack overflow='auto' height='100%' maxHeight={510} flex='100%'>
            {cartData.length !== 0 ? <TransitionGroup style={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: '100%' }}>
                {cartData.map((data: ProductCartProps, index: number) => (
                    <Collapse key={index}><Product productCode={data.productCode}
                        title={data.title} avatar={data.avatar} codBuyer={data.codBuyer}
                        category={data.category} brand={data.brand} price={data.price} order={data.order}
                        DelFromCart={DelFromCart} index={index} ChangeValueOfQuantity={ChangeValueOfQuantity}
                        darkMode={darkMode} />
                    </Collapse>
                ))}
            </TransitionGroup> : <NoProduct />}
        </Stack>

        {cartData.length !== 0 && <Footer cartDataEuroTotal={cartDataEuroTotal}
            ChangeOrderPanelStatus={ChangeOrderPanelStatus} darkMode={darkMode}/>}
    </Stack>
}