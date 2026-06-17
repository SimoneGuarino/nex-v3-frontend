import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
//UI
import { FDIconButton, FDButton, ContextMenu } from "@nex/fd-ui";
//context
import { useUserContext } from "context/UserContext";
//icons
import { IoAddOutline, IoRefreshOutline, IoChevronForwardOutline, IoChevronDownOutline, IoEllipsisVertical } from "react-icons/io5";
import { TbPrompt } from "react-icons/tb";
import { Markdown } from "layouts/AI/chat/module/markdown";
import { MdOutlineModeEdit, MdDeleteOutline } from "react-icons/md";

//fetchdatas
import { getPrompts, deletePrompt, upsertPrompt, Prompt } from "../fetchData/prompts";
import { getAgents, IAgent, formatAgentForSelect, parseAgentSelectValue } from "../../fetchData/Agents";
//componenti
import { enqueueSnackbar } from "components/MessageBox";
import DeletePromptDialog from "./components/DeletePromptDialog";
import EditPromptDialog from "./components/EditPromptDialog";
//utils
import { emitSelectedModelChange, onSelectedModelChange, requestSelectedModel } from "../../utils/modelEvents";
import MinLoader from "minLoader";

//wrap icone
const AddIcon = IoAddOutline as React.FC<{ size?: number }>;
const RefreshIcon = IoRefreshOutline as React.FC<{ size?: number, className?: string }>;
const ChevronRightIcon = IoChevronForwardOutline as React.FC<{ size?: number }>;
const ChevronDownIcon = IoChevronDownOutline as React.FC<{ size?: number }>;
const PromptIcon = TbPrompt as React.FC<{ size?: number }>;

