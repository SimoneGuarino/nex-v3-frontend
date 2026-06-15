import React from "react";
import FDButton from "components/UI/buttons/FDButton";
import FDSelect, { type FDSelectOption } from "components/UI/input/FDSelect";
import type { AnyRecord, PanelMode } from "../types";
import {
    cn,
    formatCurrencyIt,
    formatDateMaybe,
    formatDecimalIt,
    formatNumberIt,
    formatPercentIt,
    pickFirstNonEmpty,
    toDisplayText,
} from "../helpers/panelUtils";
import {
    getCreditSafeCommentaryTone,
    getCreditSafeFlagItems,
    humanizeCreditSafeKey,
} from "../helpers/creditSafe";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";
import CreditsafeIcon from "assets/icons/Creditsafe_Icon.webp";

const STATUS_TRANSLATIONS: Record<string, string> = {
    active: "Attiva",
    inactive: "Inattiva",
    pending: "In attesa",
    registered: "Registrata",
    production: "Produzione",
    cache: "Cache",
    financial: "Finanziario",
    large: "Grande impresa",
    medium: "Media impresa",
    small: "Piccola impresa",
    micro: "Micro impresa",
    positive: "Positivo",
    neutral: "Neutro",
    negative: "Negativo",
    notset: "Non specificato",
    yes: "Si",
    no: "No",
};

const LOCAL_FINANCIAL_LABELS: Record<string, string> = {
    operatingRevenues: "Ricavi operativi",
    increasesInInternallyConstructedFixedAssets: "Incrementi di immobilizzazioni interne",
    totalOtherIncomeAndRevenues: "Altri proventi e ricavi",
    totalValueOfProduction: "Valore totale della produzione",
    purchaseOfGoods: "Acquisti di merci",
    totalPayrollAndRelatedCosts: "Costo del personale",
    ebitda: "EBITDA",
    ebit: "EBIT",
    totalAmortisationDepreciationAndWriteDowns: "Ammortamenti e svalutazioni",
    otherOperatingExpenses: "Altri costi operativi",
    totalCostOfProduction: "Costo totale della produzione",
    totalFinancialIncomeAndExpense: "Proventi e oneri finanziari",
    totalValueAdjustmentsToFinancialAssetsAndLiabilities: "Rettifiche di valore su attivita e passivita finanziarie",
    preTaxResult: "Risultato ante imposte",
    totalTaxesOnTheIncomeForTheYear: "Imposte sul reddito",
    profitOrLossForTheYear: "Utile/perdita d'esercizio",
    cashFlowPL: "Cash flow da conto economico",
    intangibleFixedAssets: "Immobilizzazioni immateriali",
    tangibleFixedAssets: "Immobilizzazioni materiali",
    financialFixedAssets: "Immobilizzazioni finanziarie",
    totalFixedAssets: "Totale immobilizzazioni",
    totalInventories: "Rimanenze",
    totalReceivables: "Crediti totali",
    debtorsDueWithin1Year: "Crediti entro 12 mesi",
    dueFromSuppliersWithin1Year: "Crediti verso fornitori entro 12 mesi",
    currentFinancialAssets: "Attivita finanziarie correnti",
    liquidAssets: "Disponibilita liquide",
    totalCurrentAssets: "Totale attivo circolante",
    accruedIncomeAndPrepayments: "Ratei e risconti attivi",
    totalAssets: "Totale attivo",
    shareholdersEquity: "Patrimonio netto",
    shareCapital: "Capitale sociale",
    otherReserves: "Altre riserve",
    netProfitOrLossForTheYear: "Risultato netto dell'esercizio",
    provisionForRisksAndCharges: "Fondi rischi e oneri",
    provisionForSeveranceIndemnity: "Fondo TFR",
    totalPayables: "Debiti totali",
    dueWithin1Year: "Debiti entro 12 mesi",
    dueToSuppliersWithin1Year: "Debiti verso fornitori entro 12 mesi",
    dueAfter1Year: "Debiti oltre 12 mesi",
    otherPayables: "Altri debiti",
    accruedExpensesAndPrepayments: "Ratei e risconti passivi",
    totalLiabilities: "Totale passivo",
    profitOrLossForTheYearBeforeIncomeTax: "Risultato ante imposte",
    cashFlowBeforeChangesToNetWorkingCapital: "Cash flow prima del circolante",
    cashFlowAfterChangesToNetWorkingCapital: "Cash flow dopo il circolante",
    cashFlowFromCurrentActivities: "Cash flow da gestione corrente",
    cashFlowsFromInvestments: "Cash flow da investimenti",
    cashFlowsFromFinancingActivities: "Cash flow da finanziamenti",
    changeInLiquidAssets: "Variazione disponibilita liquide",
    liquidAssetsAtTheStartOfTheYear: "Liquidita a inizio anno",
    liquidAssetsAtTheEndOfTheYear: "Liquidita a fine anno",
    prepaidTax: "Imposte anticipate",
    changeInRevenuesPercentage: "Variazione ricavi",
    changeInTotalValueOfProductionPercentage: "Variazione valore produzione",
    changeInTotalAssetsPercentage: "Variazione totale attivo",
    changeInShareholdersEquityPercentage: "Variazione patrimonio netto",
    returnOnSalesPercentage: "Return on sales",
    returnOnInvestmentPercentage: "Return on investment",
    returnOnEquityPercentage: "Return on equity",
    currentRatio: "Current ratio",
    acidTest: "Acid test",
    debtorDays: "Giorni incasso crediti",
    creditorDays: "Giorni pagamento debiti",
    pfn: "Posizione finanziaria netta",
    ebitdaMargin: "Margine EBITDA",
    ebitMargin: "Margine EBIT",
};

type CreditSafeDetailsTab = "anagrafica" | "segnalazioni" | "analisi" | "gruppo";
type CreditSafeAnalysisView = "esg" | "kpi2" | "kpi3" | "bilancio";

type CreditSafeProps = {
    mode: PanelMode;
    creditSafe: AnyRecord | null;
    onOpenDetails?: () => void;
};

type CreditSafeSectionProps = {
    creditSafe: AnyRecord;
    onOpenDetails?: () => void;
};

type KeyValueRow = {
    k: string;
    v: React.ReactNode;
};

type TableColumn<T extends AnyRecord> = {
    key: string;
    header: string;
    className?: string;
    render: (row: T, index: number) => React.ReactNode;
};

type CompactTableCardProps<T extends AnyRecord> = {
    title: string;
    description?: string;
    rows: T[];
    columns: TableColumn<T>[];
    emptyLabel: string;
};

type SelectorItem = {
    key: string;
    label: string;
};

type KpiCategoryOption = {
    key: string;
    label: string;
    description: string;
    category: AnyRecord;
};

type FinancialStatementReportCard = {
    key: string;
    year: string;
    reportTypeLabel: string;
    formatLabel: string;
    statement: AnyRecord;
};

