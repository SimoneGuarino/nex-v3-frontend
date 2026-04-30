import { RubricaView } from "./RubricaView";
import { PaymentMethodsView } from "./PaymentMethodsView";
import { MicrosettoriView } from "./MicrosettoriView";
import { CondGaranziaView } from "./CondGaranziaView";
import type { RubricaTabKey } from "../components/TopBar";

export interface ViewDefinition {
    id: RubricaTabKey;
    label: string;
    Component: React.FC<any>;
}

export const viewsRegistry: ViewDefinition[] = [
    { id: "rubrica", label: "Rubrica", Component: RubricaView },
    { id: "paymentMethods", label: "Metodi di Pagamento", Component: PaymentMethodsView },
    { id: "microsettori", label: "Microsettori", Component: MicrosettoriView },
    { id: "garanzia", label: "Condizioni di Garanzia", Component: CondGaranziaView },
];
