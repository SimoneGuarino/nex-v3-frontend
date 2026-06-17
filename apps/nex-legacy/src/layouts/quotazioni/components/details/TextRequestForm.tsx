import { useState } from "react";
import { motion } from "framer-motion";
import { FiEdit3, FiPlus, FiTrash2 } from "react-icons/fi";
import { FDSelect, FDButton } from "@nex/fd-ui";
import { WiStars } from "react-icons/wi";
import { useUserContext } from "context/UserContext";
import { useTour } from "tour/TourProvider";

const FiEdit3Icon = FiEdit3 as React.FC<{ size?: number; className?: string }>;
const FiPlusIcon = FiPlus as React.FC<{ size?: number; className?: string }>;
const FiTrash2Icon = FiTrash2 as React.FC<{ size?: number; className?: string }>;
const WiStarsIcon = WiStars as React.FC<{ size?: number; className?: string }>;

type NecessitaBlock = {
    id: string;
    descrizione: string;
    note: string;
    codice_buyer: string;
};

type Props = {
    initialDescription?: string;
    initialNote?: string;
    initialBuyerCode?: string | null;
    buyersOptions: { value: string; label: string }[];
    onSubmit: (payload: { descrizione: string; note?: string; codice_buyer: string }) => Promise<void> | void;
    onOpenQuotation: () => Promise<void> | void;
};

export const TextRequestForm: React.FC<Props> = ({
    initialDescription = "",
    initialNote = "",
    initialBuyerCode,
    buyersOptions,
    onSubmit,
    onOpenQuotation,
}) => {
    // Ogni blocco UI genera una riga TEXT_REQUEST separata nel carrello quotazione.
    // La scelta mantiene buyer singolo per riga e consente buyer diversi tra richieste.
    const [blocks, setBlocks] = useState<NecessitaBlock[]>([
        {
            id: `${Date.now()}`,
            descrizione: initialDescription,
            note: initialNote,
            codice_buyer: initialBuyerCode ?? "",
        },
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState<string>("");

    // Regole minime di invio:
    // - almeno un blocco presente
    // - descrizione e buyer obbligatori per ogni blocco
    // - blocco invio durante submit in corso
    const canSubmit =
        blocks.length > 0
        && blocks.every((b) => b.descrizione.trim().length > 0 && b.codice_buyer.trim().length > 0)
        && !submitting;

    const updateBlock = (id: string, patch: Partial<NecessitaBlock>) => {
        setFormMessage("");
        setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    };

    const addBlock = () => {
        setFormMessage("");
        setBlocks((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${prev.length}`,
                descrizione: "",
                note: "",
                codice_buyer: "",
            },
        ]);
    };

    const removeBlock = (id: string) => {
        setFormMessage("");
        setBlocks((prev) => {
            if (prev.length === 1) return prev;
            return prev.filter((b) => b.id !== id);
        });
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setFormMessage("");

        try {
            // Salviamo tutte le necessità e apriamo la quotazione una sola volta.
            // In questo modo ogni buyer vedrà solo le righe assegnate al proprio codice_buyer.
            // Salviamo una riga per ogni blocco e apriamo la quotazione solo alla fine.
            // In questo modo evitiamo aperture multiple e ogni buyer riceve solo le
            // richieste dove il suo codice e' valorizzato in `codice_buyer`.
            for (const block of blocks) {
                await onSubmit({
                    descrizione: block.descrizione.trim(),
                    note: block.note.trim() || undefined,
                    codice_buyer: block.codice_buyer.trim(),
                });
            }

            await onOpenQuotation();
            setFormMessage("Necessità salvate e quotazione aperta correttamente.");
        } finally {
            setSubmitting(false);
        }
    };

    const { isOpen, index: tourIndex } = useTour();
    const [userContext] = useUserContext() as any;
    const lockInteractions = isOpen && tourIndex >= 37 && tourIndex <= 40;

    return (
        <motion.div
            className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm
                 dark:border-neutral-800 dark:bg-neutral-900/70"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-2">
                <FiEdit3Icon className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Descrivi la necessità
                </h3>
            </div>

            {blocks.map((block, idx) => (
                <div key={block.id} className="rounded-xl border border-gray-200/80 p-3 dark:border-neutral-700" data-tour="quotazioni-necessita-panel">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Necessità {idx + 1}
                        </p>
                        <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            disabled={blocks.length === 1 || submitting}
                            className="inline-flex items-center gap-1 text-xs text-red-500 disabled:opacity-40"
                        >
                            <FiTrash2Icon className="h-4 w-4" />
                            Elimina
                        </button>
                    </div>

                    <textarea
                        className="min-h-[120px] w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm
                       text-gray-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                       dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100"
                        placeholder="Es. 10 notebook 15'', 16GB RAM, uso ufficio, budget massimo 700€ cad..."
                        value={block.descrizione}
                        onChange={(e) => updateBlock(block.id, { descrizione: e.target.value })}
                        maxLength={3000}
                    />

                    <textarea
                        className="mt-2 min-h-[60px] w-full resize-y rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs
                       text-gray-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400
                       dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-300"
                        placeholder="Note aggiuntive (opzionale)"
                        value={block.note}
                        onChange={(e) => updateBlock(block.id, { note: e.target.value })}
                        maxLength={1000}
                    />

                    {/* Buyer singolo per blocco: è la chiave per instradare ogni necessità al buyer corretto. */}
                    {/* Il buyer è obbligatorio: questa informazione decide chi vedrà e gestirà la riga lato buyer. */}
                    <div className="mt-2">
                        <FDSelect
                            dataTour="quotazioni-necessita-ass"
                            size="xs"
                            placeholder="Seleziona buyer…"
                            options={buyersOptions}
                            value={block.codice_buyer}
                            onChange={(value) => updateBlock(block.id, { codice_buyer: String(value ?? "") })}
                            virtualized={false}
                            disabled={lockInteractions}
                            className="min-w-60"
                        />
                    </div>
                </div>
            ))}

            {formMessage && <p className="text-xs font-semibold text-green-600">{formMessage}</p>}

            <div className="flex justify-between">
                {/* Pulsante "Aggiungi altra necessità". */}
                {/* Aggiunge un nuovo blocco vuoto lasciando invariati i blocchi già compilati. */}
                <FDButton
                    data-tour="quotazioni-necessita-add"
                    variant="outline"
                    color="primary"
                    onClick={addBlock}
                    disabled={submitting || lockInteractions}
                    icon={<FiPlusIcon className="h-4 w-4" />}
                    className="w-fit"

                >  Aggiungi altra necessità
                </FDButton>

                <FDButton
                    data-tour="quotazioni-necessita-quot"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    icon={<WiStarsIcon size={20} />}
                    className="w-fit"

                >  Apri Quotazione
                </FDButton>
            </div>

        </motion.div>
    );
};