type FinancialStatementYearGroup = {
    key: string;
    label: string;
    reports: FinancialStatementReportCard[];
};

const DETAILS_TABS: Array<{ key: CreditSafeDetailsTab; label: string }> = [
    { key: "anagrafica", label: "Anagrafica legale e registro" },
    { key: "segnalazioni", label: "Segnalazioni e commenti" },
    { key: "analisi", label: "Analisi e KPI" },
    { key: "gruppo", label: "Struttura di gruppo" },
];

const ANALYSIS_VIEW_ITEMS: Array<{ key: CreditSafeAnalysisView; label: string }> = [
    { key: "esg", label: "ESG" },
    { key: "kpi2", label: "ATECO 2 cifre" },
    { key: "kpi3", label: "ATECO 3 cifre" },
    { key: "bilancio", label: "Bilancio locale" },
];

const FINANCIAL_REPORT_TYPE_LABELS: Record<string, string> = {
    LocalFinancialsCSIT: "Bilancio CSIT",
    LocalFinancialsFullCSIT: "Bilancio CSIT completo",
    LocalFinancialsIFRS: "Bilancio IFRS",
};

const FINANCIAL_REPORT_TYPE_ORDER: Record<string, number> = {
    LocalFinancialsCSIT: 0,
    LocalFinancialsFullCSIT: 1,
    LocalFinancialsIFRS: 2,
};

const CompactTableCard = <T extends AnyRecord>({
    title,
    description,
    rows,
    columns,
    emptyLabel,
}: CompactTableCardProps<T>) => (
    <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70">
            <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
            {description && (
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{description}</p>
            )}
        </div>

        {rows.length ? (
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="text-left text-neutral-500 dark:text-neutral-400">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn("px-4 py-2 font-semibold whitespace-nowrap", column.className)}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-neutral-800 dark:text-neutral-100">
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={`${title}-${rowIndex}`}
                                className="border-t border-neutral-200/60 dark:border-neutral-800/60 align-top"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={`${column.key}-${rowIndex}`}
                                        className={cn("px-4 py-2", column.className)}
                                    >
                                        {column.render(row, rowIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="px-4 py-3">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{emptyLabel}</p>
            </div>
        )}
    </div>
);

const DetailsGroup: React.FC<{
    title: string;
    description?: string;
    children: React.ReactNode;
}> = ({ title, description, children }) => (
    <section className="space-y-3">
        <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                {title}
            </h4>
            {description && (
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{description}</p>
            )}
        </div>
        {children}
    </section>
);

const SelectorBar: React.FC<{
    ariaLabel: string;
    items: SelectorItem[];
    activeKey: string;
    onChange: (key: string) => void;
    className?: string;
}> = ({ ariaLabel, items, activeKey, onChange, className }) => (
    <div className={cn("overflow-x-auto", className)}>
        <div
            className="flex min-w-max items-center gap-1 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-1"
            role="tablist"
            aria-label={ariaLabel}
        >
            {items.map((item) => (
                <FDButton
                    key={item.key}
                    asMotion={false}
                    size="small"
                    color={activeKey === item.key ? "primary" : "neutral"}
                    variant={activeKey === item.key ? "solid" : "textHover"}
                    className="shrink-0"
                    onClick={() => onChange(item.key)}
                >
                    {item.label}
                </FDButton>
            ))}
        </div>
    </div>
);

function asArray<T = AnyRecord>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function asRecord(value: unknown): AnyRecord | null {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : null;
}

function translateValue(value: unknown): string {
    const text = String(value ?? "").trim();
    if (!text) return "-";

    const translated = STATUS_TRANSLATIONS[text.toLowerCase()];
    return translated ?? text;
}

function getCompanyStatusLabel(statusBlock: AnyRecord | null | undefined): string {
    const description = String(statusBlock?.description ?? "").trim();
    if (description) return translateValue(description);
    return translateValue(statusBlock?.status);
}

function formatFigureCurrency(value: any, fallback = "-"): string {
    const figure = asRecord(value);
    return formatCurrencyIt(figure?.value ?? value, fallback);
}

function formatNumericValue(value: any, fallback = "-"): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return formatDecimalIt(numeric, fallback, 2);
}

function formatPeopleCount(value: any, fallback = "-"): string {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return toDisplayText(value, fallback);
    return formatNumberIt(numeric, fallback);
}

function getActivitySummary(creditSafe: AnyRecord | null): AnyRecord | null {
    return (
        asRecord(creditSafe?.CompanySummary?.mainActivity) ??
        asRecord(creditSafe?.AlternateSummary?.mainActivity) ??
        asRecord(creditSafe?.AlternateSummary?.activityClassifications) ??
        null
    );
}

function getEsgIndicator(creditSafe: AnyRecord | null): AnyRecord | null {
    return (
        asArray<AnyRecord>(creditSafe?.LocalIndicators).find(
            (indicator) => String(indicator?.type ?? "").trim().toUpperCase() === "ESG"
        ) ?? null
    );
}

function getKpiIndicator(creditSafe: AnyRecord | null, type: "KPI_2" | "KPI_3"): AnyRecord | null {
    return (
        asArray<AnyRecord>(creditSafe?.LocalIndicators).find(
            (indicator) => String(indicator?.type ?? "").trim().toUpperCase() === type
        ) ?? null
    );
}

function getLatestLocalFinancialStatement(creditSafe: AnyRecord | null): AnyRecord | null {
    const statements = asArray<AnyRecord>(creditSafe?.LocalFinancialStatements);
    return statements.length ? statements[0] : null;
}

function getLocalFinancialStatements(creditSafe: AnyRecord | null): AnyRecord[] {
    return asArray<AnyRecord>(creditSafe?.LocalFinancialStatements);
}

function formatFinancialFieldLabel(fieldKey: string): string {
    return LOCAL_FINANCIAL_LABELS[fieldKey] ?? humanizeCreditSafeKey(fieldKey);
}

function formatFinancialValue(sectionKey: string, fieldKey: string, value: any): string {
    if (sectionKey === "ratios") {
        if (
            /(percentage|margin|return)/i.test(fieldKey) ||
            fieldKey === "currentRatio" ||
            fieldKey === "acidTest"
        ) {
            return formatPercentIt(value);
        }

        if (/days/i.test(fieldKey)) {
            return formatNumericValue(value);
        }

        if (fieldKey === "pfn") {
            return formatCurrencyIt(value);
        }

        return formatNumericValue(value);
    }

    return formatCurrencyIt(value);
}

function buildFinancialRows(sectionKey: string, block: AnyRecord | null): KeyValueRow[] {
    if (!block) return [];

    return Object.entries(block)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([fieldKey, value]) => ({
            k: formatFinancialFieldLabel(fieldKey),
            v: formatFinancialValue(sectionKey, fieldKey, value),
        }));
}