const DeleteIcon = MdDeleteOutline as React.FC<{ size?: number, className?: string }>;
const EditIcon = MdOutlineModeEdit as React.FC<{ size?: number, className?: string }>;
const Settings = IoEllipsisVertical as React.FC<{ size?: number }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface PromptItemProps {
    prompt: Prompt;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: (prompt: Prompt) => void;
    onDelete: (prompt: Prompt) => void;
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
// Helper per generare la chiave composita
const getPromptKey = (p: Prompt) => `${p.agent_nome}|${p.order_prompt}`;


// ——————————————————————————————————————————————————————————
// SUB COMPONENT
// ——————————————————————————————————————————————————————————
const PromptItem: React.FC<PromptItemProps> = ({ prompt, isExpanded, onToggle, onEdit, onDelete }) => {
    const [openOption, setOpenOption] = useState(false);
    const optionBtnRef = useRef<HTMLDivElement | null>(null);

    const menuButtons = [
        {
            title: 'Modifica',
            icon: <EditIcon size={16} />,
            onClick: () => { setOpenOption(false); onEdit(prompt); }
        },
        {
            title: 'Elimina',
            icon: <DeleteIcon size={16} />,

            onClick: () => { setOpenOption(false); onDelete(prompt); },
            className: 'text-red-400'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-100 dark:bg-neutral-700/50 rounded-lg overflow-hidden w-full min-w-0"
        >
            {/* Header del prompt - cliccabile per espandere */}
            <div
                onClick={onToggle}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-600/50 transition-colors min-w-0"
            >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <PromptIcon size={18} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium truncate">{prompt.prompt_nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        Ordine: {prompt.order_prompt}
                    </p>
                </div>
                <div className="flex-shrink-0 opacity-30">
                    {isExpanded ? <ChevronDownIcon size={18} /> : <ChevronRightIcon size={18} />}
                </div>
                <div className="flex items-center" ref={optionBtnRef}>
                    <FDIconButton
                        icon={<Settings size={15} />}
                        size="small"
                        rounded="md"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenOption(true); }}
                    />
                </div>
            </div>

            {/* Contenuto espandibile */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="border-t border-gray-200 dark:border-neutral-600 overflow-hidden min-w-0"
                    >
                        <div className="p-4 min-w-0 w-full">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                                Testo del prompt
                            </p>
                            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 max-h-60 overflow-auto min-w-0 w-full">
                                {/* render markdown if plain text, otherwise render HTML */}
                                <div className="text-sm min-w-0 w-full">
                                    <Markdown text={prompt.prompt_testo || ""} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ContextMenu
                openFor={openOption}
                onClose={() => setOpenOption(false)}
                pos={optionBtnRef}
                placement="bottom"
                menuButtons={menuButtons}
            />
        </motion.div>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
const PromptsSettings: React.FC = () => {
    const [userContext] = useUserContext() as any; //user context

    // Stato agenti
    const [agents, setAgents] = useState<IAgent[]>([]); //state per la lista di agenti
    const [selectedAgent, setSelectedAgent] = useState<string>(""); //state per l'agente selezionato
    const [agentsLoading, setAgentsLoading] = useState<boolean>(true); //loading agenti

    // Stato prompts
    const [prompts, setPrompts] = useState<Prompt[]>([]); //lista dei prompts
    const [loading, setLoading] = useState<boolean>(false); //loading prompts
    const [error, setError] = useState<string | null>(null); //state di errore
    const [expandedKey, setExpandedKey] = useState<string | null>(null);//state per espandere o no un determinato prompt

    const abortController = useRef<AbortController | null>(null); //abort controller per cancellare le richieste

    const userRole = userContext?.details?.ruolo; //ruolo utente recuperato dai details

    const agentBtnRef = useRef<HTMLButtonElement | null>(null); //ref pulsante "seleziona agente"
    const [openAgentSelect, setOpenAgentSelect] = useState(false) //state per apprire il context menu di selezione agente

    /**
     * state per passare un agent selezionato dall'esterno / dall'alto.
     * viene usaro per far si che se abbiamo selezionato per esempio il data assistant, 
     * quando apriamo i settings farà già riferimento a quello
     */
    const externalSelectedAgentSet = useRef<boolean>(false);

    // Dialog state
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; prompt?: Prompt; loading?: boolean }>({ open: false }); //state di conferma eliminazione
    const [editOpen, setEditOpen] = useState(false); //state per cui è aperto il dialog di edit di un prompt
    const [editTarget, setEditTarget] = useState<Prompt | null>(null); //state con cui passiamo il prompt di riferimento 
    const [editLoading, setEditLoading] = useState(false); //state di loading


    // ——————————————————————————————————————————————————————————
    // FETCH DATA
    // ——————————————————————————————————————————————————————————
    // Fetch degli agenti al mount
    const fetchAgents = async () => {
        setAgentsLoading(true);
        try {
            const response = await getAgents(abortController);
            if (response.success && response.data.length > 0) {
                setAgents(response.data);
                // Seleziona il primo agente di default solo se non è stato impostato dall'esterno
                if (!selectedAgent && !externalSelectedAgentSet.current) setSelectedAgent(response.data[0].key);
            }
        } catch (err: any) {
            console.error("Error fetching agents:", err);
            enqueueSnackbar("Errore nel caricamento degli agenti", { type: "error" });
        } finally {
            setAgentsLoading(false);
        }
    };

    // Fetch dei prompts per l'agente selezionato
    const fetchPrompts = async () => {
        if (!selectedAgent) return;

        setLoading(true);
        setError(null);

        try {
            // Passa l'agente selezionato e il ruolo utente alla chiamata API
            const response = await getPrompts(abortController, selectedAgent, userRole);
            if (response.success) {
                setPrompts(response.data);
            } else {
                setError(response.error || "Errore nel caricamento dei prompts");
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                // Gestisci errori specifici
                if (err?.status === 403) {
                    setError("Accesso negato: solo sviluppatori possono gestire i prompts");
                } else if (err?.status === 401) {
                    setError("Sessione scaduta: perfavore accedi di nuovo");
                } else {
                    setError("Errore di connessione al server");
                }
                console.error("Error fetching prompts:", err);
            }
        } finally {
            setLoading(false);
        }
    };


    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    // Handlers per edit/delete
    const handleEdit = (p: Prompt) => {
        setEditTarget(p);
        setEditOpen(true);
    };

    const handleDeleteClick = (p: Prompt) => {
        setConfirmDelete({ open: true, prompt: p, loading: false });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete.prompt) return;
        setConfirmDelete((s) => ({ ...s, loading: true }));
        try {
            const { agent_nome, order_prompt } = confirmDelete.prompt;
            await deletePrompt(abortController, agent_nome, order_prompt, userRole);
            setPrompts((prev) => prev.filter((x) =>
                !(x.agent_nome === agent_nome && x.order_prompt === order_prompt)
            ));
            enqueueSnackbar("Prompt eliminato con successo", { type: "success" });
            setConfirmDelete({ open: false });
        } catch (e: any) {
            console.error(e);
            enqueueSnackbar("Errore durante l'eliminazione del prompt", { type: "error" });
            setConfirmDelete((s) => ({ ...s, loading: false }));
        }
    };

    const handleConfirmEdit = async (data: {
        agent_nome: string;
        prompt_nome: string;
        order_prompt: number;
        prompt_testo: string;
        original_agent_nome?: string;
        original_order_prompt?: number;
    }) => {
        setEditLoading(true);
        try {
            const res = await upsertPrompt(abortController, data, userRole);
            const newPrompt = res.data;
            const newKey = getPromptKey(newPrompt);

            setPrompts((prev) => {
                // Se è un update, rimuovi il vecchio e aggiungi il nuovo
                if (data.original_agent_nome !== undefined && data.original_order_prompt !== undefined) {
                    const filtered = prev.filter((p) =>
                        !(p.agent_nome === data.original_agent_nome && p.order_prompt === data.original_order_prompt)
                    );
                    return [...filtered, newPrompt].sort((a, b) => {
                        if (a.agent_nome !== b.agent_nome) return a.agent_nome.localeCompare(b.agent_nome);
                        return a.order_prompt - b.order_prompt;
                    });
                }
                // Altrimenti è un insert
                return [...prev, newPrompt].sort((a, b) => {
                    if (a.agent_nome !== b.agent_nome) return a.agent_nome.localeCompare(b.agent_nome);
                    return a.order_prompt - b.order_prompt;
                });
            });
            enqueueSnackbar(editTarget ? "Prompt aggiornato" : "Prompt creato", { type: "success" });
            setEditOpen(false);
            setEditTarget(null);
        } catch (e) {
            console.error(e);
            enqueueSnackbar("Errore durante il salvataggio del prompt", { type: "error" });
        } finally {
            setEditLoading(false);
        }
    };

    // Toggle espansione prompt
    const handleToggle = (prompt: Prompt) => {
        const key = getPromptKey(prompt);
        setExpandedKey((prev) => (prev === key ? null : key));
    };

    // Handler per creare un nuovo prompt aprendo il dialog
    const handleCreatePrompt = () => {
        setEditTarget(null);
        setEditOpen(true);
    };


    // ——————————————————————————————————————————————————————————
    // USE EFFECTS
    // ——————————————————————————————————————————————————————————
    useEffect(() => {
        // Attendi che userContext sia caricato
        if (userContext?.details) {
            fetchAgents();
        }

        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, [userContext?.details]);

    useEffect(() => {
        const cleanSelectedModelListener = onSelectedModelChange(({ value }) => {
            try {
                const { key } = parseAgentSelectValue(value);
                externalSelectedAgentSet.current = true
                setSelectedAgent(key);
            } catch (err) {
                console.warn('Invalid selectedModel value from event', err);
            }
        });
        requestSelectedModel();

        return cleanSelectedModelListener;
    }, []);

    // Carica i prompts quando cambia l'agente selezionato
    useEffect(() => {
        if (selectedAgent) {
            fetchPrompts();
        }
    }, [selectedAgent]);



    // ——————————————————————————————————————————————————————————
    // MAIN COMPONENT
    // ——————————————————————————————————————————————————————————
    return (
        <div className="space-y-6 min-w-0 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Gestione Prompts</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Visualizza e gestisci i prompts dell'assistente AI.
                    </p>
                </div>
            </div>

            {/* Select Agente */}
            <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Seleziona Agente</label>
                {agentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshIcon size={16} className="animate-spin" />
                        Caricamento agenti...
                    </div>
                ) : agents.length === 0 ? (
                    <p className="text-sm text-gray-500">Nessun agente disponibile</p>
                ) : (


                    <FDButton
                        ref={agentBtnRef}
                        size="small"
                        variant="outline"
                        rightIcon={<ChevronDownIcon size={15} />}
                        onClick={() => setOpenAgentSelect(true)}
                    >
                        {(() => {
                            const a = agents.find(a => a.key === selectedAgent);
                            return a ? `${a.displayName} ${a.version}` : (selectedAgent ? selectedAgent.replace(/_/g, ' ') : 'Seleziona agente');
                        })()}
                    </FDButton>


                )}
            </div>

            {/* Contenuto */}
            <div className="space-y-3">
                {/* Loading state */}
                {(loading || (agentsLoading && prompts.length === 0)) && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <MinLoader sx={{ width: 25, height: 25 }} />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Caricamento prompts...</p>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full">
                                <span className="text-red-500 text-xl">!</span>
                            </div>
                            <p className="text-sm text-red-500">{error}</p>
                            <FDButton
                                variant="soft"
                                color="primary"
                                size="small"
                                onClick={fetchPrompts}
                            >
                                Riprova
                            </FDButton>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && prompts.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-neutral-700 rounded-full">
                                <PromptIcon size={24} />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nessun prompt disponibile</p>
                            <FDButton
                                icon={<AddIcon size={16} />}
                                variant="soft"
                                color="primary"
                                size="small"
                                onClick={handleCreatePrompt}
                            >
                                Crea il primo prompt
                            </FDButton>
                        </div>
                    </div>
                )}

                {/* Lista prompts */}
                {!loading && !error && prompts.length > 0 && (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {prompts.map((prompt) => (
                                <PromptItem
                                    key={`${prompt.agent_nome}|${prompt.order_prompt}`}
                                    prompt={prompt}
                                    isExpanded={expandedKey === `${prompt.agent_nome}|${prompt.order_prompt}`}
                                    onToggle={() => handleToggle(prompt)}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Sticky FAB: fixed bottom-right, always visible (unless edit dialog open) */}
                {!editOpen && (
                    <FDIconButton
                            icon={<AddIcon size={20} />}
                            variant="primary"
                            size="large"
                            className="fixed bottom-6 right-6 !rounded-full !h-14 !w-14 flex items-center justify-center shadow-lg"
                            onClick={handleCreatePrompt}
                            dataTooltipId="general-ai-tooltip"
                            dataTooltipContent="Crea un nuovo prompt"
                        />
                )}
            </div>

            {/* Footer info */}
            {!loading && prompts.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Totale prompts: {prompts.length}
                    </p>
                </div>
            )}

            {/* Dialogs */}
            <DeletePromptDialog
                open={!!confirmDelete.open}
                title={confirmDelete.prompt?.prompt_nome}
                onClose={() => setConfirmDelete({ open: false })}
                onConfirm={handleConfirmDelete}
                loading={!!confirmDelete.loading}
            />

            {editOpen && <EditPromptDialog
                open={editOpen}
                initial={editTarget ? {
                    agent_nome: editTarget.agent_nome,
                    prompt_nome: editTarget.prompt_nome,
                    order_prompt: editTarget.order_prompt,
                    prompt_testo: editTarget.prompt_testo,
                } : undefined}
                defaultAgentNome={selectedAgent}
                onClose={() => { setEditOpen(false); setEditTarget(null); }}
                onConfirm={handleConfirmEdit}
                loading={editLoading}
            />}

            <ContextMenu
                pos={agentBtnRef}
                placement="bottom"
                onClose={() => setOpenAgentSelect(false)}
                openFor={openAgentSelect}
                menuButtons={agents.map((agent) => ({
                    title: `${agent.displayName} ${agent.version}`,
                    onClick: () => {
                        const agentSelectValue = formatAgentForSelect(agent);
                        setSelectedAgent(agent.key);
                        setOpenAgentSelect(false);
                        // dispatch event so chat can update selectedModel (format: key-version)
                        emitSelectedModelChange(agentSelectValue);
                    }
                }))}
            />
        </div>
    );
};

export default PromptsSettings;
