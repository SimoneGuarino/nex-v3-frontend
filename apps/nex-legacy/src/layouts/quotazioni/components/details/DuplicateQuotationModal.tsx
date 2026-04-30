import { AnimatePresence, motion } from "framer-motion";
import FDBox from "components/UI/box/FDBox";
import { FDButton } from "components/UI/buttons/FDButton";
import { FiAlertTriangle, FiExternalLink } from "react-icons/fi";

const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ size?: number; className?: string }>;
const FiExternalLinkIcon = FiExternalLink as React.FC<{ size?: number; className?: string }>;

type DuplicateCandidate = {
    _id: string;
    codice?: string;
    cig?: string;
    cup?: string;
    stato?: string;
    created_at?: string;
};

export function DuplicateQuotationModal(props: {
    open: boolean;
    onClose: () => void;
    candidates: DuplicateCandidate[];
    onOpenExisting: (id: string) => void;
    onContinue: () => void;
}) {
    const { open, onClose, candidates, onOpenExisting, onContinue } = props;

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className="relative w-full md:max-w-2xl"
                        initial={{ y: 18, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 18, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                    >
                        <FDBox
                            variant="gradient"
                            color="light"
                            border
                            radius="2xl"
                            shadow="2xl"
                            pad="none"
                            className="overflow-hidden border border-black/5 dark:border-white/10 bg-white/85 dark:bg-neutral-900/85"
                        >
                            <div className="px-5 py-4 border-b border-white/10 dark:border-neutral-800/80">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
                                    <FiAlertTriangleIcon />
                                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                        Possibile duplicato quotazione
                                    </div>
                                </div>
                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                    Esiste già una quotazione con <b>stesso cliente</b> e <b>stessa merce</b>, ma con CIG/CUP diversi.
                                    Puoi aprire quella quotazione oppure continuare comunque con questa.
                                </p>
                            </div>

                            <div className="px-5 py-4 max-h-[55vh] overflow-auto">
                                <div className="space-y-2">
                                    {candidates.map(c => (
                                        <div
                                            key={c._id}
                                            className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/50 p-4 flex items-start justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                                                    {c.codice ? `Quotazione ${c.codice}` : `Quotazione ${c._id}`}
                                                </div>
                                                <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                                                    CIG: <b>{c.cig || "—"}</b> • CUP: <b>{c.cup || "—"}</b> • Stato: <b>{c.stato || "—"}</b>
                                                </div>
                                                {c.created_at && (
                                                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                                        Creata: {new Date(c.created_at).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>

                                            <FDButton
                                                onClick={() => onOpenExisting(c._id)}
                                                className="rounded-xl shrink-0"
                                            >
                                                <FiExternalLinkIcon className="mr-2" />
                                                Apri
                                            </FDButton>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="px-5 py-4 border-t border-white/10 dark:border-neutral-800/80 flex items-center justify-end gap-2">
                                <FDButton onClick={onClose} variant="ghost" className="rounded-xl">
                                    Annulla
                                </FDButton>
                                <FDButton onClick={onContinue} color="primary" className="rounded-xl">
                                    Continua comunque
                                </FDButton>
                            </div>
                        </FDBox>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};