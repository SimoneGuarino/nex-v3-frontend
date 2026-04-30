import React, { RefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import { Backdrop, Button, Card, Collapse, Divider, Fade, IconButton, 
    Paper, Stack, TextField } from '@mui/material';
import { TransitionGroup } from 'react-transition-group';
import { Tag } from 'components/Tag/Tag';
import {
    icon_cart, icon_close, icon_delete, icon_info, icon_list, icon_people,
    icon_request, icon_shoppingBag, icon_total
} from 'config/icons';

import noProductImageBlackAndWhite80Opaicty from '../cart/img/6605525-no-product-image-blackAndWhite_80percOpacity.png';
import cartEmpty from 'assets/images/emptyCart/shopping-cart-with-boxes-concept-illustration_114360-18772-noBg.png';

import { NumberToEuro } from 'utils/numberToEuro';
import CustomersAutocomplete from './custommers/customersAutocomplete';
import { CustomersFidoDetailsAPI } from './fetchData/customersDetailsFido';
import MinLoader from '../../../../minLoader';
import { MakeOrderAPI } from './fetchData/makeOrder';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';


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
};


interface SummaryProps {
    cartDataEuroTotal: number
};
const Summary: React.FC<SummaryProps> = ({ cartDataEuroTotal }) => {
    return <Stack sx={{ border: '1px solid #ddd', height: 'fit-content', borderRadius: 2 }} p={2}>
        <Stack direction='row' alignItems='center' gap={1}>
            {icon_total()}
            <MDTypography variant='h5'>
                Resoconto
            </MDTypography>
        </Stack>

        <Stack direction='row' alignItems='center'>
            <MDTypography variant='body2'>
                Totale
            </MDTypography>
            <MDTypography variant='body1' sx={{ ml: 'auto' }}>
                {NumberToEuro({ toSum: [cartDataEuroTotal] })}
            </MDTypography>
        </Stack>
    </Stack>
};


