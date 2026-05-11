import { createElement, type ComponentType } from "react";
import {
    MdOutlineDashboard,
    MdOutlineSell,
    MdOutlineProductionQuantityLimits,
    MdOutlineGroups2,
    MdOutlineGroups,
    MdOutlineShoppingCart,
    MdPayment,
    MdWebAsset,
    MdOutlineAdminPanelSettings,
    MdOutlineLocalShipping,
    MdArticle,
    MdFolder,
} from "react-icons/md";
import {
    LuPackageCheck,
    LuPackageMinus,
    LuTarget,
    LuLogs,
    LuWeight,
    LuReceiptEuro,
    LuBrain,
    LuClock5,
    LuUserSearch,
    LuSettings,
    LuShoppingCart,
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
import { FaCloudDownloadAlt, FaWarehouse } from "react-icons/fa";
import { LiaFileInvoiceDollarSolid } from "react-icons/lia";
import { HiOutlineDocumentText } from "react-icons/hi2";

export type NavigationIconSpec = {
    pack: string;
    name: string;
};

export type NavigationIconOption = NavigationIconSpec & {
    label: string;
    keywords: string[];
    component: ComponentType<{ size?: number; className?: string }>;
};

export const NAVIGATION_ICON_CATALOG: NavigationIconOption[] = [
    { pack: "md", name: "MdOutlineDashboard", label: "Dashboard", keywords: ["dashboard", "home"], component: MdOutlineDashboard },
    { pack: "md", name: "MdOutlineSell", label: "Commerciale / Sell", keywords: ["commerciale", "sell"], component: MdOutlineSell },
    { pack: "md", name: "MdOutlineProductionQuantityLimits", label: "Prodotti", keywords: ["prodotti"], component: MdOutlineProductionQuantityLimits },
    { pack: "md", name: "MdOutlineGroups2", label: "Gruppi", keywords: ["gruppi", "users"], component: MdOutlineGroups2 },
    { pack: "md", name: "MdOutlineGroups", label: "Anagrafica clienti", keywords: ["clienti", "anagrafica"], component: MdOutlineGroups },
    { pack: "md", name: "MdOutlineShoppingCart", label: "Carrello / Ordini", keywords: ["ordini", "cart"], component: MdOutlineShoppingCart },
    { pack: "md", name: "MdPayment", label: "Pagamenti", keywords: ["pagamenti"], component: MdPayment },
    { pack: "md", name: "MdWebAsset", label: "Web", keywords: ["web"], component: MdWebAsset },
    { pack: "md", name: "MdOutlineAdminPanelSettings", label: "Amministrazione", keywords: ["admin", "settings"], component: MdOutlineAdminPanelSettings },
    { pack: "md", name: "MdOutlineLocalShipping", label: "Spedizioni", keywords: ["tracking", "logistica"], component: MdOutlineLocalShipping },
    { pack: "md", name: "MdArticle", label: "Pannello", keywords: ["panel", "route"], component: MdArticle },
    { pack: "md", name: "MdFolder", label: "Gruppo", keywords: ["folder", "group"], component: MdFolder },
    { pack: "lu", name: "LuPackageCheck", label: "Ordini FB", keywords: ["fb", "orders"], component: LuPackageCheck },
    { pack: "lu", name: "LuPackageMinus", label: "Ordini FB CNR", keywords: ["cnr", "orders"], component: LuPackageMinus },
    { pack: "lu", name: "LuTarget", label: "Obiettivi / Target", keywords: ["target", "obiettivi"], component: LuTarget },
    { pack: "lu", name: "LuLogs", label: "Logs", keywords: ["logs"], component: LuLogs },
    { pack: "lu", name: "LuWeight", label: "Pesi e Volumi", keywords: ["peso", "volumi"], component: LuWeight },
    { pack: "lu", name: "LuReceiptEuro", label: "Ricevuta Euro", keywords: ["contabilità", "receipt"], component: LuReceiptEuro },
    { pack: "lu", name: "LuBrain", label: "AI / Assistant", keywords: ["ai", "assistant"], component: LuBrain },
    { pack: "lu", name: "LuClock5", label: "Tempo", keywords: ["clock", "time"], component: LuClock5 },
    { pack: "lu", name: "LuUserSearch", label: "Gestione Utenti", keywords: ["users", "search"], component: LuUserSearch },
    { pack: "lu", name: "LuSettings", label: "Settings", keywords: ["settings", "config"], component: LuSettings },
    { pack: "lu", name: "LuShoppingCart", label: "Acquisti", keywords: ["shopping", "acquisti"], component: LuShoppingCart },
    { pack: "tfi", name: "TfiPackage", label: "Package", keywords: ["package"], component: TfiPackage },
    { pack: "ri", name: "RiAdvertisementLine", label: "Marketing", keywords: ["marketing", "ad"], component: RiAdvertisementLine },
    { pack: "io5", name: "IoPricetagsOutline", label: "Promo / Prezzi", keywords: ["price", "promo"], component: IoPricetagsOutline },
    { pack: "io5", name: "IoMailOutline", label: "Mail", keywords: ["mail", "newsletter"], component: IoMailOutline },
    { pack: "io5", name: "IoSettingsOutline", label: "Impostazioni", keywords: ["settings"], component: IoSettingsOutline },
    { pack: "bs", name: "BsBoxSeam", label: "Box", keywords: ["box", "logistica"], component: BsBoxSeam },
    { pack: "bs", name: "BsPiggyBank", label: "Fido", keywords: ["fido", "bank"], component: BsPiggyBank },
    { pack: "bs", name: "BsPeople", label: "Persone", keywords: ["people", "clienti"], component: BsPeople },
    { pack: "ci", name: "CiViewTable", label: "Tabella", keywords: ["table"], component: CiViewTable },
    { pack: "ci", name: "CiDatabase", label: "Database", keywords: ["db", "tesis"], component: CiDatabase },
    { pack: "ci", name: "CiCircleList", label: "Lista", keywords: ["list", "procedure"], component: CiCircleList },
    { pack: "tb", name: "TbReceiptEuro", label: "Contribuzione", keywords: ["contribuzione"], component: TbReceiptEuro },
    { pack: "tb", name: "TbTruckReturn", label: "Resi", keywords: ["resi", "return"], component: TbTruckReturn },
    { pack: "fi", name: "FiPrinter", label: "Stampante", keywords: ["printer"], component: FiPrinter },
    { pack: "fi", name: "FiSave", label: "Save", keywords: ["save"], component: FiSave },
    { pack: "fi", name: "FiPhone", label: "Telefono", keywords: ["phone", "rubrica"], component: FiPhone },
    { pack: "gr", name: "GrDocumentConfig", label: "Configuratori", keywords: ["config"], component: GrDocumentConfig },
    { pack: "fa6", name: "FaLink", label: "Link", keywords: ["link"], component: FaLink },
    { pack: "fa6", name: "FaRegFilePdf", label: "PDF", keywords: ["pdf", "documenti"], component: FaRegFilePdf },
    { pack: "sl", name: "SlDocs", label: "Documenti", keywords: ["docs", "drive"], component: SlDocs },
    { pack: "vsc", name: "VscGraph", label: "Grafico", keywords: ["graph", "fatturati"], component: VscGraph },
    { pack: "fa", name: "FaCloudDownloadAlt", label: "Cloud", keywords: ["cloud"], component: FaCloudDownloadAlt },
    { pack: "fa", name: "FaWarehouse", label: "Warehouse", keywords: ["warehouse", "magazzino"], component: FaWarehouse },
    { pack: "lia", name: "LiaFileInvoiceDollarSolid", label: "Quotazioni", keywords: ["quotazioni", "invoice"], component: LiaFileInvoiceDollarSolid },
    { pack: "hi2", name: "HiOutlineDocumentText", label: "Preventivi", keywords: ["preventivi", "document"], component: HiOutlineDocumentText },
];

const CATALOG_BY_KEY = new Map(NAVIGATION_ICON_CATALOG.map((icon) => [`${icon.pack}:${icon.name}`, icon]));

export function normalizeNavigationIconSpec(value: unknown): NavigationIconSpec | null {
    if (!value) return null;

    if (typeof value === "string") {
        const [pack, name] = value.includes(":") ? value.split(":") : ["", value];
        if (!name) return null;
        const found = NAVIGATION_ICON_CATALOG.find((icon) => (pack ? icon.pack === pack : true) && icon.name === name);
        return found ? { pack: found.pack, name: found.name } : null;
    }

    if (typeof value === "object") {
        const spec = value as Partial<NavigationIconSpec>;
        const pack = typeof spec.pack === "string" ? spec.pack.trim() : "";
        const name = typeof spec.name === "string" ? spec.name.trim() : "";
        if (!name) return null;
        const found = CATALOG_BY_KEY.get(`${pack}:${name}`) || NAVIGATION_ICON_CATALOG.find((icon) => icon.name === name);
        return found ? { pack: found.pack, name: found.name } : null;
    }

    return null;
}

export function resolveNavigationIconComponent(value: unknown): ComponentType<{ size?: number; className?: string }> | null {
    const spec = normalizeNavigationIconSpec(value);
    if (!spec) return null;
    return CATALOG_BY_KEY.get(`${spec.pack}:${spec.name}`)?.component ?? null;
}

export function renderNavigationIcon(value: unknown, className?: string) {
    const Icon = resolveNavigationIconComponent(value);
    return Icon ? createElement(Icon, { className, size: 18 }) : null;
}
