import { useEffect, useMemo, useRef, useState } from "react";
import PannelloQuotazioni from "./statisticsCards/PannelloQuotazioni";
import MostRequestedProduct from "./statisticsCards/mostRequestedProduct";
import PannelloTopOperator from "./statisticsCards/PannelloTopOperator";
import PannelloTopCustomer from "./statisticsCards/PannelloTopCustomer";

import { getKpiQuotazioni } from "../fetchdata/kpis/quotazioni";
import { getKpiDomanda } from "../fetchdata/kpis/domanda";
import { getKpiTopOperator } from "../fetchdata/kpis/topOperator";
import { getKpiTopCustomer } from "../fetchdata/kpis/topCustomer";

import type { KpiQuotazioniResponse } from "../fetchdata/kpis/quotazioni";
import type { KpiDomandaResponse } from "../fetchdata/kpis/domanda";
import type { KpiTopOperatorResponse } from "../fetchdata/kpis/topOperator";
import type { KpiTopCustomerResponse } from "../fetchdata/kpis/topCustomer";

const getMonthName = (): string => {
    const months = [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre",
    ];
    const currentMonth = new Date().getMonth();
    return months[currentMonth];
};

interface StatsPanelProps {
    userDetails?: any;
}

export function StatsPanel({ userDetails }: StatsPanelProps) {
    const mese = getMonthName();

    const userKey: string | undefined = userDetails?.id ?? userDetails?._id;
    const ruolo: string = String(userDetails?.ruolo ?? "").trim();

    const [isClienteHidden, setIsClienteHidden] = useState<boolean>(false);
    const [showAgent, setShowAgent] = useState<boolean>(false);

    const [showQuotazioniChart, setShowQuotazioniChart] = useState<boolean>(false);
    const [showDomandaChart, setShowDomandaChart] = useState<boolean>(false);
    const [showTopChart, setShowTopChart] = useState<boolean>(false);
    const [showClienteChart, setShowClienteChart] = useState<boolean>(false);

    const [kpiQuotazioni, setKpiQuotazioni] = useState<KpiQuotazioniResponse | null>(null);
    const [kpiDomanda, setKpiDomanda] = useState<KpiDomandaResponse | null>(null);
    const [kpiTopOperator, setKpiTopOperator] = useState<KpiTopOperatorResponse | null>(null);
    const [kpiTopCustomer, setKpiTopCustomer] = useState<KpiTopCustomerResponse | null>(null);

    const [loadingQuotazioni, setLoadingQuotazioni] = useState<boolean>(false);
    const [loadingDomanda, setLoadingDomanda] = useState<boolean>(false);
    const [loadingTopOperator, setLoadingTopOperator] = useState<boolean>(false);
    const [loadingTopCustomer, setLoadingTopCustomer] = useState<boolean>(false);

    const abortQuotazioniRef = useRef<AbortController | null>(null);
    const abortDomandaRef = useRef<AbortController | null>(null);
    const abortTopOperatorRef = useRef<AbortController | null>(null);
    const abortTopCustomerRef = useRef<AbortController | null>(null);

    const closeAllCharts = () => {
        setShowQuotazioniChart(false);
        setShowDomandaChart(false);
        setShowTopChart(false);
        setShowClienteChart(false);
    };

    const toggleClienteVisibility = () => {
        setIsClienteHidden((prev) => {
            const next = !prev;
            if (next) closeAllCharts();
            return next;
        });
    };

    const toggleAgentView = () => setShowAgent((prev) => !prev);

    const monthParam = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
    }, []);

    const resolvedTopOperatorView = useMemo<"agent" | "buyer">(() => {
        if (ruolo === "Buyer") return "agent";
        return showAgent ? "agent" : "buyer";
    }, [ruolo, showAgent]);

    // 1) KPI quotazioni
    useEffect(() => {
        if (!userDetails || !userKey) return;

        try {
            abortQuotazioniRef.current?.abort();
        } catch { }
        const ac = new AbortController();
        abortQuotazioniRef.current = ac;

        setLoadingQuotazioni(true);

        getKpiQuotazioni({
            abortController: ac,
            query: { month: monthParam },
            HandleComplete: (payload) => setKpiQuotazioni(payload),
            HandleError: (msg) => {
                console.error("[StatsPanel] KPI quotazioni:", msg);
                setKpiQuotazioni(null);
            },
            ChangeLoadStatus: ({ bool }) => setLoadingQuotazioni(bool),
        });

        return () => {
            try {
                ac.abort();
            } catch { }
        };
    }, [userKey, monthParam, userDetails]);

    // 2) KPI domanda
    useEffect(() => {
        if (!userDetails || !userKey) return;

        try {
            abortDomandaRef.current?.abort();
        } catch { }
        const ac = new AbortController();
        abortDomandaRef.current = ac;

        setLoadingDomanda(true);

        getKpiDomanda({
            abortController: ac,
            query: { month: monthParam, topN: 10 },
            HandleComplete: (payload) => setKpiDomanda(payload),
            HandleError: (msg) => {
                console.error("[StatsPanel] KPI domanda:", msg);
                setKpiDomanda(null);
            },
            ChangeLoadStatus: ({ bool }) => setLoadingDomanda(bool),
        });

        return () => {
            try {
                ac.abort();
            } catch { }
        };
    }, [userKey, monthParam, userDetails]);

    // 3) KPI top operator
    useEffect(() => {
        if (!userDetails || !userKey) return;

        try {
            abortTopOperatorRef.current?.abort();
        } catch { }
        const ac = new AbortController();
        abortTopOperatorRef.current = ac;

        setLoadingTopOperator(true);

        getKpiTopOperator({
            abortController: ac,
            query: { month: monthParam, view: resolvedTopOperatorView },
            HandleComplete: (payload) => setKpiTopOperator(payload),
            HandleError: (msg) => {
                console.error("[StatsPanel] KPI top operator:", msg);
                setKpiTopOperator(null);
            },
            ChangeLoadStatus: ({ bool }) => setLoadingTopOperator(bool),
        });

        return () => {
            try {
                ac.abort();
            } catch { }
        };
    }, [userKey, monthParam, resolvedTopOperatorView, userDetails]);

    // 4) KPI top customer
    useEffect(() => {
        if (!userDetails || !userKey) return;

        try {
            abortTopCustomerRef.current?.abort();
        } catch { }
        const ac = new AbortController();
        abortTopCustomerRef.current = ac;

        setLoadingTopCustomer(true);

        getKpiTopCustomer({
            abortController: ac,
            query: { days: 31 },
            HandleComplete: (payload) => setKpiTopCustomer(payload),
            HandleError: (msg) => {
                console.error("[StatsPanel] KPI top customer:", msg);
                setKpiTopCustomer(null);
            },
            ChangeLoadStatus: ({ bool }) => setLoadingTopCustomer(bool),
        });

        return () => {
            try {
                ac.abort();
            } catch { }
        };
    }, [userKey, userDetails]);

    return (
        <>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                <PannelloQuotazioni
                    mese={mese}
                    isClienteHidden={isClienteHidden}
                    showChart={showQuotazioniChart}
                    onShowChart={() => setShowQuotazioniChart(true)}
                    onHideChart={() => setShowQuotazioniChart(false)}
                    kpi={kpiQuotazioni?.kpi}
                    loading={loadingQuotazioni}
                />

                <MostRequestedProduct
                    mese={mese}
                    isClienteHidden={isClienteHidden}
                    showChart={showDomandaChart}
                    onShowChart={() => setShowDomandaChart(true)}
                    onHideChart={() => setShowDomandaChart(false)}
                    kpi={kpiDomanda?.kpi}
                    loading={loadingDomanda}
                />

                <PannelloTopOperator
                    mese={mese}
                    isClienteHidden={isClienteHidden}
                    userDetails={userDetails}
                    showAgent={showAgent}
                    onToggleAgent={toggleAgentView}
                    showChart={showTopChart}
                    onShowChart={() => setShowTopChart(true)}
                    onHideChart={() => setShowTopChart(false)}
                    kpi={kpiTopOperator?.kpi}
                    loading={loadingTopOperator}
                />

                <PannelloTopCustomer
                    mese={mese}
                    isClienteHidden={isClienteHidden}
                    onToggleClienteVisibility={toggleClienteVisibility}
                    showChart={showClienteChart}
                    onShowChart={() => setShowClienteChart(true)}
                    onHideChart={() => setShowClienteChart(false)}
                    kpi={kpiTopCustomer?.kpi}
                    loading={loadingTopCustomer}
                />
            </div>
        </>
    );
}

export default StatsPanel;