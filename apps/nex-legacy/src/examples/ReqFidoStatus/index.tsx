import { useState, useEffect, useRef, useContext } from "react";
import { UserContext } from "../../context/UserContext";

// @mui material components
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Stack from "@mui/material/Stack";

// React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Custom styles for the QuoteCart
import ReqFidoStatusRoot from "examples/ReqFidoStatus/ReqFidoStatusRoot";

//Virtualized degli eleemnti
import Virtualized from "examples/Virtualized";

// @mui icons
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

// React context
import {
    useMaterialUIController,
    setOpenReqFidoStatus,
} from "context/index";
import { useNexTheme } from "@nex/theme-system";

/* =========================
 * tipi locali (dedotti)
 * ========================= */
interface QuoteItem {
    _id: string;
    Nome: string;
    [key: string]: unknown;
}

interface UserDetails {
    _id: string;
    codAS400?: string;
    [key: string]: unknown;
}

interface UserContextState {
    token?: string;
    details?: UserDetails; // opzionale perché usi userContext?.details
    [key: string]: unknown;
}

type UserContextTuple = [
    UserContextState,
    React.Dispatch<React.SetStateAction<UserContextState>>
];

interface QuoteUserTarget {
    cod_cliente?: string;
    name?: string;
    [key: string]: unknown;
}

interface ControllerState {
    openReqFidoStatus: boolean;
    quoteUserTarget?: QuoteUserTarget;
    [key: string]: unknown;
}

type VirtualizedProps = {
    data: QuoteItem[];
    sendTitleChange: (quote_id: string, textChanged: string) => void | (() => void);
    deleteQuoteCart: (quote_id: string) => void | (() => void);
};
const VirtualizedList = Virtualized as unknown as React.FC<VirtualizedProps>;

