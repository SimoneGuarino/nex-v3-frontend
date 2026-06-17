import { useEffect, useMemo, useState } from "react";
//UI
import { FDDialog, FDSelect, type FDSelectOption, MarkdownEditor } from "@nex/fd-ui";
import { enqueueSnackbar } from "components/MessageBox";
import { BsgItem } from "../types/types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
const BSG_TIPOLOGIE: FDSelectOption<string>[] = [
    { value: "Parte Generale", label: "Parte Generale" },
    { value: "Promo Sell-In", label: "Promo Sell-In" },
    { value: "Promo Sell-Out", label: "Promo Sell-Out" },
];

interface BsgEditDialogProps {
    open: boolean;
    /** Se passato, e modalita edit; altrimenti modalita creazione */
    initial?: BsgItem | null;
    supplierCodeOptions?: FDSelectOption<string>[];
    supplierCodeLoading?: boolean;
    onClose: () => void;
    onConfirm: (data: BsgItem) => void;
    loading?: boolean;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export default function BsgEditDialog({
    open,
    initial,
    supplierCodeOptions = [],
    supplierCodeLoading = false,
    onClose,
    onConfirm,
    loading,
}: BsgEditDialogProps) {
    const [codiceFornitore, setCodiceFornitore] = useState(""); // Codice fornitore inserito / selezionato (uppercase on selection)
    const [tipologia, setTipologia] = useState<string | undefined>();// Tipologia selezionata (una delle BSG_TIPOLOGIE)
    const [testo, setTesto] = useState(""); // Testo markdown del BSG
    const isEdit = !!initial;

    // Supplier codice options - include current value when editing
    const codiceOptions = useMemo(() => {
        const current = initial?.codice_fornitore?.trim();
        if (!current) return supplierCodeOptions;

        const exists = supplierCodeOptions.some((opt) => opt.value === current);
        if (exists) return supplierCodeOptions;

        return [{ value: current, label: current }, ...supplierCodeOptions];
    }, [initial?.codice_fornitore, supplierCodeOptions]);

    useEffect(() => {
        if (initial) {
            setCodiceFornitore(initial.codice_fornitore);
            setTipologia(initial.bsg_tipologia_testo);
            setTesto(initial.bsg_testo);
        } else {
            setCodiceFornitore("");
            setTipologia(undefined);
            setTesto("");
        }
    }, [initial, open]);

    /**
     * handler di conferma pre salvataggio
     * @returns 
     */
    const handleConfirm = () => {
        const codiceTrim = codiceFornitore.trim();

        if (!codiceTrim) {
            enqueueSnackbar("Il codice fornitore e obbligatorio", { type: "warning" });
            return;
        }
        if (!tipologia) {
            enqueueSnackbar("La tipologia e obbligatoria", { type: "warning" });
            return;
        }
        if (!testo.trim()) {
            enqueueSnackbar("Il testo BSG e obbligatorio", { type: "warning" });
            return;
        }

        onConfirm({
            codice_fornitore: codiceTrim,
            bsg_tipologia_testo: tipologia,
            bsg_testo: testo,
        });
    };


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <FDDialog
            size="lg"
            open={open}
            onClose={onClose}
            title={isEdit ? "Modifica BSG" : "Nuovo BSG"}
            confirmText={isEdit ? "Salva" : "Crea"}
            onConfirm={handleConfirm}
            loading={loading}
            color="primary"
            disableBackdropClose
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1">
                            Codice Fornitore <span className="text-red-500">*</span>
                        </label>
                        <FDSelect
                            options={codiceOptions}
                            value={codiceFornitore}
                            onChange={(v) => setCodiceFornitore(typeof v === "string" ? v.toUpperCase() : "")}
                            size="sm"
                            radius="md"
                            fullWidth
                            searchable
                            clearable={!isEdit}
                            color="dark"
                            placeholder={supplierCodeLoading ? "Caricamento codici..." : "Seleziona codice fornitore"}
                            disabled={isEdit || supplierCodeLoading}
                        />
                        {isEdit && (
                            <p className="text-xs text-gray-400 mt-1">Non modificabile in modifica</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm mb-1">
                            Tipologia <span className="text-red-500">*</span>
                        </label>
                        <FDSelect
                            options={BSG_TIPOLOGIE}
                            value={tipologia}
                            onChange={(v) => setTipologia(typeof v === "string" ? v : undefined)}
                            size="sm"
                            radius="md"
                            fullWidth
                            disabled={isEdit}
                            placeholder="Seleziona tipologia"
                        />
                        {isEdit && (
                            <p className="text-xs text-gray-400 mt-1">Non modificabile in modifica</p>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm mb-1">
                        Testo BSG (Markdown) <span className="text-red-500">*</span>
                    </label>
                    <div className="h-[320px]">
                        <MarkdownEditor value={testo} onChange={setTesto} minHeight={280} maxHeight={280} />
                    </div>
                </div>
            </div>
        </FDDialog>
    );
}
