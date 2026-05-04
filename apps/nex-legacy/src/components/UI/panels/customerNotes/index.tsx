// src/components/UI/panels/customerNotes/index.tsx
/**
 * descrizione: Barrel del modulo note cliente.
 * espone:      pannello standalone, manager, view integrata, hook e tipi condivisi.
 */
import CustomerNotesPanel from "./CustomerNotesPanel";

/** Export di default per integrazione rapida del pannello note. */
export default CustomerNotesPanel;

/** Export nominati per integrazioni avanzate/composizione. */
export { CustomerNotesPanel } from "./CustomerNotesPanel";
export { CustomerNotesManager } from "./CustomerNotesManager";
export {
    CustomerNotesManagerView,
    buildCustomerNotesQueryBody,
} from "./CustomerNotesManagerView";
export { useCustomerNotesManager } from "./hooks/useCustomerNotesManager";
export * from "./types";
