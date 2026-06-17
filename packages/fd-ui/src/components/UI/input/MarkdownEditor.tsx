/**
 * Editor Markdown diretto con toolbar per formattazione.
 * Supporta: grassetto, corsivo, sottolineato, barrato, elenchi (-, *, numerati),
 * tabelle MD, indentazione con TAB, undo/redo, pulizia formattazione.
 */
import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiBold,
    FiItalic,
    FiUnderline,
    FiList,
    FiTrash2,
    FiRotateCcw,
    FiRotateCw,
} from "react-icons/fi";
import { MdOutlineFormatStrikethrough, MdTableChart, MdFormatIndentIncrease } from "react-icons/md";
import { BsListOl, BsListNested } from "react-icons/bs";

// Icon casts
const FiBoldIcon = FiBold as React.FC<{ size?: number; className?: string }>;
const FiItalicIcon = FiItalic as React.FC<{ size?: number; className?: string }>;
const FiUnderlineIcon = FiUnderline as React.FC<{ size?: number; className?: string }>;
const FiStrikethroughIcon = MdOutlineFormatStrikethrough as React.FC<{ size?: number; className?: string }>;
const FiListIcon = FiList as React.FC<{ size?: number; className?: string }>;
const FiListOlIcon = BsListOl as React.FC<{ size?: number; className?: string }>;
const FiListNestedIcon = BsListNested as React.FC<{ size?: number; className?: string }>;
const FiTableIcon = MdTableChart as React.FC<{ size?: number; className?: string }>;
const FiIndentIcon = MdFormatIndentIncrease as React.FC<{ size?: number; className?: string }>;
const FiTrash2Icon = FiTrash2 as React.FC<{ size?: number; className?: string }>;
const FiRotateCcwIcon = FiRotateCcw as React.FC<{ size?: number; className?: string }>;
const FiRotateCwIcon = FiRotateCw as React.FC<{ size?: number; className?: string }>;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type MarkdownEditorProps = {
    value: string;
    onChange: (md: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    maxHeight?: number | string;
    minHeight?: number | string;
};

// -----------------------------------------------------------------------------
// History manager for undo/redo
// -----------------------------------------------------------------------------
interface HistoryState {
    past: string[];
    present: string;
    future: string[];
}

function useHistory(initialValue: string) {
    const [state, setState] = useState<HistoryState>({
        past: [],
        present: initialValue,
        future: [],
    });

    const set = useCallback((newValue: string, replace = false) => {
        setState((s) => {
            if (newValue === s.present) return s;
            if (replace) {
                return { ...s, present: newValue };
            }
            return {
                past: [...s.past.slice(-50), s.present],
                present: newValue,
                future: [],
            };
        });
    }, []);

    const undo = useCallback(() => {
        setState((s) => {
            if (s.past.length === 0) return s;
            const prev = s.past[s.past.length - 1];
            return {
                past: s.past.slice(0, -1),
                present: prev,
                future: [s.present, ...s.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState((s) => {
            if (s.future.length === 0) return s;
            const next = s.future[0];
            return {
                past: [...s.past, s.present],
                present: next,
                future: s.future.slice(1),
            };
        });
    }, []);

    const reset = useCallback((val: string) => {
        setState({ past: [], present: val, future: [] });
    }, []);

    return { value: state.present, set, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}

// -----------------------------------------------------------------------------
// Core component
// -----------------------------------------------------------------------------
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = "Scrivi in Markdown…",
    disabled = false,
    className,
    maxHeight = 400,
    minHeight = 200,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const history = useHistory(value);
    const [tableModal, setTableModal] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);

    // Sync external value
    useEffect(() => {
        if (value !== history.value) {
            history.reset(value);
        }
    }, [value]);

    // Emit changes
    useEffect(() => {
        if (history.value !== value) {
            onChange(history.value);
        }
    }, [history.value]);

    // Get selection info
    const getSelection = () => {
        const ta = textareaRef.current;
        if (!ta) return { start: 0, end: 0, text: "", before: "", after: "" };
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = ta.value.substring(start, end);
        const before = ta.value.substring(0, start);
        const after = ta.value.substring(end);
        return { start, end, text, before, after };
    };

    // Set new value and cursor
    const applyChange = (newValue: string, cursorStart: number, cursorEnd?: number) => {
        history.set(newValue);
        setTimeout(() => {
            const ta = textareaRef.current;
            if (ta) {
                ta.focus();
                ta.setSelectionRange(cursorStart, cursorEnd ?? cursorStart);
            }
        }, 0);
    };

    // Wrap selection with markers
    const wrapSelection = (prefix: string, suffix: string) => {
        const { start, end, text, before, after } = getSelection();
        // Check if already wrapped - toggle off
        const alreadyWrapped =
            before.endsWith(prefix) && after.startsWith(suffix);
        if (alreadyWrapped) {
            const newBefore = before.slice(0, -prefix.length);
            const newAfter = after.slice(suffix.length);
            const newValue = newBefore + text + newAfter;
            applyChange(newValue, start - prefix.length, end - prefix.length);
            return;
        }
        const newValue = before + prefix + text + suffix + after;
        applyChange(newValue, start + prefix.length, end + prefix.length);
    };

    // Toggle line prefix (for lists)
    const toggleLinePrefix = (prefix: string) => {
        const { start, end, before, after } = getSelection();
        const ta = textareaRef.current;
        if (!ta) return;

        const fullText = ta.value;
        // Find line start
        const lineStart = before.lastIndexOf("\n") + 1;
        const lineEnd = fullText.indexOf("\n", end);
        const actualLineEnd = lineEnd === -1 ? fullText.length : lineEnd;
        const line = fullText.substring(lineStart, actualLineEnd);

        // Check if line already has prefix
        const trimmedLine = line.trimStart();
        const leadingSpaces = line.length - trimmedLine.length;
        const indent = line.substring(0, leadingSpaces);

        if (trimmedLine.startsWith(prefix)) {
            // Remove prefix
            const newLine = indent + trimmedLine.substring(prefix.length);
            const newValue = fullText.substring(0, lineStart) + newLine + fullText.substring(actualLineEnd);
            applyChange(newValue, start - prefix.length);
        } else {
            // Add prefix
            const newLine = indent + prefix + trimmedLine;
            const newValue = fullText.substring(0, lineStart) + newLine + fullText.substring(actualLineEnd);
            applyChange(newValue, start + prefix.length);
        }
    };

    // Insert numbered list
    const insertNumberedList = () => {
        const { start, end, before, after } = getSelection();
        const ta = textareaRef.current;
        if (!ta) return;

        const fullText = ta.value;
        const lineStart = before.lastIndexOf("\n") + 1;
        const lineEnd = fullText.indexOf("\n", end);
        const actualLineEnd = lineEnd === -1 ? fullText.length : lineEnd;
        const line = fullText.substring(lineStart, actualLineEnd);

        // Check for existing numbered prefix
        const numMatch = line.match(/^(\s*)(\d+)\.\s/);
        if (numMatch) {
            // Remove it
            const newLine = numMatch[1] + line.substring(numMatch[0].length);
            const newValue = fullText.substring(0, lineStart) + newLine + fullText.substring(actualLineEnd);
            applyChange(newValue, start - numMatch[0].length + numMatch[1].length);
        } else {
            // Add "1. "
            const trimmedLine = line.trimStart();
            const leadingSpaces = line.length - trimmedLine.length;
            const indent = line.substring(0, leadingSpaces);
            const newLine = indent + "1. " + trimmedLine;
            const newValue = fullText.substring(0, lineStart) + newLine + fullText.substring(actualLineEnd);
            applyChange(newValue, start + 3);
        }
    };

    // Insert table
    const insertTable = () => {
        const rows = Math.max(1, tableRows);
        const cols = Math.max(1, tableCols);

        const headerRow = "| " + Array(cols).fill("Header").join(" | ") + " |";
        const separatorRow = "| " + Array(cols).fill("---").join(" | ") + " |";
        const dataRows = Array(rows - 1)
            .fill(null)
            .map(() => "| " + Array(cols).fill("Cell").join(" | ") + " |")
            .join("\n");

        const table = `\n${headerRow}\n${separatorRow}\n${dataRows}\n`;

        const { end, before, after } = getSelection();
        const newValue = before + table + after;
        applyChange(newValue, end + headerRow.length + 3);
        setTableModal(false);
    };

    // Indent/dedent
    const indent = () => {
        const { start, end, before, after } = getSelection();
        const ta = textareaRef.current;
        if (!ta) return;

        const fullText = ta.value;
        const lineStart = before.lastIndexOf("\n") + 1;
        const lineEnd = fullText.indexOf("\n", end);
        const actualLineEnd = lineEnd === -1 ? fullText.length : lineEnd;
        const line = fullText.substring(lineStart, actualLineEnd);

        const newLine = "\t" + line;
        const newValue = fullText.substring(0, lineStart) + newLine + fullText.substring(actualLineEnd);
        applyChange(newValue, start + 1, end + 1);
    };

    // Clear formatting from selection
    const clearFormatting = () => {
        const { start, end, text, before, after } = getSelection();
        if (!text) return;

        // Remove common MD markers
        let cleaned = text
            .replace(/\*\*(.+?)\*\*/g, "$1") // bold
            .replace(/\*(.+?)\*/g, "$1") // italic
            .replace(/__(.+?)__/g, "$1") // alt bold
            .replace(/_(.+?)_/g, "$1") // alt italic
            .replace(/~~(.+?)~~/g, "$1") // strikethrough
            .replace(/<u>(.+?)<\/u>/gi, "$1") // underline
            .replace(/`(.+?)`/g, "$1"); // inline code

        const newValue = before + cleaned + after;
        applyChange(newValue, start, start + cleaned.length);
    };

    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // TAB for indent
        if (e.key === "Tab") {
            e.preventDefault();
            if (e.shiftKey) {
                // Dedent
                const { start, before } = getSelection();
                const ta = textareaRef.current;
                if (!ta) return;
                const fullText = ta.value;
                const lineStart = before.lastIndexOf("\n") + 1;
                const line = fullText.substring(lineStart);
                if (line.startsWith("\t")) {
                    const newValue = fullText.substring(0, lineStart) + line.substring(1);
                    applyChange(newValue, Math.max(start - 1, lineStart));
                } else if (line.startsWith("    ")) {
                    const newValue = fullText.substring(0, lineStart) + line.substring(4);
                    applyChange(newValue, Math.max(start - 4, lineStart));
                }
            } else {
                indent();
            }
            return;
        }

        // Ctrl/Cmd shortcuts
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase();
            if (key === "b") {
                e.preventDefault();
                wrapSelection("**", "**");
            } else if (key === "i") {
                e.preventDefault();
                wrapSelection("*", "*");
            } else if (key === "u") {
                e.preventDefault();
                wrapSelection("<u>", "</u>");
            } else if (key === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    history.redo();
                } else {
                    history.undo();
                }
            } else if (key === "y") {
                e.preventDefault();
                history.redo();
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        history.set(e.target.value);
    };

    return (
        <div
            className={`flex flex-col rounded-xl h-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden ${className || ""}`}
            style={{ minHeight, maxHeight }}
        >
            {/* Toolbar */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <ToolbarButton label="Grassetto (Ctrl+B)" icon={<FiBoldIcon size={16} />} onClick={() => wrapSelection("**", "**")} />
                <ToolbarButton label="Corsivo (Ctrl+I)" icon={<FiItalicIcon size={16} />} onClick={() => wrapSelection("*", "*")} />
                <ToolbarButton label="Sottolineato (Ctrl+U)" icon={<FiUnderlineIcon size={16} />} onClick={() => wrapSelection("<u>", "</u>")} />
                <ToolbarButton label="Barrato" icon={<FiStrikethroughIcon size={16} />} onClick={() => wrapSelection("~~", "~~")} />

                <Divider />

                <ToolbarButton label="Elenco puntato (-)" icon={<FiListIcon size={16} />} onClick={() => toggleLinePrefix("- ")} />
                <ToolbarButton label="Elenco asterisco (*)" icon={<FiListNestedIcon size={16} />} onClick={() => toggleLinePrefix("* ")} />
                <ToolbarButton label="Elenco numerato" icon={<FiListOlIcon size={16} />} onClick={insertNumberedList} />

                <Divider />

                <ToolbarButton label="Indenta (Tab)" icon={<FiIndentIcon size={16} />} onClick={indent} />
                <ToolbarButton label="Inserisci tabella" icon={<FiTableIcon size={16} />} onClick={() => setTableModal(true)} />

                <Divider />

                <ToolbarButton label="Pulisci formattazione" icon={<FiTrash2Icon size={16} />} onClick={clearFormatting} />

                <div className="ml-auto flex items-center gap-1">
                    <ToolbarButton label="Annulla (Ctrl+Z)" icon={<FiRotateCcwIcon size={16} />} onClick={history.undo} disabled={!history.canUndo} />
                    <ToolbarButton label="Ripristina (Ctrl+Y)" icon={<FiRotateCwIcon size={16} />} onClick={history.redo} disabled={!history.canRedo} />
                </div>
            </div>

            {/* Editor */}
            <div className="relative flex-1 overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={history.value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full h-full resize-none p-3 bg-transparent text-sm font-mono text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
                    spellCheck={false}
                />
            </div>

            {/* Table Modal */}
            <AnimatePresence>
                {tableModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setTableModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-xl min-w-[280px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-base font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Inserisci Tabella</h3>
                            <div className="flex gap-4 mb-4">
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-neutral-600 dark:text-neutral-400">Righe</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={tableRows}
                                        onChange={(e) => setTableRows(Number(e.target.value))}
                                        className="w-20 px-2 py-1 border rounded bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-sm">
                                    <span className="text-neutral-600 dark:text-neutral-400">Colonne</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={tableCols}
                                        onChange={(e) => setTableCols(Number(e.target.value))}
                                        className="w-20 px-2 py-1 border rounded bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setTableModal(false)}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={insertTable}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Inserisci
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(MarkdownEditor);

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------
const ToolbarButton = memo(function ToolbarButton({
    label,
    onClick,
    icon,
    disabled,
}: {
    label: string;
    onClick: () => void;
    icon: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors
                ${disabled
                    ? "text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
                    : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
                }`}
        >
            {icon}
        </button>
    );
});

const Divider = () => (
    <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" aria-hidden />
);
