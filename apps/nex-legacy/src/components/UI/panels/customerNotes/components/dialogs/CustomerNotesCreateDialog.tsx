// src/components/UI/panels/customerNotes/components/dialogs/CustomerNotesCreateDialog.tsx
/**
 * descrizione: Dialog di creazione nuova nota cliente.
 * compito:     raccoglie cliente/tipologia/testo e delega salvataggio al manager.
 */
import React from "react";
import { FDDialog, FDButton, FDSelect, FDTextArea, type FDSelectOption} from "@nex/fd-ui";
import { asDigitString, normalizeText } from "../../utils";

type CustomerNotesCreateDialogProps = {
    open: boolean;
    loading: boolean;
    customerCodeOptions: FDSelectOption<string>[];
    customerCode: string;
    loadingCustomerOptions: boolean;
    noteTypeOptions: FDSelectOption<string>[];
    noteType: string;
    noteText: string;
    loadingNoteTypes: boolean;
    canManageAdministrativeNotes: boolean;
    onClose: () => void;
    onSave: () => void;
    onCustomerCodeChange: (value: string) => void;
    onCustomerSearchChange: (value: string) => void;
    onNoteTypeChange: (value: string) => void;
    onNoteTextChange: (value: string) => void;
};

/** Dialog di creazione nota cliente. */
export const CustomerNotesCreateDialog: React.FC<CustomerNotesCreateDialogProps> = ({
    open,
    loading,
    customerCodeOptions,
    customerCode,
    loadingCustomerOptions,
    noteTypeOptions,
    noteType,
    noteText,
    loadingNoteTypes,
    canManageAdministrativeNotes,
    onClose,
    onSave,
    onCustomerCodeChange,
    onCustomerSearchChange,
    onNoteTypeChange,
    onNoteTextChange,
}) => {
    return (
        <FDDialog
            open={open}
            onClose={onClose}
            title="Nuova nota cliente"
            size="lg"
            disableBackdropClose={loading}
            customActions={
                <div className="flex w-full items-center justify-end gap-2">
                    <FDButton
                        variant="outline"
                        color="neutral"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Annulla
                    </FDButton>
                    <FDButton
                        variant="solid"
                        color="primary"
                        loading={loading}
                        onClick={onSave}
                        /** Salvataggio abilitato solo con cliente valido e testo non vuoto. */
                        disabled={!asDigitString(customerCode) || !normalizeText(noteText)}
                    >
                        Salva nota
                    </FDButton>
                </div>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                        Cliente
                    </label>
                    <FDSelect
                        options={customerCodeOptions}
                        value={customerCode}
                        onChange={(value) =>
                            onCustomerCodeChange(typeof value === "string" ? value : "")
                        }
                        onSearchChange={onCustomerSearchChange}
                        placeholder="Cerca cliente per codice o ragione sociale"
                        size="sm"
                        radius="md"
                        fullWidth
                        searchable
                        loading={loadingCustomerOptions}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-neutral-200">
                        Tipologia nota
                    </label>
                    <FDSelect
                        options={noteTypeOptions}
                        value={noteType}
                        onChange={(value) => onNoteTypeChange(typeof value === "string" ? value : "")}
                        size="sm"
                        radius="md"
                        fullWidth
                        searchable
                        loading={loadingNoteTypes}
                        disabled={loading || loadingNoteTypes}
                    />
                </div>

                <FDTextArea
                    value={noteText}
                    onChange={(event) => onNoteTextChange(event.target.value)}
                    placeholder="Scrivi qui la nota cliente"
                    rows={8}
                    autoResize={false}
                    fullWidth
                    size="sm"
                    radius="md"
                    disabled={loading}
                />
            </div>
        </FDDialog>
    );
};

export default CustomerNotesCreateDialog;
