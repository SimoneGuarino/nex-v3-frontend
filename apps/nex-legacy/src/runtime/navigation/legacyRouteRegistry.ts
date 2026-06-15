import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type LazyRouteComponent = LazyExoticComponent<ComponentType<any>>;

export type LegacyRouteRegistryEntry = {
    /**
     * Technical component key. Functional route/path/visibility/flags live in
     * navigation_resources.context and are managed by Access Builder.
     */
    key: string;
    component: LazyRouteComponent;
};

export type LegacyRouteRegistry = LegacyRouteRegistryEntry[];

function lazyDefault(loader: () => Promise<any>): LazyRouteComponent {
    return lazy(() => loader().then((module) => ({ default: module.default })));
}

function lazyNamed(loader: () => Promise<any>, exportName: string): LazyRouteComponent {
    return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}

const Dashboard = lazyDefault(() => import("layouts/dashboard"));
const Tables = lazyDefault(() => import("layouts/compare"));
const SignIn = lazyDefault(() => import("layouts/authentication/sign-in"));
const Profile = lazyDefault(() => import("layouts/profile/Overview"));
const UserManagement = lazyDefault(() => import("layouts/administration/users/userManagement.js"));
const FidoCliente = lazyDefault(() => import("layouts/fido/customerProfile"));
const OrdiniFB = lazyDefault(() => import("layouts/ordini/ordiniFB/index"));
const OrdiniFBCNR = lazyDefault(() => import("layouts/ordini/ordiniFBCNR/index.js"));
const TargetStocks = lazyDefault(() => import("layouts/stocks/targetStocks"));
const SwotDashboard = lazyDefault(() => import("layouts/swot"));
const Documenti = lazyDefault(() => import("layouts/documentiPDF"));
const Cloud = lazyDefault(() => import("layouts/drive/brandsDrive"));
const Contribuzione = lazyDefault(() => import("layouts/contribuzione"));
const PesiVolumi = lazyDefault(() => import("layouts/pesiVolumi"));
const OCFLogs = lazyNamed(() => import("layouts/administration/logs_oc_of"), "OCFLogs");
const StocksTargetConfigurator = lazyNamed(() => import("layouts/configuratore/obiettiviStocks"), "StocksTargetConfigurator");
const InserimentoFBOF = lazyDefault(() => import("layouts/ordini/inserimentoOFFB"));
const PageNotFound = lazyNamed(() => import("layouts/404"), "PageNotFound");
const Promozioni = lazyDefault(() => import("layouts/promozioni"));
const ProductsLogs = lazyNamed(() => import("layouts/logs/priceVariations"), "ProductsLogs");
const MailUpLogs = lazyDefault(() => import("layouts/logs/mailUpLogs/index"));
const NewsletterClienti = lazyNamed(() => import("layouts/marketing/newsletters/index"), "NewsletterClienti");
const GruppiMailUpClienti = lazyNamed(() => import("layouts/marketing/gruppi-mailUp/index"), "GruppiMailUpClienti");
const AnagraficaClienti = lazyNamed(() => import("layouts/marketing/anagrafica/index"), "AnagraficaClienti");
const CustomersSituation = lazyDefault(() => import("layouts/clienti"));
const RegoleSalvate = lazyDefault(() => import("layouts/php/regole_salvate"));
const GestioneResi = lazyDefault(() => import("layouts/php/gestione_resi"));
const CorrelatiAutomatici = lazyDefault(() => import("layouts/php/correlati_automatici"));
const CorrelatiManuali = lazyDefault(() => import("layouts/php/correlati_manuali"));
const Gestionesell = lazyDefault(() => import("layouts/php/gestionesellout"));
const BuyerAssistant = lazyNamed(() => import("layouts/buyerAssistant"), "BuyerAssistant");
const SbloccoOrdini = lazyDefault(() => import("layouts/ordini/sbloccoOrdini"));
const FidoManagement = lazyDefault(() => import("layouts/fido/management"));
const QueryAS400 = lazyNamed(() => import("layouts/queryAS400"), "QueryAS400");
const Quotazioni = lazyNamed(() => import("layouts/quotazioni/pages"), "Quotazioni");
const Fatturati = lazyDefault(() => import("layouts/fatturati"));
const ListiniPromo = lazyDefault(() => import("layouts/listiniPromo"));
const Rubrica = lazyDefault(() => import("layouts/rubrica"));
const Procedure = lazyDefault(() => import("layouts/procedure"));
const Trackings = lazyDefault(() => import("layouts/trackings"));
const Movimenti = lazyDefault(() => import("layouts/movimenti"));
const QuotationDetails = lazyDefault(() => import("layouts/quotazioni/pages/quotationDetails"));
const ConfiguratorPanel = lazyDefault(() => import("layouts/configuratore/gng"));
const FileSellout = lazyDefault(() => import("layouts/sellout"));
const Payments = lazyDefault(() => import("layouts/stocks/payments"));
const Preventivi = lazyDefault(() => import("layouts/preventivi"));
const PurchasesPage = lazyDefault(() => import("layouts/purchases"));
const TestPage = lazyDefault(() => import("layouts/test"));

