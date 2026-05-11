import type { ComponentType } from "react";
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

export type NavigationIconComponent = ComponentType<{ size?: number; className?: string }>;

export type NavigationIconSpec = {
    pack: string;
    name: string;
};

const ICONS_BY_KEY: Record<string, NavigationIconComponent> = {
    "md:MdOutlineDashboard": MdOutlineDashboard,
    "md:MdOutlineSell": MdOutlineSell,
    "md:MdOutlineProductionQuantityLimits": MdOutlineProductionQuantityLimits,
    "md:MdOutlineGroups2": MdOutlineGroups2,
    "md:MdOutlineGroups": MdOutlineGroups,
    "md:MdOutlineShoppingCart": MdOutlineShoppingCart,
    "md:MdPayment": MdPayment,
    "md:MdWebAsset": MdWebAsset,
    "md:MdOutlineAdminPanelSettings": MdOutlineAdminPanelSettings,
    "md:MdOutlineLocalShipping": MdOutlineLocalShipping,
    "md:MdArticle": MdArticle,
    "md:MdFolder": MdFolder,
    "lu:LuPackageCheck": LuPackageCheck,
    "lu:LuPackageMinus": LuPackageMinus,
    "lu:LuTarget": LuTarget,
    "lu:LuLogs": LuLogs,
    "lu:LuWeight": LuWeight,
    "lu:LuReceiptEuro": LuReceiptEuro,
    "lu:LuBrain": LuBrain,
    "lu:LuClock5": LuClock5,
    "lu:LuUserSearch": LuUserSearch,
    "lu:LuSettings": LuSettings,
    "lu:LuShoppingCart": LuShoppingCart,
    "tfi:TfiPackage": TfiPackage,
    "ri:RiAdvertisementLine": RiAdvertisementLine,
    "io5:IoPricetagsOutline": IoPricetagsOutline,
    "io5:IoMailOutline": IoMailOutline,
    "io5:IoSettingsOutline": IoSettingsOutline,
    "bs:BsBoxSeam": BsBoxSeam,
    "bs:BsPiggyBank": BsPiggyBank,
    "bs:BsPeople": BsPeople,
    "ci:CiViewTable": CiViewTable,
    "ci:CiDatabase": CiDatabase,
    "ci:CiCircleList": CiCircleList,
    "tb:TbReceiptEuro": TbReceiptEuro,
    "tb:TbTruckReturn": TbTruckReturn,
    "fi:FiPrinter": FiPrinter,
    "fi:FiSave": FiSave,
    "fi:FiPhone": FiPhone,
    "gr:GrDocumentConfig": GrDocumentConfig,
    "fa6:FaLink": FaLink,
    "fa6:FaRegFilePdf": FaRegFilePdf,
    "sl:SlDocs": SlDocs,
    "vsc:VscGraph": VscGraph,
    "fa:FaCloudDownloadAlt": FaCloudDownloadAlt,
    "fa:FaWarehouse": FaWarehouse,
    "lia:LiaFileInvoiceDollarSolid": LiaFileInvoiceDollarSolid,
    "hi2:HiOutlineDocumentText": HiOutlineDocumentText,
};

for (const [key, icon] of Object.entries({ ...ICONS_BY_KEY })) {
    const [, name] = key.split(":");
    if (name && !ICONS_BY_KEY[name]) ICONS_BY_KEY[name] = icon;
}

function normalizeIconKey(value: unknown): string | null {
    if (!value) return null;

    if (typeof value === "string") {
        const normalized = value.trim();
        return normalized || null;
    }

    if (typeof value === "object") {
        const spec = value as Partial<NavigationIconSpec>;
        const pack = typeof spec.pack === "string" ? spec.pack.trim() : "";
        const name = typeof spec.name === "string" ? spec.name.trim() : "";
        if (pack && name) return `${pack}:${name}`;
        return name || null;
    }

    return null;
}

export function resolveNavigationIcon(value: unknown, fallback?: NavigationIconComponent | null): NavigationIconComponent | null {
    const source = value && typeof value === "object" ? value as Record<string, unknown> : null;
    const iconCandidate = source?.presentation && typeof source.presentation === "object"
        ? (source.presentation as Record<string, unknown>).icon
        : source?.icon ?? value;

    const iconKey = normalizeIconKey(iconCandidate);
    if (!iconKey) return fallback || null;
    return ICONS_BY_KEY[iconKey] || ICONS_BY_KEY[iconKey.split(":").pop() || ""] || fallback || null;
}

export function hasNavigationIcon(value: unknown): boolean {
    const iconKey = normalizeIconKey(value);
    return Boolean(iconKey && (ICONS_BY_KEY[iconKey] || ICONS_BY_KEY[iconKey.split(":").pop() || ""]));
}
