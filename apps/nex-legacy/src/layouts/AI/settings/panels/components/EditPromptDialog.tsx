import { useState } from "react";
//UI
import { FDDialog } from "@nex/fd-ui";
import MarkdownEditor from "components/UI/input/MarkdownEditor";
import { enqueueSnackbar } from "components/MessageBox";
import FDInput from "components/UI/input/FDInput";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface PromptData {
    agent_nome: string;
    prompt_nome: string;
    order_prompt: number;
    prompt_testo: string;
}

interface ConfirmData extends PromptData {
    original_agent_nome?: string;
    original_order_prompt?: number;
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export default function EditPromptDialog({
    open,
    initial,
    defaultAgentNome,
    onClose,
    onConfirm,
    loading,
}: {
    open: boolean;
    initial?: PromptData | null;
    defaultAgentNome?: string;
    onClose: () => void;
    onConfirm: (data: ConfirmData) => void;
    loading?: boolean;
}) {
    const [agentNome, setAgentNome] = useState(initial ? initial.agent_nome : defaultAgentNome || "");
    const [nome, setNome] = useState(initial ? initial.prompt_nome : "");
    const [orderPrompt, setOrderPrompt] = useState(initial ? initial.order_prompt : 0);
    const [testo, setTesto] = useState(initial ? initial.prompt_testo : "");

    // Determina se è un edit o un nuovo prompt
    const isEdit = !!initial;

    const handleConfirm = () => {
        const agentNomeTrim = agentNome?.trim();
        const nomeTrim = nome?.trim();

        if (!agentNomeTrim) {
            enqueueSnackbar("Il nome dell'agente è obbligatorio", { type: "warning" });
            return;
        }
        if (!nomeTrim) {
            enqueueSnackbar("Il nome del prompt è obbligatorio", { type: "warning" });
            return;
        }

        const data: ConfirmData = {
            agent_nome: agentNomeTrim,
            prompt_nome: nomeTrim,
            order_prompt: orderPrompt,
            prompt_testo: testo,
        };

        // Se è un update, includi i valori originali della chiave primaria
        if (initial) {
            data.original_agent_nome = initial.agent_nome;
            data.original_order_prompt = initial.order_prompt;
        }

        onConfirm(data);
    };


    return (
        <FDDialog
            size="lg"
            open={open}
            onClose={onClose}
            title={isEdit ? "Modifica Prompt" : "Nuovo Prompt"}
            confirmText={isEdit ? "Salva" : "Crea"}
            onConfirm={handleConfirm}
            loading={loading}
            color="primary"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <FDInput
                            label="Nome Agente"
                            radius="md"
                            size="sm"
                            value={agentNome}
                            onChange={(e) => setAgentNome(e.target.value)}
                            placeholder="es. Data_Assistant"
                            animatedLabel={false}
                            disabled={!isEdit && !!defaultAgentNome}
                        />
                        {!isEdit && defaultAgentNome && (
                            <p className="text-xs text-gray-400 mt-1">Agente pre-selezionato</p>
                        )}
                    </div>

                    <FDInput
                        type="number"
                        label="Ordine"
                        radius="md"
                        size="sm"
                        value={orderPrompt}
                        onChange={(e) => setOrderPrompt(parseInt(e.target.value, 10) || 0)}
                        placeholder="Ordine del prompt"
                        animatedLabel={false}
                    />
                </div>
                <FDInput
                    value={nome}
                    label="Nome Prompt"
                    radius="md"
                    size="sm"
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome descrittivo del prompt"
                    animatedLabel={false}
                />

                <div className="h-[320px]">
                    <MarkdownEditor value={testo} onChange={setTesto} minHeight={280} maxHeight={280} />
                </div>
            </div>
        </FDDialog>
    );
};