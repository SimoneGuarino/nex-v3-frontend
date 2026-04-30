import { UserContext } from "context/UserContext";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useContext, useEffect, useRef } from "react";

const Gestionesell: React.FC<{}> = () => {
    const [userContext] = useContext<any>(UserContext);
    const abortController = useRef<AbortController | null>(null);

    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    useEffect(() => {
        if (userContext && userContext.details === undefined) return;

        const url = import.meta.env.VITE_API_MARIA_MACHINE + "Vari/Gestione_Sellout/gestione_dati_sellout.php";

        // Crea il form in maniera dinamica
        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;

        // IMPORTANTE: indica come target il "nome" dell'iframe
        form.target = "gestionesell";

        // Input hidden per 'ruolo'
        const inputRuolo = document.createElement("input"); 
        inputRuolo.type = "hidden";
        inputRuolo.name = "ruolo";
        inputRuolo.value = userContext.details.ruolo;
        form.appendChild(inputRuolo);

        // Input hidden per 'utente'
        const inputUtente = document.createElement("input");
        inputUtente.type = "hidden";
        inputUtente.name = "utente";
        inputUtente.value = userContext.details.username;
        form.appendChild(inputUtente);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        return () => {
            cancelRequest();
        };
    }, [userContext.details]);

    return (
        <DashboardLayout>
            {/* Iframe con name="Visualizzafilesell" */}
            <iframe
                name="gestionesell"
                style={{ width: "100%", height: '100%', border: "none" }}
            />
        </DashboardLayout>
    );
};

export default Gestionesell;