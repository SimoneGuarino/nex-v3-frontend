// layouts/quotazioni/components/BuyerProgressCell.tsx
import React from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiClock, FiActivity } from "react-icons/fi";
import { IQuotationBuyerProgress } from "layouts/quotazioni/types/quotations";

const FiCheckCircleIcon = FiCheckCircle as React.FC<{ size?: number; className?: string }>;
const FiClockIcon = FiClock as React.FC<{ size?: number; className?: string }>;
const FiActivityIcon = FiActivity as React.FC<{ size?: number; className?: string }>;

type BuyerProgressCellProps = {
    progress?: IQuotationBuyerProgress | null;
};

type GlobalProgressCellProps = {
    buyersProgress?: IQuotationBuyerProgress[] | null;
};


export const BuyerProgressCell: React.FC<BuyerProgressCellProps> = React.memo(({ progress }) => {
    if (!progress || !progress.total) {
        return (
            <span className="text-xs text-gray-400 dark:text-gray-600">
                Nessun prodotto
            </span>
        );
    }

    const { total, toDo, waiting, done } = progress;

    let status: "todo" | "waiting" | "done" = "done";
    if (toDo > 0) status = "todo";
    else if (waiting > 0) status = "waiting";

    const labelByStatus: Record<typeof status, string> = {
        todo: `${toDo} da quotare`,
        waiting: `${waiting} in attesa`,
        done: "Tutto completato",
    };

    const iconByStatus: Record<typeof status, React.ReactNode> = {
        todo: <FiActivityIcon className="h-3.5 w-3.5" />,
        waiting: <FiClockIcon className="h-3.5 w-3.5" />,
        done: <FiCheckCircleIcon className="h-3.5 w-3.5" />,
    };

    const chipClassByStatus: Record<typeof status, string> = {
        todo: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        waiting: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
        done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    };

    const barTodo = total ? (toDo / total) * 100 : 0;
    const barWaiting = total ? (waiting / total) * 100 : 0;
    const barDone = total ? (done / total) * 100 : 0;

    return (
        <motion.div
            className="flex flex-col gap-1.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
        >
            {/* chip principale */}
            <div
                className={`
                    inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 
                    text-[11px] font-medium ${chipClassByStatus[status]}
                `}
            >
                <span className="flex items-center justify-center">
                    {iconByStatus[status]}
                </span>
                <span className="truncate">{labelByStatus[status]}</span>
            </div>

            {/* mini progress bar */}
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                {barTodo > 0 && (
                    <motion.div
                        className="h-full bg-amber-400 dark:bg-amber-500"
                        style={{ width: `${barTodo}%` }}
                        layout
                        transition={{ duration: 0.2 }}
                    />
                )}
                {barWaiting > 0 && (
                    <motion.div
                        className="h-full bg-sky-400 dark:bg-sky-500"
                        style={{ width: `${barWaiting}%` }}
                        layout
                        transition={{ duration: 0.2 }}
                    />
                )}
                {barDone > 0 && (
                    <motion.div
                        className="h-full bg-emerald-400 dark:bg-emerald-500"
                        style={{ width: `${barDone}%` }}
                        layout
                        transition={{ duration: 0.2 }}
                    />
                )}
            </div>

            {/* testo secondario compatto */}
            <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                <span>{total} totali</span>
                {done > 0 && <span>{done} completati</span>}
            </div>
        </motion.div>
    );
});

export const GlobalProgressCell: React.FC<GlobalProgressCellProps> = React.memo(
    ({ buyersProgress }) => {
        if (!buyersProgress || buyersProgress.length === 0) {
            return <BuyerProgressCell progress={null} />;
        }

        // aggrego tutti i buyer in un unico "progress"
        let total = 0;
        let pending = 0;
        let completed = 0;
        let rejected = 0;

        for (const bp of buyersProgress) {
            total += bp.total ?? 0;
            pending += (bp as any).pending ?? 0;
            completed += (bp as any).completed ?? 0;
            rejected += (bp as any).rejected ?? 0;
        }

        const hasPending = pending > 0;

        // Creo un oggetto compatibile con IQuotationBuyerProgress
        const globalProgress: IQuotationBuyerProgress = {
            // prendo il primo come base per i campi non usati (es. codice_buyer)
            ...(buyersProgress[0] as any),
            total,
            pending,
            completed,
            rejected,
            hasPending,
        };

        return <BuyerProgressCell progress={globalProgress} />;
    },
);