function ReqFidoStatus(): JSX.Element {
    const [quoteCartData, setQuoteCartData] = useState<QuoteItem[]>([]);
    const [controller, dispatch] = (useMaterialUIController() as unknown) as [
        ControllerState,
        React.Dispatch<any>
    ];
    const { openReqFidoStatus, quoteUserTarget } = controller;
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    // ✅ qui destrutturi: userContext è l'OGGETTO stato, non la tupla
    const [userContext, setUserContext] = useContext(UserContext) as unknown as UserContextTuple;

    const abortController = useRef<AbortController | null>(null);

    const cancelRequest = (): void => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    const handleCloseQuoteCart = () => setOpenReqFidoStatus(dispatch, false);

    const API_BASE = import.meta.env.VITE_API_QUOTATION ?? "";

    const ReadQuoteCartDataDB = (): void | (() => void) => {
        /* if (quoteUserTarget === undefined || (quoteUserTarget as any) === "") { return }
           abortController.current = new AbortController();
    
           fetch(API_BASE + "requests/quotationCart/read/3dx10e7v9dn81xurkvz4", {
             signal: abortController.current.signal,
             method: "POST",
             body: JSON.stringify({
               token: userContext?.token,
               id_commerciale: userContext?.details?._id,
               codice_cliente: quoteUserTarget?.cod_cliente,
             }),
             headers: { "Content-Type": "application/JSON" },
           })
             .then((response) => {
               if (!response.ok) throw new Error(String(response));
               return response.json();
             })
             .then((res) => {
               setQuoteCartData(res.data as QuoteItem[]);
             });
    
           return cancelRequest; */
    };

    const addQuoteCart = (): void | (() => void) => {
        if (quoteUserTarget === undefined || (quoteUserTarget as any) === "") return;

        abortController.current = new AbortController();

        fetch(API_BASE + "requests/quotationCart/insert/vptctshzttrahbom4l4v", {
            signal: abortController.current.signal,
            method: "POST",
            body: JSON.stringify({
                token: userContext?.token,
                CodiceAgente: userContext?.details?.codAS400,
                id_commerciale: userContext?.details?._id,
                codice_cliente: quoteUserTarget?.cod_cliente,
            }),
            headers: { "Content-Type": "application/JSON" },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(String(response));
                }
                return response.json();
            })
            .then((_) => {
                ReadQuoteCartDataDB();
            });

        return cancelRequest;
    };

    const SendTitleChange = (quote_id: string, textChanged: string): void | (() => void) => {
        if (quote_id === undefined || textChanged === undefined) return;

        setQuoteCartData((prev) => {
            const copy = [...prev];
            const quoteIndex = copy.findIndex((elm) => elm._id === quote_id);
            if (quoteIndex >= 0) {
                copy[quoteIndex] = { ...copy[quoteIndex], Nome: textChanged };
            }
            return copy;
        });

        abortController.current = new AbortController();

        fetch(API_BASE + "requests/quotationCart/update/w88sxhs87a0ia4h51n5p", {
            signal: abortController.current.signal,
            method: "POST",
            body: JSON.stringify({
                token: userContext?.token,
                id_commerciale: userContext?.details?._id,
                codice_cliente: quoteUserTarget?.cod_cliente,
                id_quotazione: quote_id,
                title: textChanged,
            }),
            headers: { "Content-Type": "application/JSON" },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(String(response));
                }
                return response.json();
            })
            .then(() => { });

        return cancelRequest;
    };

    const DeleteQuoteCart = (quote_id: string): void | (() => void) => {
        if (quote_id === undefined) return;

        setQuoteCartData((prev) => {
            const copy = [...prev];
            const quoteIndex = copy.findIndex((elm) => elm._id === quote_id);
            if (quoteIndex >= 0) copy.splice(quoteIndex, 1);
            return copy;
        });

        abortController.current = new AbortController();

        fetch(API_BASE + "requests/quotationCart/delete/6554z1paz0po23x04nl3", {
            signal: abortController.current.signal,
            method: "POST",
            body: JSON.stringify({
                token: userContext?.token,
                id_commerciale: userContext?.details?._id,
                codice_cliente: quoteUserTarget?.cod_cliente,
                id_quotazione: quote_id,
            }),
            headers: { "Content-Type": "application/JSON" },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(String(response));
                }
                return response.json();
            })
            .then(() => { });

        return cancelRequest;
    };

    useEffect(() => {
        ReadQuoteCartDataDB();
    }, [quoteUserTarget]);

    return (
        <ReqFidoStatusRoot variant="permanent" ownerState={{ openReqFidoStatus }}>
            <MDBox
                display="flex"
                justifyContent="space-between"
                alignItems="baseline"
                pt={4}
                pb={0.5}
                px={3}
            >
                <MDBox>
                    <Stack direction="row" gap={5} alignItems="center">
                        <MDTypography variant="h5">Cart</MDTypography>
                        <MDTypography variant="body2" color="text">
                            Cliente: {quoteUserTarget?.name}
                        </MDTypography>
                    </Stack>
                </MDBox>

                <Icon
                    sx={({
                        typography: { size },
                        palette: { dark, white },
                    }) => ({
                        fontSize: `${(size as any).lg} !important`,
                        color: darkMode ? (white as any).main : (dark as any).main,
                        stroke: "currentColor",
                        strokeWidth: "2px",
                        cursor: "pointer",
                        transform: "translateY(5px)",
                    })}
                    onClick={handleCloseQuoteCart}
                >
                    close
                </Icon>
            </MDBox>

            <Stack>
                <VirtualizedList
                    data={quoteCartData}
                    sendTitleChange={SendTitleChange}
                    deleteQuoteCart={DeleteQuoteCart}
                />
            </Stack>
            <IconButton
                onClick={() => addQuoteCart()}
                className="css-addQuotationCart-btn"
                sx={{
                    maxWidth: 40,
                    maxHeight: 40,
                    marginLeft: "auto",
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    backgroundColor: "#7F55DA",
                    borderRadius: "5px !important",
                    color: "#fff",
                }}
                aria-label="addQuoteCart"
                size="large"
            >
                <AddShoppingCartIcon />
            </IconButton>
        </ReqFidoStatusRoot>
    );
}

export default ReqFidoStatus;