function buildRows(items: Array<KeyValueRow | null | false | undefined>): KeyValueRow[] {
    return items.filter(Boolean) as KeyValueRow[];
}

function renderKeyValueRows(rows: KeyValueRow[]) {
    return rows.map((row) => <SectionKeyValue key={row.k} k={row.k} v={row.v} />);
}

function renderFallbackCard(message: string) {
    return (
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 p-4">
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{message}</p>
        </div>
    );
}

function getKpiCategoryKey(category: AnyRecord, index: number): string {
    return `${toDisplayText(category?.type, "periodo")}-${index}`;
}

function getKpiCategoryLabel(category: AnyRecord, index: number): string {
    return toDisplayText(category?.type ?? category?.description, `Periodo ${index + 1}`);
}

export function getFinancialStatementYear(statement: AnyRecord | null | undefined): string {
    const yearText = String(statement?.year ?? "").trim();
    if (/^\d{4}$/.test(yearText)) return yearText;

    const rawDate = String(statement?.yearEndDate ?? "").trim();
    const yearMatch = rawDate.match(/(\d{4})/);
    if (yearMatch) return yearMatch[1];

    return "N/D";
}

function getFinancialYearSortValue(year: string): number {
    return /^\d{4}$/.test(year) ? Number(year) : -1;
}

function getFinancialStatementFormatLabel(statement: AnyRecord | null | undefined): string {
    if (statement?.consolidatedAccounts === true) return "Consolidato";
    if (statement?.consolidatedAccounts === false) return "Ordinario";

    const accountFormat = toDisplayText(statement?.accountFormat, "").toLowerCase();
    if (accountFormat.includes("consolid")) return "Consolidato";
    if (accountFormat.includes("ordin")) return "Ordinario";

    return toDisplayText(statement?.accountFormat);
}

function getFinancialStatementFormatOrder(statement: AnyRecord | null | undefined): number {
    return getFinancialStatementFormatLabel(statement) === "Consolidato" ? 1 : 0;
}

export function getFinancialStatementReportTypeLabel(type: unknown): string {
    const normalized = String(type ?? "").trim();
    if (!normalized) return "Bilancio locale";

    return FINANCIAL_REPORT_TYPE_LABELS[normalized] ?? normalized;
}

function getFinancialStatementTypeOrder(statement: AnyRecord | null | undefined): number {
    const normalized = String(statement?.type ?? "").trim();
    return FINANCIAL_REPORT_TYPE_ORDER[normalized] ?? Number.MAX_SAFE_INTEGER;
}

function getFinancialStatementReportKey(statement: AnyRecord, index: number): string {
    const year = getFinancialStatementYear(statement);
    const type = String(statement?.type ?? "unknown").trim() || "unknown";
    const format = getFinancialStatementFormatLabel(statement);
    return `${year}-${type}-${format}-${index}`;
}

function getFinancialStatementKey(statement: AnyRecord, index: number): string {
    return getFinancialStatementReportKey(statement, index);
}

function getFinancialStatementLabel(statement: AnyRecord, index: number): string {
    return formatDateMaybe(statement?.yearEndDate, getFinancialStatementYear(statement) || `Bilancio ${index + 1}`);
}

function getKpiCategoryOptions(indicator: AnyRecord | null): KpiCategoryOption[] {
    return asArray<AnyRecord>(indicator?.categories).map((category, index) => ({
        key: getKpiCategoryKey(category, index),
        label: getKpiCategoryLabel(category, index),
        description: toDisplayText(category?.description, "Valori comparativi settore"),
        category,
    }));
}

export function getFinancialStatementOptions(statements: AnyRecord[]): AnyRecord[] {
    return statements.map((statement, index) => ({
        key: getFinancialStatementKey(statement, index),
        label: getFinancialStatementLabel(statement, index),
        description: buildRows([
            { k: "Valuta", v: toDisplayText(statement?.currency) },
            { k: "Formato", v: toDisplayText(statement?.accountFormat) },
            {
                k: "Consolidato",
                v:
                    statement?.consolidatedAccounts == null
                        ? "-"
                        : statement?.consolidatedAccounts
                            ? "Si"
                            : "No",
            },
        ])
            .map((row) => `${row.k}: ${row.v}`)
            .join(" · "),
        statement,
    }));
}

function buildFinancialStatementMetaItems(
    statement: AnyRecord | null | undefined
): Array<{ label: string; value: string }> {
    return [
        { label: "Formato", value: getFinancialStatementFormatLabel(statement) },
        { label: "Valuta", value: toDisplayText(statement?.currency) },
        { label: "Settimane", value: formatNumberIt(statement?.numberOfWeeks) },
    ];
}

function buildFinancialReportSelectOptions(
    reports: FinancialStatementReportCard[]
): FDSelectOption<string>[] {
    const duplicateCounts = new Map<string, number>();
    const seenCounts = new Map<string, number>();

    reports.forEach((report) => {
        const baseLabel = `${report.reportTypeLabel} - ${report.formatLabel}`;
        duplicateCounts.set(baseLabel, (duplicateCounts.get(baseLabel) ?? 0) + 1);
    });

    return reports.map((report) => {
        const baseLabel = `${report.reportTypeLabel} - ${report.formatLabel}`;
        const nextIndex = (seenCounts.get(baseLabel) ?? 0) + 1;
        seenCounts.set(baseLabel, nextIndex);

        return {
            value: report.key,
            label:
                (duplicateCounts.get(baseLabel) ?? 0) > 1
                    ? `${baseLabel} - variante ${nextIndex}`
                    : baseLabel,
        };
    });
}

export function groupFinancialStatementsByYear(statements: AnyRecord[]): FinancialStatementYearGroup[] {
    const grouped = new Map<string, FinancialStatementReportCard[]>();

    statements.forEach((statement, index) => {
        const year = getFinancialStatementYear(statement);
        const report: FinancialStatementReportCard = {
            key: getFinancialStatementReportKey(statement, index),
            year,
            reportTypeLabel: getFinancialStatementReportTypeLabel(statement?.type),
            formatLabel: getFinancialStatementFormatLabel(statement),
            statement,
        };

        const reports = grouped.get(year) ?? [];
        reports.push(report);
        grouped.set(year, reports);
    });

    return Array.from(grouped.entries())
        .map(([year, reports]) => ({
            key: year,
            label: year,
            reports: [...reports].sort((left, right) => {
                const formatOrder =
                    getFinancialStatementFormatOrder(left.statement) -
                    getFinancialStatementFormatOrder(right.statement);
                if (formatOrder !== 0) return formatOrder;

                const typeOrder =
                    getFinancialStatementTypeOrder(left.statement) -
                    getFinancialStatementTypeOrder(right.statement);
                if (typeOrder !== 0) return typeOrder;

                return left.key.localeCompare(right.key);
            }),
        }))
        .sort((left, right) => getFinancialYearSortValue(right.key) - getFinancialYearSortValue(left.key));
}