interface FormProps {
    searchDataContext: { customers: Array<Object> },
    setClientSelected: (prev: any) => void;
    clientSelected: any;
    commentText: string | null;
    HandleCommentText: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    userContext: any;
    abortController: RefObject<AbortController>;
    openErrorSB: (icon: string, message: string) => void;
    orderPanelStatus: boolean;
};
const Form: React.FC<FormProps> = ({ searchDataContext, setClientSelected, clientSelected,
    commentText, HandleCommentText, userContext, abortController, openErrorSB, orderPanelStatus }) => {
    const [detailsFido, setDetailsFido] = React.useState<{
        stato: boolean,
        totale: number,
        residuo: number,
    } | null>(null);
    const [loadData, setLoadData] = React.useState<boolean>(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!clientSelected) { return; }
        setLoadData(true);
        if (orderPanelStatus) {
            CustomersFidoDetailsAPI({
                userContext, abortController, setData: setDetailsFido,
                clientSelected, setLoadData, openErrorSB, setClientSelected
            })
        } else {
            if (abortController.current) {
                abortController.current.abort();
            }
        }

        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, [clientSelected, orderPanelStatus]);


    /*const goToCustomerProfile = () => navigate(`/contabilita/fido_cliente/${clientSelected.CodiceCliente.Focelda
        ? clientSelected.CodiceCliente.Focelda :
        clientSelected.CodiceCliente.IOT}`);*/
    //apri una nuova finestra indirizzata sul profilo cliente.
    const goToCustomerProfile = () => window.open(`/contabilita/fido_cliente/${clientSelected.CodiceCliente.Focelda
        ? clientSelected.CodiceCliente.Focelda :
        clientSelected.CodiceCliente.IOT}`,
    '_blank', 'noreferrer')


    return <Stack sx={{ border: '1px solid #ddd', height: 'fit-content', borderRadius: 2 }} p={2} gap={1}>
        <Stack direction='row' alignItems='center' gap={1} mb={1}>
            {icon_list()}
            <MDTypography variant='h5'>
                Form
            </MDTypography>
        </Stack>

        <CustomersAutocomplete data={searchDataContext.customers || []}
            setClientSelected={setClientSelected} clientSelected={clientSelected} />
        <TextField
            sx={{ mt: 1 }}
            value={commentText}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => HandleCommentText(e)}
            id="outlined-multiline-static"
            label="Commento"
            multiline
            rows={4}
        />

        <Stack mt={2} gap={1}>
            {!loadData ? ((detailsFido && clientSelected) && <React.Fragment>
                <Stack direction='row' width='100%' alignItems='center'>
                    <MDTypography variant='h6' sx={{ fontSize: '0.8rem' }}>
                        FIDO
                    </MDTypography>
                    <Stack sx={{ ml: 'auto' }} direction='row' alignItems='center'>
                        <Tag text={detailsFido.stato ? 'Si' : 'No'} fontSize='0.8rem'
                            data_tooltip_content={`Questo cliente ${detailsFido.stato ? 'ha' : 'non ha'} un fido assegnato`}
                            data_tooltip_id='general-compare-tooltip' />

                        <Divider orientation='vertical' sx={{ height: 30, backgroundColor: '#000' }} />
                        <IconButton onClick={() => goToCustomerProfile()}
                            data-tooltip-content={!detailsFido.stato ? 'Richiedi fido cliente' : 'Vedi il profilo Cliente'}
                            data-tooltip-id='general-compare-tooltip'>
                            {!detailsFido.stato ? icon_request() : icon_people()}
                        </IconButton>
                    </Stack>
                </Stack>
                <Stack direction='row' width='100%' alignItems='center'>
                    <MDTypography variant='h6' sx={{ fontSize: '0.8rem' }}>
                        FIDO TOTALE
                    </MDTypography>
                    <Tag text={NumberToEuro({ toSum: [detailsFido.totale] })} fontSize='0.8rem' sx={{ marginLeft: 'auto' }} />
                </Stack>

                <Stack direction='row' width='100%' alignItems='center'>
                    <MDTypography variant='h6' sx={{ fontSize: '0.8rem' }}>
                        FIDO RESIDUO
                    </MDTypography>
                    <Tag text={NumberToEuro({ toSum: [detailsFido.residuo] })} fontSize='0.8rem' sx={{ marginLeft: 'auto' }} />
                </Stack>
            </React.Fragment>) : <MinLoader sx={{ width: 25, heigth: 25, alignSelf: 'center' }} />}
        </Stack>
    </Stack>
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
    }
};
const Product: React.FC<ProductProps> = (({ DelFromCart, index, productCode, title, avatar,
    codBuyer, category, brand, price, order, ChangeValueOfQuantity }) => {
    return <Fade in={true}>
        <Stack direction='row' gap={3} sx={{p: 1, border: '1px solid #ddd', borderRadius: 2 }}>
            <img src={avatar ? avatar : noProductImageBlackAndWhite80Opaicty} loading='lazy'
                style={{ borderRadius: 2, maxWidth: 100, alignSelf: 'center', 
                width: 'fit-content', marginLeft: 20, height: 'fit-content' }} />

            <Stack direction='row' sx={{ fontSize: '0.9rem', width: '100%'}}>
                <Stack className='product-descr-block' sx={{ width: '100%' }}>
                    <MDTypography variant='body1' sx={{ fontSize: '0.6rem' }}>
                        {category}
                    </MDTypography>
                    <MDTypography variant='h4' sx={{ fontSize: 'inherit', }}>
                        {title}
                    </MDTypography>
                    <MDTypography variant='body1' sx={{ fontSize: '0.6rem', mb: 1 }}>
                        {productCode}
                    </MDTypography>
                    <Stack direction='row' justifyContent='flex-start' gap={0.5}>
                        <Tag text={brand} data_tooltip_id='general-compare-tooltip' data_tooltip_content='Marca' />
                        <Tag text={codBuyer} icon={icon_people()} 
                            data_tooltip_id='general-compare-tooltip' data_tooltip_content='Buyer di riferimento' />
                    </Stack>

                    <Stack direction='row' alignItems='center' sx={{
                        '& input': { textAlignLast: 'center' },
                        '& .css-1upa9j4-MuiInputBase-root-MuiOutlinedInput-root': { height: '100%' }
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

                        <Stack alignItems='flex-end' ml='auto'>
                            <MDTypography variant='body2'>
                                {NumberToEuro({ toSum: [price] })} cad.
                            </MDTypography>
                            <MDTypography variant='h6'>
                                {NumberToEuro({ toSum: [order.total] })}
                            </MDTypography>
                        </Stack>
                    </Stack>

                </Stack>

                <IconButton onClick={() => DelFromCart(index)}
                    sx={{ width: 40, height: 40, ml: 'auto', fontSize: '1.5rem' }}>
                    {icon_delete({ color: '#af3636' })}
                </IconButton>
            </Stack>

        </Stack>
    </Fade>
});


const NoProduct: React.FC<{}> = (() => {
    return <Stack p={2} alignItems='center' sx={{ opacity: '0.5', flex: '70%', height: '100%' }}
        flex='100%' justifyContent='center'>
        <img src={cartEmpty} loading='lazy'
            style={{
                borderRadius: 2, maxWidth: 300, marginBottom: '1.5rem',
                width: 'fit-content', height: 'fit-content', filter: 'grayscale(1)'
            }} />
        <MDTypography variant='h5'>Non ci sono prodotti nel carrello.</MDTypography>
    </Stack>
});
interface CartProps {
    cartData: Array<ProductCartProps>;
    DelFromCart: (index: number) => void;
    ChangeValueOfQuantity: (index: number, quantity: number) => void;
};
const Cart: React.FC<CartProps> = ({ cartData, DelFromCart, ChangeValueOfQuantity }) => {
    return cartData.length > 0 ? <TransitionGroup style={{
        flexDirection: 'column', flex: '70%', overflow: 'auto', paddingRight: 10
    }}>
        {cartData.map((data: ProductCartProps, index: number) => (
            <Collapse key={index} sx={{ mb: 2 }}><Product productCode={data.productCode}
                title={data.title} avatar={data.avatar} codBuyer={data.codBuyer}
                category={data.category} brand={data.brand} price={data.price} order={data.order}
                DelFromCart={DelFromCart} index={index} ChangeValueOfQuantity={ChangeValueOfQuantity} /></Collapse>
        ))}
    </TransitionGroup> : <NoProduct />
};


interface FooterProps {
};
const Footer: React.FC<FooterProps> = ({ }) => {
    return <Stack direction='row' alignItems='center' mt='auto' gap={2}>
        {icon_info({ color: '#aaa' })}
        <MDTypography variant='body2' sx={{ color: '#aaa', fontSize: '0.8rem' }}>Assicurati di aver compilato tutti i campi obbligatori per poter eseguire l'ordine,
            inoltre se l'utente selezionato non possiede un fido potrai comodamente selezionarlo cliccando sul pulsante fido.
        </MDTypography>
    </Stack>
};


interface HeaderProps {
    ChangeOrderPanelStatus: () => void;
};
const Header: React.FC<HeaderProps> = ({ ChangeOrderPanelStatus }) => {
    const palette = MainTheme().palette;

    return <Stack direction='row' alignItems='center' mb={2}>
        <Stack direction='row' alignItems='center' gap={1}>
            {icon_cart({ width: 30, height: 30 })}
            <MDTypography variant='h3'>Ordina i Prodotti</MDTypography>
        </Stack>
        <IconButton onClick={() => ChangeOrderPanelStatus()} sx={{ ml: 'auto', 
            backgroundColor: palette.error.light, "&:hover": { backgroundColor: palette.error.dark} }}>
            {icon_close({ color: '#fff' })}
        </IconButton>
    </Stack>
};


interface OrderPanelProps {
    cartData: Array<ProductCartProps>;
    DelFromCart: (index: number) => void;
    ChangeValueOfQuantity: (index: number, quantity: number) => void;
    orderPanelStatus: boolean;
    ChangeOrderPanelStatus: () => void;
    cartDataEuroTotal: number;

    searchDataContext: { customers: Array<Object> },
    setClientSelected: (prev: any) => void;
    clientSelected: any;
    userContext: any;
    abortController: RefObject<AbortController>;
    openErrorSB: (icon: string, message: string) => void;
    ChangeSuccessPanel: () => void;
    ResetCookie: () => void;
    setCartData: (prev: any) => void;
};
export const OrderPanel: React.FC<OrderPanelProps> = ({ orderPanelStatus, ChangeOrderPanelStatus,
cartData, DelFromCart, ChangeValueOfQuantity, cartDataEuroTotal, searchDataContext, setClientSelected,
clientSelected, userContext, abortController, openErrorSB, ChangeSuccessPanel, ResetCookie, setCartData}) => {
    const [commentText, setCommentText] = React.useState<string>("");
    const HandleCommentText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCommentText(e.target.value);

    const SuccessOperation = () => {
        ChangeSuccessPanel();
        setCartData([]);
        ChangeOrderPanelStatus();
        ResetCookie();
    }
    const Order = () => {
        const objectToSend = {
            cart: cartData,
            customer: clientSelected,
            comment: (commentText.trim() == '' ? null : commentText)
        };

        MakeOrderAPI({ userContext, abortController, objectToSend, openErrorSB, 
            SuccessOperation});
    };



    React.useEffect(() => {
        if (!orderPanelStatus) {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, [])

    return <Backdrop open={orderPanelStatus} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Card sx={{
            display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 800, maxWidth: 1900,
            height: '90%', width: '90%', borderRadius: 5, transition: 'all 200ms ease-in', p: 2
        }}>
            <Header ChangeOrderPanelStatus={ChangeOrderPanelStatus} />
            <Stack direction='row' flex={80} gap={2} overflow='auto' >
                <Cart cartData={cartData} DelFromCart={DelFromCart} ChangeValueOfQuantity={ChangeValueOfQuantity} />
                <Stack flex={30} gap={2}>
                    <Summary cartDataEuroTotal={cartDataEuroTotal} />
                    <Form searchDataContext={searchDataContext} setClientSelected={setClientSelected}
                        clientSelected={clientSelected} commentText={commentText} HandleCommentText={HandleCommentText}
                        userContext={userContext} abortController={abortController} openErrorSB={openErrorSB}
                        orderPanelStatus={orderPanelStatus} />
                    <Fade in={Boolean(cartData.length > 0)}><Stack mt='auto'>
                        <Button variant='contained' onClick={() => Order()}
                            sx={{ color: '#fff' }}>
                            {icon_shoppingBag()} Ordina
                        </Button>
                    </Stack></Fade>
                </Stack>

            </Stack>
            <Footer />
        </Card>
    </Backdrop>
};