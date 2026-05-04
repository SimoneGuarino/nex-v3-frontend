import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import FDBox from "components/UI/box/FDBox";
import { FiExternalLink } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";

const FiExternalLinkIcon = FiExternalLink as React.FC<{ size?: number; className?: string }>;
const HiOutlineDocumentTextIcon = HiOutlineDocumentText as React.FC<{ size?: number; className?: string }>;

type QuoteProgressCardProps = {
    value: number;                 // 0..100, già calcolato da getProgressPercentage
    title?: string;                // default: "Progresso quotazione"
    note?: string;                 // default: descrizione algoritmo
    linkText?: string;             // default: "Vedi l'anteprima del documento"
    onLinkClick?: () => void;      // azione su link (opzionale)
    className?: string;
};

export default function QuoteProgressCard({
    value,
    title = "Progresso quotazione",
    note = "Calcolato in base allo stato di quotazione di tutti i prodotti (attesa, approvazione, completata).",
    linkText = "Vedi l'anteprima del documento",
    onLinkClick,
    className,
}: QuoteProgressCardProps) {
    const clamped = Math.min(100, Math.max(0, value));

    // Etichetta e colori SOLO a scopo visivo, basati sulla percentuale aggregata
    let gaugeLabel = "In attesa";
    let gaugeStrokeClass = "stroke-amber-500";

    if (clamped > 0 && clamped < 100) {
        gaugeLabel = "In corso";
        gaugeStrokeClass = "stroke-sky-500";
    }

    if (clamped >= 100) {
        gaugeLabel = "Completata";
        gaugeStrokeClass = "stroke-emerald-500";
    }

    const showLink = typeof onLinkClick === "function";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
            <FDBox
                variant="soft"
                color="light"
                radius="md"
                shadow="sm"
                pad="lg"
                className={[
                    "bg-white/90 dark:bg-neutral-900/80",
                    "border border-black/5 dark:border-white/10",
                    "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
                    "transition-colors duration-200 hover:border-black/10 dark:hover:border-white/20 hover:shadow-md",
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="flex items-center gap-2">
                    <HiOutlineDocumentTextIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-300" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        {title}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                    {/* Colonna sinistra: titolo, nota, chip stato, link opzionale */}
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-snug">
                            {note}
                        </p>

                        {showLink && (
                            <motion.button
                                type="button"
                                onClick={onLinkClick}
                                className="mt-1 inline-flex items-center gap-1 text-[13px] text-sky-700 hover:underline dark:text-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded-md px-0.5"
                                aria-label={linkText}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                            >
                                {linkText}
                                <FiExternalLinkIcon className="inline-block text-[14px]" aria-hidden />
                            </motion.button>
                        )}
                    </div>
                    {/* Colonna destra: gauge circolare animata */}
                    <div className="flex-shrink-0">
                        <CircularProgress
                            value={clamped}
                            size={96}
                            stroke={9}
                            label={gaugeLabel}
                            colorClass={gaugeStrokeClass}
                        />
                    </div>
                </div>

            </FDBox>
        </motion.div>
    );
}

/** SVG circular progress animato con framer-motion; totalmente stateless rispetto alla logica dei prodotti */
function CircularProgress({
    value,
    size = 96,
    stroke = 9,
    label = "In corso",
    colorClass,
}: {
    value: number;
    size?: number;
    stroke?: number;
    label?: string;
    colorClass?: string;
}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const progress = Math.max(0, Math.min(100, value)) / 100;

    // animazione numerica fluida
    const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.4 });
    const percentText = useTransform(spring, (v) => `${Math.round(v)}%`);
    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    const filled = c * (1 - progress);

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
            role="img"
            aria-label={`${value}% ${label}`}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="block"
                aria-hidden
            >
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(2,6,23,0.06)" // neutral-900/5 in light
                    className="dark:stroke-white/10"
                    strokeWidth={stroke}
                />

                {/* Progress */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeLinecap="round"
                    strokeWidth={stroke}
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: filled }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className={colorClass ?? "stroke-sky-500"}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                />
            </svg>

            {/* Percentuale + label */}
            <div className="absolute inset-0 grid place-items-center">
                <div className="leading-none text-center">
                    <motion.div className="text-[18px] font-semibold text-neutral-900 dark:text-neutral-100">
                        {percentText}
                    </motion.div>
                    <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}