function buildFinancialStatementSections(statement: AnyRecord | null) {
    return [
        {
            key: "profitAndLoss",
            title: "conto economico",
            rows: buildFinancialRows("profitAndLoss", asRecord(statement?.profitAndLoss)),
        },
        {
            key: "balanceSheet",
            title: "stato patrimoniale",
            rows: buildFinancialRows("balanceSheet", asRecord(statement?.balanceSheet)),
        },
        {
            key: "cashFlow",
            title: "cash flow",
            rows: buildFinancialRows("cashFlow", asRecord(statement?.cashFlow)),
        },
        {
            key: "indicators",
            title: "indicatori",
            rows: [
                ...buildFinancialRows("ratios", asRecord(statement?.ratios)),
                ...buildFinancialRows("otherFinancials", asRecord(statement?.otherFinancials)),
            ],
        },
    ].filter((section) => section.rows.length > 0);
}

function renderKpiCategoryTable(option: KpiCategoryOption | null, title: string, emptyLabel: string) {
    if (!option) {
        return renderFallbackCard(emptyLabel);
    }

    return (
        <CompactTableCard
            title={title}
            description={option.description}
            rows={asArray<AnyRecord>(option.category?.indicatorDetails)}
            columns={[
                {
                    key: "indicator",
                    header: "Indicatore",
                    className: "min-w-[180px]",
                    render: (row) => (
                        <div>
                            <p className="font-medium">
                                {toDisplayText(
                                    row?.description,
                                    humanizeCreditSafeKey(String(row?.type ?? ""))
                                )}
                            </p>
                            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                                {toDisplayText(row?.type, "-")}
                            </p>
                        </div>
                    ),
                },
                {
                    key: "companyValue",
                    header: "Azienda",
                    render: (row) => formatNumericValue(row?.keyValues?.companyValue),
                },
                {
                    key: "industryAverage",
                    header: "Media settore",
                    render: (row) => formatNumericValue(row?.keyValues?.industryAverage),
                },
                {
                    key: "industryMedian",
                    header: "Mediana",
                    render: (row) => formatNumericValue(row?.keyValues?.industryMedian),
                },
            ]}
            emptyLabel="KPI non disponibili per il periodo selezionato."
        />
    );
}

function CreditSafeSummaryView({ creditSafe, onOpenDetails }: CreditSafeSectionProps) {
    const companySummary = asRecord(creditSafe?.CompanySummary);
    const alternateSummary = asRecord(creditSafe?.AlternateSummary);
    const rating = asRecord(companySummary?.creditRating);
    const providerValue = asRecord(rating?.providerValue);
    const creditLimit = asRecord(rating?.creditLimit);
    const activity = getActivitySummary(creditSafe);
    const flagItems = getCreditSafeFlagItems(creditSafe);
    const esgIndicator = getEsgIndicator(creditSafe);
    const latestLocalFinancial = getLatestLocalFinancialStatement(creditSafe);

    const companyName = toDisplayText(
        pickFirstNonEmpty(companySummary?.businessName, alternateSummary?.businessName),
        "-"
    );
    const companyStatusLabel = getCompanyStatusLabel(
        asRecord(companySummary?.companyStatus) ?? asRecord(alternateSummary?.companyStatus)
    );
    const turnover = pickFirstNonEmpty(companySummary?.latestTurnoverFigure, alternateSummary?.latestTurnoverFigure);
    const shareholdersEquity = pickFirstNonEmpty(
        companySummary?.latestShareholdersEquityFigure,
        latestLocalFinancial?.balanceSheet?.shareholdersEquity
    );
    const employeeCount = pickFirstNonEmpty(alternateSummary?.numberOfEmployees, null);
    const scoreValue = toDisplayText(providerValue?.value);
    const scoreMax = toDisplayText(providerValue?.maxValue, "100");
    const riskLabel = toDisplayText(rating?.commonDescription ?? rating?.providerDescription);
    const overallEsgLabel = toDisplayText(esgIndicator?.value?.description, "-");
    const summaryFlags = flagItems.filter(
        (item) =>
            item.key === "hasInsolvency" ||
            item.key === "hasProtesti" ||
            item.key === "hasPrejudicials"
    );

    return (
        <SectionContainer clickable={false} onActivate={onOpenDetails}>
            <SectionHeader
                title="Credit Safe"
                description="Sintesi report esterno, rating e segnali di rischio"
                icon={<img src={CreditsafeIcon} alt="Credit Safe" className="w-6 h-6 rounded-sm" />}
                rightContent={
                    <SectionActionButton
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetails?.();
                        }}
                        rightIcon={FaPlus({})}
                    >
                        <span>Dettagli</span>
                    </SectionActionButton>
                }
            />

            <div className="p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                    <SectionPill tone={companyStatusLabel === "Attiva" ? "ok" : "neutral"}>
                        stato: <span className="ml-1 font-semibold">{companyStatusLabel}</span>
                    </SectionPill>
                    <SectionPill>
                        rating: <span className="ml-1 font-semibold">{toDisplayText(rating?.commonValue)}</span>
                    </SectionPill>
                    <SectionPill>
                        score: <span className="ml-1 font-semibold">{`${scoreValue}/${scoreMax}`}</span>
                    </SectionPill>
                    <SectionPill tone="ok">
                        limite: <span className="ml-1 font-semibold">{formatFigureCurrency(creditLimit)}</span>
                    </SectionPill>
                </div>

                <SectionBlock contentClassName="space-y-2">
                    <SectionKeyValue k="Societa" v={companyName} />
                    <SectionKeyValue
                        k="Attivita principale"
                        v={
                            activity
                                ? `${toDisplayText(activity?.code, "-")} - ${toDisplayText(activity?.description, "-")}`
                                : "-"
                        }
                    />
                    <SectionKeyValue k="Profilo rischio" v={riskLabel} />
                </SectionBlock>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <SectionBlock
                        title="dimensione"
                        className="bg-white/70 dark:bg-neutral-900/40"
                        contentClassName="space-y-2"
                    >
                        <SectionKeyValue k="Ultimo fatturato" v={formatFigureCurrency(turnover)} />
                        <SectionKeyValue k="Patrimonio netto" v={formatFigureCurrency(shareholdersEquity)} />
                        <SectionKeyValue k="Dipendenti" v={formatPeopleCount(employeeCount)} />
                    </SectionBlock>

                    <SectionBlock title="alert sintetici" className="bg-white/70 dark:bg-neutral-900/40">
                        <div className="flex flex-wrap gap-2">
                            {summaryFlags.map((item) => (
                                <SectionPill key={item.key} tone={item.tone}>
                                    {item.label}:{" "}
                                    <span className="ml-1 font-semibold">{item.valueLabel.toLowerCase()}</span>
                                </SectionPill>
                            ))}
                            <SectionPill tone="neutral">
                                ESG: <span className="ml-1 font-semibold">{overallEsgLabel}</span>
                            </SectionPill>
                        </div>
                    </SectionBlock>
                </div>
            </div>
        </SectionContainer>
    );
}

