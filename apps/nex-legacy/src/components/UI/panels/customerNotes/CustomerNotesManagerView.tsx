/**
 * descrizione: Adapter tra framework "view clienti" e CustomerNotesManager.
 * compito:     traduce i filtri globali in `queryBody` consumabile dal modulo note.
 */
import React from "react";
import { CustomerNotesManager } from "./CustomerNotesManager";
import type { SearchParams, ViewComponentProps } from "layouts/clienti/types/view";

/**
 * Trasforma i filtri comuni della sezione clienti nel body richiesto dal report note.
 * Nota: mantiene il contratto storico di `note-clienti/list` per compatibilita backend.
 */
export const buildCustomerNotesQueryBody = (
    params: SearchParams<any>
): Record<string, any> => {
    const c = params.common;
    const body: Record<string, any> = {
        cmp: c.companySelected,
        piva: c.piva,
        ragsoc: c.ragSoc,
        statoCliente: c.statoCliente,
        statoCommerciale: c.statoCommerciale,
        microSettore: c.microSettore,
        macroSettore: c.macroSettore,
        canaleVendita: c.canaleVendita,
        areaGeografica: c.areaGeografica,
        categoriaSconto: c.categoriaSconto,
        brand: c.brand,
        partnership: c.partnership,
        linee: c.linee,
        gruppi: c.gruppi,
        province: c.province,
        microSettoreAgg: c.microSettoreAgg,
        clientelaRif: c.clientelaRif,
    };

    if (c.agentCode) body.ccom = c.agentCode;

    if (c.customerSelected?.codice) {
        body.ccli = c.customerSelected.codice;
    }

    if (c.clientFilterCodes?.length) {
        body.cst = 1;
        body.ccli = c.clientFilterCodes.map((customer) => ({
            codice: customer.codiceCliente,
        }));
    }

    return body;
};

/**
 * View "Note clienti" integrata nel modulo customerNotes.
 * Responsabilita: costruire il body e delegare tutta la logica operativa al manager.
 */
export const CustomerNotesManagerView: React.FC<ViewComponentProps> = ({
    userContext,
    params,
    ChangeLoadStatus,
}) => {
    const body = React.useMemo(() => buildCustomerNotesQueryBody(params), [params]);

    return (
        <CustomerNotesManager
            userContext={userContext}
            queryBody={body}
            changeLoadStatus={ChangeLoadStatus}
            className="h-full"
        />
    );
};

export default CustomerNotesManagerView;
