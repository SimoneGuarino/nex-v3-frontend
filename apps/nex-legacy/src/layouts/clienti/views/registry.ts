import { ViewDefinition } from "../types/view";
import { FidoView, FidoFilters } from "./FidoView";
import { AnagraficaView } from "./AnagraficaView";
import { BackordersView } from "./BackordersView";
import { ReportCambioAgenteView } from "./ReportCambioAgente";
import { ReportDiffEconomicaView } from "./ReportDifficoltaEconomica";
import { ReportAltriProblemiView } from "./ReportAltriProblemi";
import { CustomerNotesManagerView } from "components/UI/panels/customerNotes/CustomerNotesManagerView";

export const viewsRegistry: ViewDefinition<any>[] = [
    { id: "anagrafica", label: "Anagrafica", Component: AnagraficaView },
    { id: "fido", label: "Fido", Component: FidoView, FiltersExtra: FidoFilters as ViewDefinition<any>["FiltersExtra"] },
    { id: "backorders", label: "Back orders", Component: BackordersView },
    { id: "reportCambioAgente", label: "Clienti con richiesta cambio agente", Component: ReportCambioAgenteView },
    { id: "reportDiffEconomica", label: "Clienti con difficoltà economica", Component: ReportDiffEconomicaView },
    { id: "reportAltriProblemi", label: "Clienti con altri problemi", Component: ReportAltriProblemiView },
    { id: "reportNoteClienti", label: "Note clienti", Component: CustomerNotesManagerView },
];