export const legacyRouteRegistry: LegacyRouteRegistry = [
    { key: "root_dashboard", component: Dashboard },
    { key: "sign_in", component: SignIn },
    { key: "profile", component: Profile },
    { key: "dashboard", component: Dashboard },

    { key: "commerciale", component: PageNotFound },
    { key: "fb", component: OrdiniFB },
    { key: "fb_cnr", component: OrdiniFBCNR },
    { key: "sblocco_ordini", component: SbloccoOrdini },
    { key: "quotazioni", component: Quotazioni },
    { key: "listini_promo", component: ListiniPromo },

    { key: "marketing", component: PageNotFound },
    { key: "promozioni", component: Promozioni },
    { key: "mailUp_logs", component: MailUpLogs },
    { key: "newsletters", component: NewsletterClienti },
    { key: "gruppi_mailUp", component: GruppiMailUpClienti },
    { key: "anagraficaClienti", component: AnagraficaClienti },

    { key: "logistica", component: PageNotFound },
    { key: "pesiVolumi", component: PesiVolumi },
    { key: "trackings", component: Trackings },

    { key: "acquisti", component: PageNotFound },
    { key: "comparatore", component: Tables },
    { key: "contribuzione", component: Contribuzione },
    { key: "obiettivi_stocks", component: TargetStocks },
    { key: "buyer_assistant", component: BuyerAssistant },
    { key: "swot", component: SwotDashboard },

    { key: "contabilita", component: PageNotFound },
    { key: "fido_cliente", component: FidoCliente },
    { key: "fido_cliente_by_id", component: FidoCliente },
    { key: "clienti", component: CustomersSituation },
    { key: "pagamenti", component: Payments },
    { key: "fatturati", component: Fatturati },
    { key: "preventivi", component: Preventivi },
    { key: "acquisti_clienti", component: PurchasesPage },

    { key: "tesis", component: PageNotFound },
    { key: "ins_of_fb", component: InserimentoFBOF },
    { key: "gestione_resi", component: GestioneResi },

    { key: "configuratori", component: PageNotFound },
    { key: "consumabili_g&g", component: ConfiguratorPanel },
    { key: "confg_obiettivi_stocks", component: StocksTargetConfigurator },

    { key: "web", component: PageNotFound },
    { key: "correlati_automatici", component: CorrelatiAutomatici },
    { key: "correlati_manuali", component: CorrelatiManuali },
    { key: "correlati_regole_salvate", component: RegoleSalvate },
    { key: "queries_as400", component: QueryAS400 },

    { key: "sellout", component: PageNotFound },
    { key: "file_sellout", component: FileSellout },
    { key: "gestionesell", component: Gestionesell },

    { key: "resi", component: PageNotFound },
    { key: "movimenti", component: Movimenti },

    { key: "lsd", component: Rubrica },
    { key: "gestione_fido", component: FidoManagement },
    { key: "documentiPDF", component: Documenti },
    { key: "drive", component: PageNotFound },
    { key: "cloud", component: Cloud },
    { key: "procedure", component: Procedure },
    { key: "test", component: TestPage },

    { key: "dettagli_quotazione", component: QuotationDetails },

    { key: "administration", component: PageNotFound },
    { key: "user_management", component: UserManagement },
    { key: "logs_prodotti", component: ProductsLogs },
    { key: "ocf_logs", component: OCFLogs },

    { key: "maintenance", component: PageNotFound },
    { key: "404", component: PageNotFound },
];

export default legacyRouteRegistry;
