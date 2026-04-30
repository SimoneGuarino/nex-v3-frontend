/** 
  Tutte le routes del front end sono situate qui,
  possono essere aggiunte nuove route, customizzate o eliminate qui.

  Una volta aggiunta una nuova route in questo file verrà visualizzata automaticamente nella
  Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `visible` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `visible` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `visible` key.
  8. The `route` key is used to store the route location which is used for the react router.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

import { type ReactElement, type ReactNode } from "react";

import Dashboard from "layouts/dashboard";
import Tables from "layouts/compare";
import Profile from "layouts/profile/Overview";
import UserManagement from "layouts/administration/users/userManagement.js";
import GeneralSettings from "layouts/administration/generalSettings";
import FidoCliente from "layouts/fido/customerProfile";
import OrdiniFB from 'layouts/ordini/ordiniFB/index';
import OrdiniFBCNR from 'layouts/ordini/ordiniFBCNR/index.js';
import Maintenance from './maintenance';
import TargetStocks from "layouts/stocks/targetStocks";
import SwotDashboard from "layouts/swot";
import Documenti from "layouts/documentiPDF";
import Cloud from "layouts/drive/brandsDrive";
import Contribuzione from 'layouts/contribuzione';
import PesiVolumi from "layouts/pesiVolumi";
import { SupplierConfigurator } from "layouts/configuratore/supplier";
import { Products } from "layouts/products";
import { OCFLogs } from "layouts/administration/logs_oc_of";
import { StocksTargetConfigurator } from "layouts/configuratore/obiettiviStocks";
import InserimentoFBOF from 'layouts/ordini/inserimentoOFFB';
import { PageNotFound } from "layouts/404";
import Promozioni from "layouts/promozioni";
import { ProductsLogs } from "layouts/logs/priceVariations";
//import TargetAgents from "layouts/stocks/targetAgents";
import MailUpLogs from "layouts/logs/mailUpLogs/index";
import { NewsletterClienti } from "layouts/marketing/newsletters/index";
import { GruppiMailUpClienti } from "layouts/marketing/gruppi-mailUp/index";
import { AnagraficaClienti } from "layouts/marketing/anagrafica/index";
import CorrelazioneCategorieDistributori from "layouts/configuratore/correlazioneCategorie";
import CustomersSituation from "layouts/clienti";
import RegoleSalvate from "layouts/php/regole_salvate";
import GestioneResi from "layouts/php/gestione_resi";
import CorrelatiAutomatici from "layouts/php/correlati_automatici";
import CorrelatiManuali from "layouts/php/correlati_manuali";
import Gestionesell from "layouts/php/gestionesellout";
import { BuyerAssistant } from "layouts/buyerAssistant";
import SbloccoOrdini from "layouts/ordini/sbloccoOrdini";
import FidoManagement from "layouts/fido/management";
import { QueryAS400 } from "layouts/queryAS400";
import { Quotazioni } from "layouts/quotazioni/pages"
import Fatturati from "layouts/fatturati";
import ListiniPromo from "layouts/listiniPromo";
import Rubrica from "layouts/rubrica";
import Procedure from "layouts/procedure";
import TestPage from "layouts/test"
import Movimenti from "layouts/movimenti";
import QuotationDetails from "layouts/quotazioni/pages/quotationDetails";
import ConfiguratorPanel from "layouts/configuratore/gng";
import FileSellout from "layouts/sellout";
import Payments from "layouts/stocks/payments";


// ---------------------------------------------------------------------------
// Icon imports
// ---------------------------------------------------------------------------
import {
    MdOutlineDashboard, MdOutlineSell, MdOutlineProductionQuantityLimits,
    MdOutlineGroups2, MdOutlineGroups, MdOutlineShoppingCart, MdPayment, MdWebAsset, MdOutlineAdminPanelSettings
} from "react-icons/md";
import {
    LuPackageCheck, LuPackageMinus, LuTarget, LuLogs, LuWeight, LuReceiptEuro, LuBrain, LuClock5,
    LuUserSearch, LuSettings
} from "react-icons/lu";
import { TfiPackage } from "react-icons/tfi";
import { RiAdvertisementLine } from "react-icons/ri";
import { IoPricetagsOutline, IoMailOutline, IoSettingsOutline } from "react-icons/io5";
import { BsBoxSeam, BsPiggyBank, BsPeople } from "react-icons/bs";
import { CiViewTable, CiDatabase, CiCircleList } from "react-icons/ci";
import { TbReceiptEuro, TbTruckReturn } from "react-icons/tb";
import { FiPrinter, FiSave, FiPhone } from "react-icons/fi";
import { GrDocumentConfig } from "react-icons/gr";
import { FaLink, FaRegFilePdf } from "react-icons/fa6";
import { SlDocs } from "react-icons/sl";
import { VscGraph } from "react-icons/vsc";
import { ImHammer2 } from "react-icons/im";
import { FaCloudDownloadAlt, FaWarehouse } from "react-icons/fa";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";
import { navigateToApp } from "@nex/shared-platform";


// -----------------------------------------------------------------------------
// Tipi
// -----------------------------------------------------------------------------

/** Route “foglia” che punta ad un componente specifico */
export interface RouteLeaf {
    name: string;
    key: string;
    route: string;                   // es. "/dashboard"
    component: ReactElement;         // componente React da renderizzare
    icon?: ReactNode;
    hide?: boolean;                  // se true, non mostra nella Sidenav ma è raggiungibile
    group?: number;                  // per eventuali raggruppamenti/ordinamenti
}

