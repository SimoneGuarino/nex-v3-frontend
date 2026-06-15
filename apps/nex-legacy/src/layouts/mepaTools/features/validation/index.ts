/**
 * Public feature boundary for human-in-the-loop validation controls.
 *
 * These components are presentation-only: they receive validation state and
 * callbacks from controllers/container props, but they never decide persistence
 * semantics themselves. Keeping the barrel explicit helps prevent validation UI
 * from leaking into product, dossier or overview implementation details.
 */
export {
    ActionCard,
    CriticalityCard,
    EvidenceHint,
    ValidationActions,
    ValidationStatusBadge,
    ValidationSummary,
} from "./ValidationControls";