function CreditSafeDetailsView({ creditSafe, onOpenDetails }: CreditSafeSectionProps) {

    const meta = asRecord(creditSafe?.Meta);
    const companySummary = asRecord(creditSafe?.CompanySummary);
    const alternateSummary = asRecord(creditSafe?.AlternateSummary);
    const rating = asRecord(companySummary?.creditRating);
    const providerValue = asRecord(rating?.providerValue);
    const creditLimit = asRecord(rating?.creditLimit);
    const activity = getActivitySummary(creditSafe);
    const flagItems = getCreditSafeFlagItems(creditSafe);
    const esgIndicator = getEsgIndicator(creditSafe);
    const esgCategories = asArray<AnyRecord>(esgIndicator?.categories);
    const commentaries = asArray<AnyRecord>(alternateSummary?.commentaries);
    const localFinancialStatements = getLocalFinancialStatements(creditSafe);
    const latestLocalFinancial = getLatestLocalFinancialStatement(creditSafe);
    const kpi2Indicator = getKpiIndicator(creditSafe, "KPI_2");
    const kpi3Indicator = getKpiIndicator(creditSafe, "KPI_3");

    const companyName = toDisplayText(
        pickFirstNonEmpty(companySummary?.businessName, alternateSummary?.businessName),
        "-"
    );
    const companyStatusLabel = getCompanyStatusLabel(
        asRecord(companySummary?.companyStatus) ?? asRecord(alternateSummary?.companyStatus)
    );
    const turnover = pickFirstNonEmpty(companySummary?.latestTurnoverFigure, alternateSummary?.latestTurnoverFigure);
    const shareholdersEquity = pickFirstNonEmpty(
        companySummary?.latestShareholdersEquityFigure,
        latestLocalFinancial?.balanceSheet?.shareholdersEquity
    );
    const employeeCount = pickFirstNonEmpty(alternateSummary?.numberOfEmployees, null);
    const scoreValue = toDisplayText(providerValue?.value);
    const scoreMax = toDisplayText(providerValue?.maxValue, "100");
    const riskLabel = toDisplayText(rating?.commonDescription ?? rating?.providerDescription);
    const overallEsgLabel = toDisplayText(esgIndicator?.value?.description, "-");
    const failedSections = asArray(meta?.failedSections);
    const metaError = toDisplayText(meta?.error, "");
    const groupStructure = asRecord(creditSafe?.GroupStructure);
    const subsidiaries = asArray<AnyRecord>(groupStructure?.subsidiaryCompanies);
    const affiliates = asArray<AnyRecord>(groupStructure?.affiliatedCompanies);
    const kpi2CategoryOptions = getKpiCategoryOptions(kpi2Indicator);
    const kpi3CategoryOptions = getKpiCategoryOptions(kpi3Indicator);
    const financialYearGroups = groupFinancialStatementsByYear(localFinancialStatements);
    const financialYearOptions = financialYearGroups.map((group) => ({
        key: group.key,
        label: group.label,
    }));
    const coverageRows = buildRows([
        {
            k: "Societa nello stesso codice attivita",
            v: formatNumberIt(alternateSummary?.numberOfCompaniesInActivityCode),
        },
        {
            k: "Societa cessate nello stesso codice attivita",
            v: formatNumberIt(alternateSummary?.numberOfCancelledCompaniesInActivityCode),
        },
        {
            k: "Codice attivita analizzato",
            v: activity
                ? `${toDisplayText(activity?.code, "-")} - ${toDisplayText(activity?.description, "-")}`
                : "-",
        },
    ]);

    /* eslint-disable react-hooks/rules-of-hooks */
    const [activeTab, setActiveTab] = React.useState<CreditSafeDetailsTab>("anagrafica");
    const [activeAnalysisView, setActiveAnalysisView] = React.useState<CreditSafeAnalysisView>("esg");
    const [activeKpi2Key, setActiveKpi2Key] = React.useState("");
    const [activeKpi3Key, setActiveKpi3Key] = React.useState("");
    const [activeFinancialYear, setActiveFinancialYear] = React.useState("");
    const [activeFinancialReportKey, setActiveFinancialReportKey] = React.useState("");

    React.useEffect(() => {
        setActiveTab("anagrafica");
        setActiveAnalysisView("esg");
        setActiveKpi2Key("");
        setActiveKpi3Key("");
        setActiveFinancialYear("");
        setActiveFinancialReportKey("");
    }, [meta?.connectId, companyName]);
    /* eslint-enable react-hooks/rules-of-hooks */

    const reportRows = buildRows([
        { k: "Ambiente", v: translateValue(meta?.environment) },
        { k: "Fonte", v: translateValue(meta?.source) },
        { k: "Template report", v: toDisplayText(meta?.reportTemplate) },
        { k: "Aggiornato", v: formatDateMaybe(meta?.updatedAt) },
        { k: "Connect ID", v: toDisplayText(meta?.connectId) },
        meta?.skippedReason ? { k: "Motivo skip", v: toDisplayText(meta?.skippedReason) } : null,
    ]);

    const registryRows = buildRows([
        { k: "Ragione sociale", v: companyName },
        { k: "Partita IVA", v: toDisplayText(alternateSummary?.vatRegistrationNumber) },
        { k: "Codice fiscale", v: toDisplayText(alternateSummary?.taxCode) },
        {
            k: "Numero azienda",
            v: toDisplayText(companySummary?.companyNumber ?? alternateSummary?.companyNumber),
        },
        {
            k: "Numero registro imprese",
            v: toDisplayText(
                companySummary?.companyRegistrationNumber ?? alternateSummary?.companyRegistrationNumber
            ),
        },
        { k: "GGS ID", v: toDisplayText(companySummary?.ggsId) },
        { k: "Provincia", v: toDisplayText(alternateSummary?.province) },
        { k: "Paese", v: toDisplayText(alternateSummary?.country ?? companySummary?.country) },
        { k: "Forma giuridica", v: toDisplayText(alternateSummary?.legalForm) },
        { k: "Codice forma giuridica", v: toDisplayText(alternateSummary?.legalFormCode) },
        { k: "Sezione registro", v: toDisplayText(alternateSummary?.publicRegisterSection) },
        { k: "Stato registro", v: translateValue(alternateSummary?.registerStatus) },
        { k: "Tipo sede", v: toDisplayText(alternateSummary?.hqType) },
        {
            k: "Classe impresa",
            v: toDisplayText(
                alternateSummary?.classificationPMIDescription ?? alternateSummary?.classificationPMI
            ),
        },
        { k: "Capitale sociale", v: formatCurrencyIt(alternateSummary?.shareCapital) },
        { k: "Data costituzione", v: formatDateMaybe(alternateSummary?.incorporationDate) },
        { k: "Data iscrizione REA", v: formatDateMaybe(alternateSummary?.reaInscriptionDate) },
        { k: "Ultimo aggiornamento IC", v: formatDateMaybe(alternateSummary?.latestUpdateOnIc) },
    ]);

    const addressRows = buildRows([
        {
            k: "Indirizzo",
            v: toDisplayText(alternateSummary?.address ?? alternateSummary?.contactAddress?.simpleValue),
        },
        { k: "Telefono", v: toDisplayText(alternateSummary?.telephone) },
        { k: "Email/PEC", v: toDisplayText(alternateSummary?.emailAddresses) },
        { k: "Dipendenti", v: formatPeopleCount(employeeCount) },
        {
            k: "Attivita principale",
            v: toDisplayText(alternateSummary?.principalActivity?.description ?? activity?.description),
        },
        {
            k: "Classificazione ATECO",
            v: alternateSummary?.activityClassifications
                ? `${toDisplayText(alternateSummary?.activityClassifications?.code, "-")} - ${toDisplayText(
                    alternateSummary?.activityClassifications?.description,
                    "-"
                )}`
                : "-",
        },
        { k: "RAE", v: toDisplayText(alternateSummary?.raeCode) },
        { k: "SAE", v: toDisplayText(alternateSummary?.saeCode) },
    ]);

    const headerSnapshotRows = buildRows([
        { k: "Aggiornato", v: formatDateMaybe(meta?.updatedAt) },
        {
            k: "Attivita principale",
            v: activity
                ? `${toDisplayText(activity?.code, "-")} - ${toDisplayText(activity?.description, "-")}`
                : "-",
        },
        { k: "Ultimo fatturato", v: formatFigureCurrency(turnover) },
        { k: "Patrimonio netto", v: formatFigureCurrency(shareholdersEquity) },
    ]);

    const headerReportRows = buildRows([
        { k: "Fonte", v: translateValue(meta?.source) },
        { k: "Template", v: toDisplayText(meta?.reportTemplate) },
        { k: "Profilo rischio", v: riskLabel },
        { k: "Connect ID", v: toDisplayText(meta?.connectId) },
    ]);

    const selectedKpi2Option =
        kpi2CategoryOptions.find((option) => option.key === activeKpi2Key) ?? kpi2CategoryOptions[0] ?? null;
    const selectedKpi3Option =
        kpi3CategoryOptions.find((option) => option.key === activeKpi3Key) ?? kpi3CategoryOptions[0] ?? null;
    const selectedFinancialYearKey =
        financialYearGroups.find((group) => group.key === activeFinancialYear)?.key ??
        financialYearGroups[0]?.key ??
        "";
    const selectedFinancialYearGroup =
        financialYearGroups.find((group) => group.key === selectedFinancialYearKey) ?? null;
    const selectedFinancialReport =
        selectedFinancialYearGroup?.reports.find((report) => report.key === activeFinancialReportKey) ??
        selectedFinancialYearGroup?.reports[0] ??
        null;
    const financialReportOptions = buildFinancialReportSelectOptions(
        selectedFinancialYearGroup?.reports ?? []
    );
    const selectedFinancialSections = buildFinancialStatementSections(
        selectedFinancialReport?.statement ?? null
    );

    const selectedFinancialRows = buildRows([
        { k: "Anno attivo", v: selectedFinancialYearGroup?.label ?? "-" },
        { k: "Report disponibili", v: formatNumberIt(selectedFinancialYearGroup?.reports.length) },
        {
            k: "Report aperto",
            v: selectedFinancialReport
                ? `${selectedFinancialReport.reportTypeLabel} (${selectedFinancialReport.formatLabel})`
                : "-",
        },
        { k: "Societa", v: companyName },
    ]);

    return (
        <SectionContainer clickable={false} onActivate={onOpenDetails}>
            <SectionHeader
                title="Credit Safe"
                description="Vista a tab per consultare anagrafica, segnalazioni, analisi e struttura di gruppo"
                showDot={true}
                dotClassName="bg-emerald-500"
            />

            <div className="px-4 pb-4 overflow-y-hidden">
                <div className="sticky top-0 z-10 -mx-4 px-4 pt-4 pb-4 space-y-3 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/95 dark:bg-neutral-950/95 backdrop-blur">
                    {(failedSections.length > 0 || metaError !== "") && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                                Report parziale
                            </p>
                            {failedSections.length > 0 && (
                                <p className="mt-1 text-[11px] text-amber-700/90 dark:text-amber-200/80">
                                    Sezioni non disponibili: {failedSections.join(", ")}
                                </p>
                            )}
                            {metaError !== "" && (
                                <p className="mt-1 text-[11px] text-amber-700/90 dark:text-amber-200/80">
                                    Errore: {metaError}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <SectionPill tone={companyStatusLabel === "Attiva" ? "ok" : "neutral"}>
                            stato: <span className="ml-1 font-semibold">{companyStatusLabel}</span>
                        </SectionPill>
                        <SectionPill>
                            rating: <span className="ml-1 font-semibold">{toDisplayText(rating?.commonValue)}</span>
                        </SectionPill>
                        <SectionPill>
                            score: <span className="ml-1 font-semibold">{`${scoreValue}/${scoreMax}`}</span>
                        </SectionPill>
                        <SectionPill tone="ok">
                            limite: <span className="ml-1 font-semibold">{formatFigureCurrency(creditLimit)}</span>
                        </SectionPill>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <SectionBlock title="colpo d'occhio" contentClassName="space-y-2">
                            {renderKeyValueRows(headerSnapshotRows)}
                        </SectionBlock>
                        <SectionBlock title="riferimenti rapidi" contentClassName="space-y-2">
                            {renderKeyValueRows(headerReportRows)}
                        </SectionBlock>
                    </div>

                    <SelectorBar
                        ariaLabel="Tab dettagli Credit Safe"
                        items={DETAILS_TABS}
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as CreditSafeDetailsTab)}
                    />
                </div>

                <div className="space-y-5 pt-4">
                    {activeTab === "anagrafica" && (
                        <DetailsGroup
                            title="Anagrafica legale e registro"
                            description="Identificativi, registro, sede, contatti e riferimenti essenziali del report"
                        >
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                <SectionBlock title="identificativi e registro" contentClassName="space-y-2">
                                    {renderKeyValueRows(registryRows)}
                                </SectionBlock>
                                <SectionBlock title="sede, contatti e attivita" contentClassName="space-y-2">
                                    {renderKeyValueRows(addressRows)}
                                </SectionBlock>
                                <SectionBlock
                                    title="riferimenti report"
                                    className="xl:col-span-2"
                                    contentClassName="space-y-2"
                                >
                                    {renderKeyValueRows(reportRows)}
                                    <SectionKeyValue
                                        k="Rating internazionale"
                                        v={toDisplayText(rating?.commonValue)}
                                    />
                                    <SectionKeyValue k="Descrizione rating" v={riskLabel} />
                                </SectionBlock>
                            </div>
                        </DetailsGroup>
                    )}

                    {activeTab === "segnalazioni" && (
                        <DetailsGroup
                            title="Segnalazioni e commenti"
                            description="Alert di rischio e osservazioni testuali del report Credit Safe"
                        >
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                <SectionBlock title="segnalazioni" contentClassName="space-y-2">
                                    {flagItems.map((item) => (
                                        <div key={item.key} className="flex items-center justify-between gap-3">
                                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                {item.label}
                                            </span>
                                            <SectionPill tone={item.tone}>
                                                <span className="font-semibold">{item.valueLabel}</span>
                                            </SectionPill>
                                        </div>
                                    ))}
                                </SectionBlock>

                                <SectionBlock title="commenti del report">
                                    <div className="space-y-2">
                                        {commentaries.length ? (
                                            commentaries.map((commentary, index) => {
                                                const tone = getCreditSafeCommentaryTone(
                                                    commentary?.positiveOrNegative
                                                );
                                                return (
                                                    <div
                                                        key={`commentary-${index}`}
                                                        className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-950/30 p-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100">
                                                                Commento {index + 1}
                                                            </p>
                                                            <SectionPill tone={tone}>
                                                                {translateValue(
                                                                    commentary?.positiveOrNegative
                                                                )}
                                                            </SectionPill>
                                                        </div>
                                                        <p className="mt-2 text-[11px] leading-5 text-neutral-700 dark:text-neutral-300">
                                                            {toDisplayText(commentary?.commentaryText)}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                Nessun commento disponibile.
                                            </p>
                                        )}
                                    </div>
                                </SectionBlock>
                            </div>
                        </DetailsGroup>
                    )}

                    {activeTab === "analisi" && (
                        <DetailsGroup
                            title="Analisi e KPI"
                            description="Consulta una sola area alla volta tra ESG, benchmark ATECO e bilancio locale"
                        >
                            <SelectorBar
                                ariaLabel="Tipologia analisi Credit Safe"
                                items={ANALYSIS_VIEW_ITEMS}
                                activeKey={activeAnalysisView}
                                onChange={(key) => setActiveAnalysisView(key as CreditSafeAnalysisView)}
                            />

                            {activeAnalysisView === "esg" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                        <SectionBlock title="overview ESG" contentClassName="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <SectionPill tone="neutral">
                                                    rischio ESG:{" "}
                                                    <span className="ml-1 font-semibold">
                                                        {overallEsgLabel}
                                                    </span>
                                                </SectionPill>
                                                {esgCategories.map((category, index) => (
                                                    <SectionPill key={`esg-${index}`} tone="neutral">
                                                        {toDisplayText(category?.type, "ESG")}:{" "}
                                                        <span className="ml-1 font-semibold">
                                                            {toDisplayText(category?.value?.description)}
                                                        </span>
                                                    </SectionPill>
                                                ))}
                                            </div>
                                            <div className="space-y-2">
                                                {esgCategories.length ? (
                                                    esgCategories.map((category, index) => (
                                                        <SectionKeyValue
                                                            key={`esg-row-${index}`}
                                                            k={toDisplayText(
                                                                category?.description,
                                                                toDisplayText(category?.type)
                                                            )}
                                                            v={`${toDisplayText(
                                                                category?.value?.description
                                                            )} (${toDisplayText(category?.value?.code)})`}
                                                        />
                                                    ))
                                                ) : (
                                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        Indicatori ESG non disponibili.
                                                    </p>
                                                )}
                                            </div>
                                        </SectionBlock>

                                        <SectionBlock title="copertura analisi" contentClassName="space-y-2">
                                            {renderKeyValueRows(coverageRows)}
                                        </SectionBlock>
                                    </div>
                                </div>
                            )}

                            {activeAnalysisView === "kpi2" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                        <SectionBlock title="benchmark ATECO 2 cifre" contentClassName="space-y-2">
                                            <SectionKeyValue
                                                k="Descrizione"
                                                v={toDisplayText(
                                                    kpi2Indicator?.description,
                                                    "KPI per benchmark ATECO a 2 cifre"
                                                )}
                                            />
                                            <SectionKeyValue
                                                k="Periodo attivo"
                                                v={selectedKpi2Option?.label ?? "-"}
                                            />
                                            <SectionKeyValue
                                                k="Dettaglio"
                                                v={selectedKpi2Option?.description ?? "-"}
                                            />
                                        </SectionBlock>
                                        <SectionBlock
                                            title="copertura analisi"
                                            className="xl:col-span-2"
                                            contentClassName="space-y-2"
                                        >
                                            {renderKeyValueRows(coverageRows)}
                                        </SectionBlock>
                                    </div>

                                    {kpi2CategoryOptions.length > 1 && (
                                        <SelectorBar
                                            ariaLabel="Anno KPI ATECO 2 cifre"
                                            items={kpi2CategoryOptions}
                                            activeKey={selectedKpi2Option?.key ?? ""}
                                            onChange={setActiveKpi2Key}
                                        />
                                    )}

                                    {renderKpiCategoryTable(
                                        selectedKpi2Option,
                                        `KPI ATECO 2 cifre${selectedKpi2Option ? ` · ${selectedKpi2Option.label}` : ""}`,
                                        "KPI ATECO 2 cifre non disponibili."
                                    )}
                                </div>
                            )}

                            {activeAnalysisView === "kpi3" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                        <SectionBlock title="benchmark ATECO 3 cifre" contentClassName="space-y-2">
                                            <SectionKeyValue
                                                k="Descrizione"
                                                v={toDisplayText(
                                                    kpi3Indicator?.description,
                                                    "KPI per benchmark ATECO a 3 cifre"
                                                )}
                                            />
                                            <SectionKeyValue
                                                k="Periodo attivo"
                                                v={selectedKpi3Option?.label ?? "-"}
                                            />
                                            <SectionKeyValue
                                                k="Dettaglio"
                                                v={selectedKpi3Option?.description ?? "-"}
                                            />
                                        </SectionBlock>
                                        <SectionBlock
                                            title="copertura analisi"
                                            className="xl:col-span-2"
                                            contentClassName="space-y-2"
                                        >
                                            {renderKeyValueRows(coverageRows)}
                                        </SectionBlock>
                                    </div>

                                    {kpi3CategoryOptions.length > 1 && (
                                        <SelectorBar
                                            ariaLabel="Anno KPI ATECO 3 cifre"
                                            items={kpi3CategoryOptions}
                                            activeKey={selectedKpi3Option?.key ?? ""}
                                            onChange={setActiveKpi3Key}
                                        />
                                    )}

                                    {renderKpiCategoryTable(
                                        selectedKpi3Option,
                                        `KPI ATECO 3 cifre${selectedKpi3Option ? ` · ${selectedKpi3Option.label}` : ""}`,
                                        "KPI ATECO 3 cifre non disponibili."
                                    )}
                                </div>
                            )}

                            {activeAnalysisView === "bilancio" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                        <SectionBlock title="bilancio selezionato" contentClassName="space-y-2">
                                            {renderKeyValueRows(selectedFinancialRows)}
                                        </SectionBlock>
                                        <SectionBlock
                                            title="copertura analisi"
                                            className="xl:col-span-2"
                                            contentClassName="space-y-2"
                                        >
                                            {renderKeyValueRows(coverageRows)}
                                        </SectionBlock>
                                    </div>

                                    {financialYearOptions.length ? (
                                        <>
                                            {financialYearOptions.length > 1 && (
                                                <SelectorBar
                                                    ariaLabel="Anno bilancio locale"
                                                    items={financialYearOptions}
                                                    activeKey={selectedFinancialYearGroup?.key ?? ""}
                                                    onChange={(key) => {
                                                        setActiveFinancialYear(key);
                                                        setActiveFinancialReportKey("");
                                                    }}
                                                />
                                            )}

                                            {selectedFinancialReport ? (
                                                <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 space-y-3">
                                                        <div className=" w-full flex justify-between items-center">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex gap-4 items-center">
                                                                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                                                                        Report disponibile
                                                                    </label>
                                                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                                        Esercizio {selectedFinancialReport.year}
                                                                    </p>
                                                                </div>

                                                                <FDSelect
                                                                    options={financialReportOptions}
                                                                    value={selectedFinancialReport.key}
                                                                    onChange={(value) =>
                                                                        setActiveFinancialReportKey(
                                                                            typeof value === "string" ? value : ""
                                                                        )
                                                                    }
                                                                    placeholder="Seleziona il report"
                                                                    size="sm"
                                                                    radius="md"
                                                                    variant="outline"
                                                                    color="neutral"
                                                                    fullWidth
                                                                />

                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {buildFinancialStatementMetaItems(
                                                                    selectedFinancialReport.statement
                                                                ).map((item) => (
                                                                    <SectionPill
                                                                        key={`${selectedFinancialReport.key}-${item.label}`}
                                                                        tone={
                                                                            item.label === "Formato" &&
                                                                                item.value === "Ordinario"
                                                                                ? "ok"
                                                                                : "neutral"
                                                                        }
                                                                    >
                                                                        {item.label.toLowerCase()}:{" "}
                                                                        <span className="ml-1 font-semibold">
                                                                            {item.value}
                                                                        </span>
                                                                    </SectionPill>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-4 pb-4 pt-3">
                                                        {selectedFinancialSections.length ? (
                                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                                {selectedFinancialSections.map((section) => (
                                                                    <SectionBlock
                                                                        key={`${selectedFinancialReport.key}-${section.key}`}
                                                                        title={section.title}
                                                                        contentClassName="space-y-2"
                                                                    >
                                                                        {renderKeyValueRows(section.rows)}
                                                                    </SectionBlock>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            renderFallbackCard(
                                                                "Dati di bilancio non disponibili per questo report."
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                renderFallbackCard("Report di bilancio non disponibile.")
                                            )}
                                        </>
                                    ) : (
                                        renderFallbackCard("Bilancio locale non disponibile.")
                                    )}
                                </div>
                            )}
                        </DetailsGroup>
                    )}

                    {activeTab === "gruppo" && (
                        <DetailsGroup
                            title="Struttura di gruppo"
                            description="Societa controllate e affiliate collegate alla societa analizzata"
                        >
                            <div className="flex flex-wrap gap-2">
                                <SectionPill>
                                    controllate:{" "}
                                    <span className="ml-1 font-semibold">
                                        {formatNumberIt(subsidiaries.length)}
                                    </span>
                                </SectionPill>
                                <SectionPill>
                                    affiliate:{" "}
                                    <span className="ml-1 font-semibold">
                                        {formatNumberIt(affiliates.length)}
                                    </span>
                                </SectionPill>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <CompactTableCard
                                    title="Societa controllate"
                                    rows={subsidiaries}
                                    columns={[
                                        {
                                            key: "name",
                                            header: "Societa",
                                            className: "min-w-[280px]",
                                            render: (row) => (
                                                <div>
                                                    <p className="font-medium">{toDisplayText(row?.name)}</p>
                                                    <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        {toDisplayText(row?.type)}
                                                    </p>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "country",
                                            header: "Paese",
                                            render: (row) => toDisplayText(row?.country),
                                        },
                                        {
                                            key: "registrationNumber",
                                            header: "Registro",
                                            render: (row) => toDisplayText(row?.registrationNumber),
                                        },
                                        {
                                            key: "safeNumber",
                                            header: "Safe number",
                                            render: (row) => toDisplayText(row?.safeNumber),
                                        },
                                        {
                                            key: "status",
                                            header: "Stato",
                                            render: (row) => translateValue(row?.status),
                                        },
                                    ]}
                                    emptyLabel="Nessuna societa controllata disponibile."
                                />

                                <CompactTableCard
                                    title="Societa affiliate"
                                    rows={affiliates}
                                    columns={[
                                        {
                                            key: "name",
                                            header: "Societa",
                                            className: "min-w-[280px]",
                                            render: (row) => (
                                                <div>
                                                    <p className="font-medium">{toDisplayText(row?.name)}</p>
                                                    <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        {toDisplayText(row?.type)}
                                                    </p>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "country",
                                            header: "Paese",
                                            render: (row) => toDisplayText(row?.country),
                                        },
                                        {
                                            key: "registrationNumber",
                                            header: "Registro",
                                            render: (row) => toDisplayText(row?.registrationNumber),
                                        },
                                        {
                                            key: "safeNumber",
                                            header: "Safe number",
                                            render: (row) => toDisplayText(row?.safeNumber),
                                        },
                                        {
                                            key: "status",
                                            header: "Stato",
                                            render: (row) => translateValue(row?.status),
                                        },
                                    ]}
                                    emptyLabel="Nessuna societa affiliata disponibile."
                                />
                            </div>
                        </DetailsGroup>
                    )}
                </div>
            </div>
        </SectionContainer>
    );
}

export function CreditSafe({ mode, creditSafe, onOpenDetails }: CreditSafeProps) {
    if (!creditSafe) {
        return renderFallbackCard("Dati Credit Safe non disponibili.");
    }

    if (mode === "summary") {
        return <CreditSafeSummaryView creditSafe={creditSafe} onOpenDetails={onOpenDetails} />;
    }

    return <CreditSafeDetailsView creditSafe={creditSafe} onOpenDetails={onOpenDetails} />;
}