/** Route annidata (gruppo/collapsible) */
export interface RouteNested {
    type: "nested" | "visible";
    name: string;
    key: string;
    route: string;                   // path base del gruppo, es. "/marketing"
    icon?: ReactNode;
    component?: ReactElement;        // opzionale per pagine “indice” del gruppo
    nested: {
        elements: RouteLeaf[];         // voci interne visibili nel menu
    };
    group?: number;
}

/** Un item di menu può essere una foglia o un gruppo annidato */
export type RouteItem = RouteLeaf | RouteNested;

// -----------------------------------------------------------------------------
// Array di routes
// -----------------------------------------------------------------------------
export const routes: any = [
    /**
        STRUMENTI
    */
    {
        name: "Dashboard",
        key: "dashboard",
        route: "/",
        component: Dashboard,
    },
    {
        name: "Profile",
        key: "profile",
        route: "/profile",
        component: Profile,
    },
    /*{
        name: "Community",
        key: "community",
        icon: <Icon fontSize="small">forum</Icon>,
        route: "/community",
        component: Community,
    },
    {
        name: "Post",
        key: "post",
        icon: <Icon fontSize="small">post</Icon>,
        route: "/community/:id",
        component: Post,
    },
    {
        name: "CreatePost",
        key: "create_post",
        icon: <Icon fontSize="small">post</Icon>,
        route: "/community/create_post",
        component: CreateTopic,
    },*/

    {
        type: "visible",
        name: "Dashboard",
        key: "dashboard",
        icon: MdOutlineDashboard,
        route: "/dashboard",
        component: Dashboard,
        group: 0
    },
    {
        type: "nested",
        name: "Commerciale",
        key: "commerciale",
        route: "/commerciale",
        icon: MdOutlineSell,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "ordini FB",
                    key: "fb",
                    icon: LuPackageCheck,
                    route: "/commerciale/fb",
                    component: OrdiniFB,
                },
                {
                    name: "ordini FB CNR",
                    key: "fb_cnr",
                    icon: LuPackageMinus,
                    route: "/commerciale/fb_cnr",
                    component: OrdiniFBCNR,
                },
                {
                    name: "sblocco ordini",
                    key: "sblocco_ordini",
                    icon: TfiPackage,
                    route: "/commerciale/sblocco_ordini",
                    component: SbloccoOrdini,
                },
                {
                    name: "Prodotti",
                    key: "prodotti",
                    icon: MdOutlineProductionQuantityLimits,
                    route: "/commerciale/prodotti",
                    component: Products,
                },
                {
                    name: "Quotazioni",
                    key: "quotazioni",
                    icon: LiaFileInvoiceDollarSolid,
                    route: "/commerciale/quotazioni",
                    component: Quotazioni,
                    isNew: true
                },
                {
                    name: "Listini e Promo",
                    key: "listini_promo",
                    icon: IoPricetagsOutline,
                    route: "/commerciale/listini_promo",
                    component: ListiniPromo,
                    isNew: true
                },
                /*{
                    name: "Obiettivi Commerciali",
                    key: "obiettivi_commerciali",
                    icon: LuTarget,
                    route: "/commerciale/obiettivi_commerciali",
                    component: TargetAgents,
                }*/
            ]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Marketing",
        key: "marketing",
        route: "/marketing",
        icon: RiAdvertisementLine,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "Promozioni",
                    key: "promozioni",
                    icon: IoPricetagsOutline,
                    route: "/marketing/promozioni",
                    component: Promozioni,
                },
                {
                    name: "Logs MailUp",
                    key: "mailUp_logs",
                    icon: LuLogs,
                    route: "/marketing/mailUp_logs",
                    component: MailUpLogs,
                },
                {
                    name: "Newsletters",
                    key: "newsletters",
                    icon: IoMailOutline,
                    route: "/marketing/newsletters",
                    component: NewsletterClienti,
                },
                {
                    name: "Gruppi MailUp",
                    key: "gruppi_mailUp",
                    icon: MdOutlineGroups2,
                    route: "/marketing/gruppi_mailUp",
                    component: GruppiMailUpClienti,
                },
                {
                    name: "Anagrafica clienti",
                    key: "anagraficaClienti",
                    icon: MdOutlineGroups,
                    route: "/marketing/anagraficaClienti",
                    component: AnagraficaClienti,
                },
            ]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Logistica",
        key: "logistica",
        route: "/logistica",
        icon: BsBoxSeam,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "Pesi e Volumi",
                    key: "pesiVolumi",
                    icon: LuWeight,
                    route: "/logistica/pesiVolumi",
                    component: PesiVolumi,
                },
            ]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Acquisti",
        key: "acquisti",
        route: "/acquisti",
        icon: MdOutlineShoppingCart,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "Comparatore",
                    key: "comparatore",
                    icon: CiViewTable,
                    route: "/acquisti/comparatore",
                    component: Tables,
                },
                {
                    name: "Contribuzione",
                    key: "contribuzione",
                    icon: TbReceiptEuro,
                    route: "/acquisti/contribuzione",
                    component: Contribuzione,
                },
                {
                    name: "Obiettivi Stock",
                    key: "obiettivi_stocks",
                    icon: LuTarget,
                    route: "/acquisti/obiettivi_stocks",
                    component: TargetStocks,
                },
                {
                    name: "Buyer Assistant",
                    key: "buyer_assistant",
                    icon: LuBrain,
                    route: "/acquisti/buyer_assistant",
                    component: BuyerAssistant
                },
                {
                    name: "swot",
                    key: "swot",
                    icon: LuTarget,
                    route: "/acquisti/swot",
                    component: SwotDashboard,
                },
            ]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Contabilità",
        key: "contabilita",
        route: "/contabilita",
        icon: LuReceiptEuro,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "Fido",
                    key: "fido_cliente",
                    route: "/contabilita/fido_cliente",
                    icon: BsPiggyBank,
                    component: FidoCliente,
                },
                {  //abbilitazione all'inserimento del id cliente per la ricerca mirata tramite URL
                    hide: true,
                    name: "Fido:ID",
                    key: "fido_cliente",
                    route: "/contabilita/fido_cliente/:id",
                    component: FidoCliente,
                },
                {
                    name: "Clienti",
                    key: "clienti",
                    route: "/contabilita/clienti",
                    icon: BsPeople,
                    component: CustomersSituation,
                    isNew: true
                },
                {
                    name: "Pagamenti",
                    key: "pagamenti",
                    route: "/contabilita/pagamenti",
                    icon: MdPayment,
                    component: Payments,
                },
                {
                    name: "Fatturati",
                    key: "fatturati",
                    route: "/contabilita/fatturati",
                    icon: VscGraph,
                    component: Fatturati,
                    isNew: true
                },
            ]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Tesis",
        key: "tesis",
        icon: CiDatabase,
        route: "/tesis",
        nested: {
            elements: [
                {
                    name: "Ins. ordini OF/FB",
                    key: "ins_of_fb",
                    icon: MdOutlineShoppingCart,
                    route: "/tesis/ins_of_fb",
                    component: InserimentoFBOF,
                },
                {
                    name: "Gestione Resi",
                    key: "gestione_resi",
                    icon: MdOutlineShoppingCart,
                    route: "/tesis/gestione_resi",
                    component: GestioneResi,
                },
            ]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Configuratori",
        key: "configuratori",
        route: "/configuratori",
        icon: GrDocumentConfig,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "Consumabili G&G",
                    key: "consumabili_g&g",
                    icon: FiPrinter,
                    route: "/configuratori/consumabili_g&g",
                    component: ConfiguratorPanel,
                },
                {
                    name: "Fornitori",
                    key: "fornitori",
                    icon: FaLink,
                    route: "/configuratori/fornitori",
                    component: SupplierConfigurator,
                }, {
                    name: "Correlazione Categorie Distributori",
                    key: "correlazione_categorie_distributori",
                    icon: FaLink,
                    route: "/configuratori/correlazione_categorie_distributori",
                    component: CorrelazioneCategorieDistributori,
                }, {
                    name: "Obiettivi Stocks",
                    key: "confg_obiettivi_stocks",
                    icon: LuTarget,
                    route: "/configuratori/confg_obiettivi_stocks",
                    component: StocksTargetConfigurator,
                }, /*{
                name: "Obiettivi Commerciali",
                key: "config_obiettivi_commerciali",
                icon: LuTarget,
                route: "/configuratori/config_obiettivi_commerciali",
                component: TargetCommerciali,
            }*/]
        },
        group: 0
    }, {
        type: "nested",
        name: "Web",
        key: "web",
        route: "/web",
        icon: MdWebAsset,
        nested: {
            elements: [{
                name: "Correlati Automatici",
                key: "correlati_automatici",
                icon: FaLink,
                route: "/web/correlati_automatici",
                component: CorrelatiAutomatici,
            }, {
                name: "Corellati Manuali",
                key: "correlati_manuali",
                icon: FaLink,
                route: "/web/correlati_manuali",
                component: CorrelatiManuali,
            }, {
                name: "Correlati Regole Salvate",
                key: "correlati_regole_salvate",
                icon: FiSave,
                route: "/web/correlati_regole_salvate",
                component: RegoleSalvate,
            }, {
                name: "Queries AS400",
                key: "queries_as400",
                icon: FiSave,
                route: "/web/queries_as400",
                component: QueryAS400,
            }]
        },
        group: 0
    }, {
        type: "nested",
        name: "Sellout",
        key: "sellout",
        route: "/sellout",
        icon: MdOutlineSell,
        nested: {
            elements: [
                {
                    name: "File Sellout",
                    key: "file_sellout",
                    icon: LuClock5,
                    route: "/sellout/file_sellout",
                    component: FileSellout,
                }, {
                    name: "Gestione Sellout",
                    key: "gestionesell",
                    icon: IoSettingsOutline,
                    route: "/sellout/gestionesell",
                    component: Gestionesell,
                }]
        },
        group: 0
    },
    {
        type: "nested",
        name: "Resi",
        key: "resi",
        route: "/resi",
        icon: TbTruckReturn,
        component: PageNotFound,
        nested: {
            elements: [
                {
                    name: "Movimenti",
                    key: "movimenti",
                    icon: FaWarehouse,
                    route: "/resi/movimenti",
                    component: Movimenti,
                    isNew: true,
                },
            ]
        }
    },
    {
        type: 'visible',
        name: "Lsd",
        key: "lsd",
        icon: FiPhone,
        route: "/lsd",
        component: Rubrica,
        group: 0,
        isNew: true
    },
    {
        type: 'visible',
        name: "Gestione Richieste Fido",
        key: "gestione_fido",
        icon: BsPiggyBank,
        route: "/gestione_fido",
        component: FidoManagement,
        group: 0
    },
    {
        type: "visible",
        name: "swot",
        key: "swot",
        icon: LuTarget,
        route: "/swot",
        component: SwotDashboard,
        group: 0
    },
    {
        type: "visible",
        name: "Documenti",
        key: "documentiPDF",
        icon: FaRegFilePdf,
        route: "/documentiPDF",
        component: Documenti,
        group: 0
    },
    {
        type: "nested",
        name: "Drive",
        key: "drive",
        icon: SlDocs,
        route: "/drive",
        nested: {
            elements: [
                {
                    name: "Cloud",
                    key: "cloud",
                    icon: FaCloudDownloadAlt,
                    route: "/drive/cloud",
                    component: Cloud,
                },
                {
                    name: "Procedure",
                    key: "procedure",
                    icon: CiCircleList,
                    route: "/drive/procedure",
                    component: Procedure,
                    isNew: true
                }
            ]
        }
    },
    // {
    //     type: "visible",
    //     name: "Quotazioni",
    //     key: "quotazioni",
    //     icon: ImHammer2,
    //     route: "/quotazioni",
    //     component: Quotazioni,
    //     group: 0,

    // },
    {
        type: "hidden",
        name: "Dettagli Quotazione",
        key: "dettagli_quotazione",
        route: "/quotazioni/:id",
        component: QuotationDetails,
    },
    /**
     * ADMIN
    */
    {
        type: "nested",
        name: "Amministrazione",
        key: "administration",
        icon: MdOutlineAdminPanelSettings,
        route: "/administration",
        component: UserManagement,
        nested: {
            elements: [
                {
                    name: "Gestione Utenti",
                    key: "user_management",
                    icon: LuUserSearch,
                    route: "administration/user_management",
                    component: UserManagement,
                },
                {
                    name: "General Settings",
                    key: "general_settings",
                    route: "administration/general_settings",
                    icon: LuSettings,
                    component: GeneralSettings,
                },
                {
                    name: "Prodotti Logs",
                    key: "logs_prodotti",
                    route: "administration/logs_prodotti",
                    icon: LuLogs,
                    component: ProductsLogs,
                },
                {
                    name: "OC & OF Logs",
                    key: "ocf_logs",
                    route: "administration/ocf_logs",
                    icon: LuLogs,
                    component: OCFLogs,
                },
                {
                    name: "Survey Builder",
                    key: "survey_builder",
                    icon: RiAdvertisementLine,
                    route: "/survey",
                    isNew: true,
                    component: () => {
                        navigateToApp("survey");
                    },
                }
            ]
        },
        group: 1
    },
    {
        name: "maintenance",
        key: "maintenance",
        route: "/maintenance",
        component: Maintenance,
    },
    {
        name: "404",
        key: "404",
        route: "*",
        component: PageNotFound,
    },
    // {
    //     name: "test",
    //     key: "test",
    //     icon: MdOutlineGroups,
    //     route: "/test",
    //     component: TestPage,
    //     hide: true
    // }
];

export default routes;
