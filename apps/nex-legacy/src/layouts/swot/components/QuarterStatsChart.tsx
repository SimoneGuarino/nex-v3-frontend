import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { DataOverviewProps } from '..';

const prepareQuarterStats = (
    data: DataOverviewProps,
    tabKey: 'vendita' | 'acquisto'
) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const quarters = ['q1', 'q2', 'q3', 'q4'] as const;

    const getStandardQuarterDates = (qIndex: number): { start: Date; end: Date } => {
        const startMonth = qIndex * 3;
        const start = new Date(currentYear, startMonth, 1);
        const end = new Date(currentYear, startMonth + 3, 0); // ultimo giorno del terzo mese
        return { start, end };
    };

    const statusLabel = (percent: number, stato: string, exist_valore_target: boolean): string => {
        if (stato === 'Futuro') return '🚧 Non Iniziato';
        if (stato === 'In Corso') return '🔵 In Corso';
        if (stato === 'Concluso') {
            if (percent >= 110) return '🏆 Superato';
            if (percent >= 100) return '🟢 Raggiunto';
            if (!exist_valore_target) return 'Obiettivo Non Presente';
            return '🔴 Fallito';
        }
        return '❓ N/A';
    };

    return quarters.map((q, index) => {
        const qData = data.quarters[q];
        const section = qData?.[tabKey];

        const hasCustomDate = !!qData?.data_inizio && !!qData?.data_fine;
        const start = hasCustomDate
            ? new Date(qData?.data_inizio ?? '')
            : getStandardQuarterDates(index).start;

        const end = hasCustomDate
            ? new Date(qData?.data_fine ?? '')
            : getStandardQuarterDates(index).end;

        const stato = now < start ? 'Futuro' : now > end ? 'Concluso' : 'In Corso';

        const percent = section?.valore && section?.valore_target
            ? Math.round((section.valore / section.valore_target) * 100)
            : 0;

        return {
            name: `Q${index + 1}`,
            Valore: section?.valore || 0,
            Target: section?.valore_target || 0,
            Percentuale: percent,
            Stato: stato,
            StatoEsteso: statusLabel(percent, stato, Boolean(section?.valore_target)),
        };
    });
};

// Custom tooltip for the chart
const CustomTooltip = ({
    active,
    payload,
    label,
}: any) => {
    if (active && payload && payload.length > 0) {
        return (
            <div className="rounded-sm bg-white dark:bg-neutral-900 !p-2 shadow-md text-xs text-gray-800 dark:text-gray-100">
                <div className="font-medium mb-1">{label}</div>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="text-[11px]">
                        <span style={{ color: (entry.color as string) ?? '#000' }}>
                            {entry.name}:
                        </span>{' '}
                        €{entry.value}
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

interface Props {
    dataOverview: DataOverviewProps | null;
    tabKey: 'vendita' | 'acquisto';
    loadStatus: Record<string, any>;
}

const QuarterStatsChart: React.FC<Props> = ({ dataOverview, tabKey, loadStatus }) => {
    if(loadStatus.overview) return <div className="h-full lg:w-1/4 sm:w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />;
    if (!dataOverview) return null;
    const data = prepareQuarterStats(dataOverview, tabKey);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 lg:w-1/4 sm:w-full h-full rounded-2xl bg-white dark:bg-neutral-900 !p-4 md:!p-6 shadow-md overflow-hidden"
        >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Statistiche Trimestrali – {tabKey === 'vendita' ? 'Vendite' : 'Acquisti'}
            </h2>

            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="Valore"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        animationDuration={600}
                    />
                    <Line
                        type="monotone"
                        dataKey="Target"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        animationDuration={600}
                    />
                </LineChart>
            </ResponsiveContainer>

            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4"
            >
                {data.map((q) => (
                    <motion.div
                        key={q.name}
                        layout
                        whileHover={{ scale: 1.02 }}
                        className="rounded-lg !p-4 bg-gray-50 dark:bg-neutral-800 transition-all"
                    >
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 !mb-1">{q.name}</div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-100 !mb-2">
                            <span
                                className={`inline-flex items-center !px-2 !py-0.5 rounded-full text-xs font-medium
                                    ${q.StatoEsteso.includes('Superato') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400' :
                                        q.StatoEsteso.includes('Raggiunto') ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' :
                                            q.StatoEsteso.includes('Fallito') ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400' :
                                                q.StatoEsteso.includes('In Corso') ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400' :
                                                    q.StatoEsteso.includes('Non Iniziato') ? 'bg-gray-200 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200' :
                                                        'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-100'
                                    }`}
                            >
                                {q.StatoEsteso}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 !mb-2">Percentuale Raggiunto</div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${q.Percentuale}%` }}
                            />
                        </div>
                        <div className="text-right text-xs font-semibold !mt-1 text-gray-700 dark:text-gray-100">
                            {q.Percentuale}%
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default QuarterStatsChart;
