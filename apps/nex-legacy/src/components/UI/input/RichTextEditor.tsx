import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiBold,
    FiItalic,
    FiUnderline,
    FiType,
    FiList,
    FiCode,
    FiLink,
    FiX,
    FiTrash2,
    FiRotateCcw,
    FiRotateCw,
} from "react-icons/fi";
import { MdOutlineFormatStrikethrough } from "react-icons/md";
import { BsListOl } from "react-icons/bs";
import { FaQuoteLeft } from "react-icons/fa6";

const FiStrikethroughIcon = MdOutlineFormatStrikethrough as React.FC<{ size?: number; className?: string }>;
const FiBoldIcon = FiBold as React.FC<{ size?: number; className?: string }>;
const FiItalicIcon = FiItalic as React.FC<{ size?: number; className?: string }>;
const FiUnderlineIcon = FiUnderline as React.FC<{ size?: number; className?: string }>;
const FiTypeIcon = FiType as React.FC<{ size?: number; className?: string }>;
const FiListIcon = FiList as React.FC<{ size?: number; className?: string }>;
const FiListOlIcon = BsListOl as React.FC<{ size?: number; className?: string }>;
const FiQuoteIcon = FaQuoteLeft as React.FC<{ size?: number; className?: string }>;
const FiCodeIcon = FiCode as React.FC<{ size?: number; className?: string }>;
const FiLinkIcon = FiLink as React.FC<{ size?: number; className?: string }>;
const FiXIcon = FiX as React.FC<{ size?: number; className?: string }>;
const FiTrash2Icon = FiTrash2 as React.FC<{ size?: number; className?: string }>;
const FiRotateCcwIcon = FiRotateCcw as React.FC<{ size?: number; className?: string }>;
const FiRotateCwIcon = FiRotateCw as React.FC<{ size?: number; className?: string }>;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type ToolbarAction =
    | "bold"
    | "italic"
    | "underline"
    | "strike"
    | "h1"
    | "h2"
    | "ul"
    | "ol"
    | "quote"
    | "code"
    | "link"
    | "clear";

export type RichTextEditorProps = {
    value: string; // HTML
    onChange: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /**
     * Debounce in ms per onChange, per evitare re-render eccessivi a ogni keypress.
     * 0 per disabilitare il debounce. Default: 120ms
     */
    debounceMs?: number;
    /**
     * Lista azioni della toolbar. Puoi ridurla facilmente in base al contesto.
     */
    actions?: ToolbarAction[];
    /**
     * Altezza massima dell'area di editing.
     */
    maxHeight?: number | string;
};

// -----------------------------------------------------------------------------
// Utils: sanitizer & helpers
// -----------------------------------------------------------------------------

/**
 * Sanitizza HTML con una whitelist "safe" di tag/attributi.
 * Per esigenze più spinte puoi sostituire con DOMPurify.
 */
function sanitizeHtml(dirtyHtml: string): string {
    const ALLOWED_TAGS = new Set([
        "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "A",
        "UL", "OL", "LI", "H1", "H2", "BLOCKQUOTE", "CODE", "PRE",
        "DIV", "SPAN", "IMG"
    ]);
    const ALLOWED_ATTRS: Record<string, Set<string>> = {
        A: new Set(["href", "target", "rel"]),
        IMG: new Set(["src", "alt", "width", "height"]) // immagini con src locale o base64
    };

    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml || "", "text/html");
    const root = doc.body;

    const sanitizeNode = (node: Node) => {
        // Testo: va sempre bene
        if (node.nodeType === Node.TEXT_NODE) return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el: any = node as HTMLElement;

            // NON toccare <body>; sanifica solo i suoi figli
            if (el === root) {
                let c = el.firstChild;
                while (c) {
                    const next = c.nextSibling;
                    sanitizeNode(c);
                    c = next;
                }
                return;
            }

            // Se il tag non è permesso, unwrap (sposta i figli prima del nodo) e rimuovi
            if (!ALLOWED_TAGS.has(el.tagName)) {
                while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
                el.remove();
                return;
            }

            // Attributi permessi solo per i tag previsti
            const allowedForTag = ALLOWED_ATTRS[el.tagName] || new Set<string>();
            [...el.attributes].forEach((attr) => {
                if (!allowedForTag.has(attr.name.toLowerCase())) el.removeAttribute(attr.name);
            });

            // Hardening link
            if (el.tagName === "A") {
                const a = el as HTMLAnchorElement;
                if (a.href) {
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                }
            };

            // Gestione immagini
            if (el.tagName === "IMG") {
                const img = el as HTMLImageElement;
                // Consenti SOLO data URL immagine oppure http/https
                const src = img.getAttribute("src") || "";
                const isData = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src);
                const isHttp = /^https?:\/\//i.test(src);
                if (!isData && !isHttp) {
                    // sorgente non sicura -> rimuovi l'immagine
                    el.remove();
                    return;
                }
                // Rimuovi qualsiasi event handler (per sicurezza extra)
                Array.from(img.attributes).forEach(a => {
                    if (a.name.toLowerCase().startsWith("on")) img.removeAttribute(a.name);
                });
                // Applica classe responsive via attribute-safe
                img.setAttribute("data-rte-img", "1"); // marker per styling
            }

            // Ricorsione sui figli
            let c = el.firstChild;
            while (c) {
                const next = c.nextSibling;
                sanitizeNode(c);
                c = next;
            }
        }
    };

    // Avvia la sanificazione dai FIGLI del body, non dal body stesso
    let child = root.firstChild;
    while (child) {
        const next = child.nextSibling;
        sanitizeNode(child);
        child = next;
    }

    // Restituisci il contenuto del body
    return root.innerHTML.trim();
}

/** Normalizza per confronti leggeri (evita refresh del DOM inutili). */
function normalizeHtml(html: string): string {
    return html
        .replace(/<div><br><\/div>/gi, "<p><br></p>")
        .replace(/\u00A0/g, " ") // nbsp -> spazio
        .trim();
}

/** Debounce minimale senza dipendenze esterne */
function useDebouncedCallback<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
) {
    const timer = useRef<number | null>(null);
    const saved = useRef(fn);
    useEffect(() => {
        saved.current = fn;
    }, [fn]);

    const cb = useCallback(
        (...args: Parameters<T>) => {
            if (!delay) {
                saved.current(...args);
                return;
            }
            if (timer.current) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
                saved.current(...args);
            }, delay) as unknown as number;
        },
        [delay]
    );

    useEffect(() => {
        return () => {
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, []);

    return cb;
}

// Inserisce HTML nel punto di caret (usato per paste)
// Nota: usa execCommand come fallback se non c'è selezione
function insertHtmlAtCursor(html: string) {
    // Usa Range per inserire HTML nel punto di caret
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
        document.execCommand("insertHTML", false, html);
        return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const frag = range.createContextualFragment(html);
    const lastNode = frag.lastChild;
    range.insertNode(frag);
    if (lastNode) {
        // posiziona caret dopo il nodo inserito
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    }
}

// Converte un File in data URL (usato per paste di immagini)
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}

// -----------------------------------------------------------------------------
// Core editor
// -----------------------------------------------------------------------------
const DEFAULT_ACTIONS: ToolbarAction[] = [
    "bold",
    "italic",
    "underline",
    "strike",
    "h1",
    "h2",
    "ul",
    "ol",
    "quote",
    "code",
    "link",
    "clear",
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Scrivi qualcosa…",
    disabled = false,
    className,
    debounceMs = 120,
    actions = DEFAULT_ACTIONS,
    maxHeight = 300,
}) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const [linkUI, setLinkUI] = useState<{ open: boolean; url: string }>({
        open: false,
        url: "",
    });
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [isEmpty, setIsEmpty] = useState(true);

    // helper veloce per capire se l'editor è “vuoto”
    const checkEmpty = useCallback(() => {
        const n = editableRef.current;
        if (!n) return true;
        const text = (n.textContent || "").trim();
        if (text) return false;
        // se ci sono elementi “contenuto” non consideriamo vuoto
        if (n.querySelector("img,li,code,pre,blockquote,a")) return false;
        // un singolo <br> vale come vuoto
        return true;
    }, []);

    // Sync iniziale/esterno → DOM (senza jitter ad ogni keypress)
    useLayoutEffect(() => {
        const node = editableRef.current;
        if (!node) return;
        const sanitized = sanitizeHtml(value || "");
        if (normalizeHtml(node.innerHTML) !== normalizeHtml(sanitized)) {
            node.innerHTML = sanitized || "";
        }
        // aggiorna immediatamente il placeholder
        setIsEmpty(checkEmpty());
    }, [value, checkEmpty]);

    // onChange debounced
    const emitChange = useDebouncedCallback((html: string) => {
        onChange(sanitizeHtml(html));
    }, debounceMs);

    // Gestione input/paste
    const handleInput = useCallback(() => {
        const node = editableRef.current;
        if (!node) return;
        setIsEmpty(checkEmpty());        // <-- placeholder reattivo
        emitChange(node.innerHTML);
    }, [emitChange, checkEmpty]);

    const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
        const dt = e.clipboardData;
        const files = Array.from(dt?.files || []);

        // Se ci sono immagini come file -> blocca default e inserisci come <img>
        const imageFiles = files.filter(f => /^image\//i.test(f.type));
        if (imageFiles.length > 0) {
            e.preventDefault();
            for (const f of imageFiles) {
                try {
                    const dataUrl = await fileToDataUrl(f);
                    // Costruisci img minimale; sanificazione confermerà lo schema data:
                    const html = `<p><img src="${dataUrl}" alt="${f.name || "pasted-image"}" data-rte-img="1"/></p>`;
                    insertHtmlAtCursor(html);
                } catch {/* ignore single file error */ }
            }
            handleInput(); // emetti change/placeholder update
            return;
        }

        // Altrimenti gestisci come prima (HTML -> sanitized, TEXT -> paragrafi)
        e.preventDefault();
        const html = dt.getData("text/html");
        const text = dt.getData("text/plain");

        const insert = (fragHtml: string) => {
            document.execCommand("insertHTML", false, fragHtml);
        };

        if (html) {
            insert(sanitizeHtml(html));
        } else if (text) {
            const paras = text
                .split(/\n{2,}/)
                .map((block) =>
                    block
                        .split(/\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .join(" ")
                )
                .filter(Boolean)
                .map((p) => `<p>${escapeHtml(p)}</p>`)
                .join("");
            insert(paras || "<p><br></p>");
        }
    }, [handleInput]);

    // nuova funzione (sostituisce la logica duplicata nell'effect)
    const recalcActive = useCallback(() => {
        const next: Record<string, boolean> = {};
        try {
            next.bold = document.queryCommandState("bold");
            next.italic = document.queryCommandState("italic");
            next.underline = document.queryCommandState("underline");
            next.strike = document.queryCommandState("strikeThrough");
            next.ul = document.queryCommandState("insertUnorderedList");
            next.ol = document.queryCommandState("insertOrderedList");

            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.commonAncestorContainer as HTMLElement;
                const el = container.nodeType === 1 ? container : container.parentElement;
                const tag = nearestTag(el, ["H1", "H2", "BLOCKQUOTE", "PRE"]);
                next.h1 = tag === "H1";
                next.h2 = tag === "H2";
                next.quote = tag === "BLOCKQUOTE";
                next.code = tag === "PRE";
            }
        } catch {
            // ignore
        }
        setActive((prev) => {
            const same =
                Object.keys(next).length === Object.keys(prev).length &&
                Object.keys(next).every((k) => prev[k] === next[k]);
            return same ? prev : next;
        });
    }, []);

    useEffect(() => {
        let raf = 0;
        const onSel = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(recalcActive);
        };
        document.addEventListener("selectionchange", onSel);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            document.removeEventListener("selectionchange", onSel);
        };
    }, [recalcActive]);

    // Toolbar handlers
    const cmd = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value);
        // Dopo il comando emettiamo change
        recalcActive();
        handleInput();
    }, [handleInput, recalcActive]);

    const formatBlock = useCallback((tag: "P" | "H1" | "H2" | "BLOCKQUOTE" | "PRE") => {
        document.execCommand("formatBlock", false, tag === "P" ? "P" : `<${tag}>`);
        recalcActive();
        handleInput();
    }, [handleInput, recalcActive]);

    const onLink = useCallback(() => {
        setLinkUI({ open: true, url: "" });
    }, []);

    const applyLink = useCallback(() => {
        if (!linkUI.url) {
            setLinkUI({ open: false, url: "" });
            return;
        }
        document.execCommand("createLink", false, linkUI.url);
        hardenLinksInSelection();
        setLinkUI({ open: false, url: "" });
        recalcActive();
        handleInput();
    }, [linkUI.url, handleInput, recalcActive]);

    const removeFormatting = useCallback(() => {
        document.execCommand("removeFormat");
        unwrapTagsInSelection("A");
        recalcActive();
        handleInput();
    }, [handleInput, recalcActive]);

    // Shortcut tastiera
    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!e.ctrlKey && !e.metaKey) return;
        const key = e.key.toLowerCase();
        if (key === "b") {
            e.preventDefault(); cmd("bold");
        } else if (key === "i") {
            e.preventDefault(); cmd("italic");
        } else if (key === "u") {
            e.preventDefault(); cmd("underline");
        } else if (key === "k") {
            e.preventDefault(); onLink();
        } else if (key === "z") {
            // lascia default undo/redo del browser
        }
    }, [cmd, onLink]);

    // Undo/redo demandato al browser (execCommand/history nativi).
    const doUndo = useCallback(() => document.execCommand("undo"), []);
    const doRedo = useCallback(() => document.execCommand("redo"), []);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <div className={`flex flex-col h-full
        rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm ${className || ""}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-800">
                <ToolbarButton
                    label="Grassetto (Ctrl/Cmd+B)"
                    pressed={!!active.bold}
                    icon={<FiBoldIcon />}
                    onClick={() => cmd("bold")}
                />
                <ToolbarButton
                    label="Corsivo (Ctrl/Cmd+I)"
                    pressed={!!active.italic}
                    icon={<FiItalicIcon />}
                    onClick={() => cmd("italic")}
                />
                <ToolbarButton
                    label="Sottolineato (Ctrl/Cmd+U)"
                    pressed={!!active.underline}
                    icon={<FiUnderlineIcon />}
                    onClick={() => cmd("underline")}
                />
                <ToolbarButton
                    label="Barrato"
                    pressed={!!active.strike}
                    icon={<FiStrikethroughIcon />}
                    onClick={() => cmd("strikeThrough")}
                />

                <Divider />

                <ToolbarButton
                    label="Titolo H1"
                    pressed={!!active.h1}
                    icon={<FiTypeIcon />}
                    onClick={() => formatBlock("H1")}
                />
                <ToolbarButton
                    label="Titolo H2"
                    pressed={!!active.h2}
                    icon={<FiTypeIcon className="scale-90" />}
                    onClick={() => formatBlock("H2")}
                />

                <Divider />

                <ToolbarButton
                    label="Elenco puntato"
                    pressed={!!active.ul}
                    icon={<FiListIcon />}
                    onClick={() => cmd("insertUnorderedList")}
                />
                <ToolbarButton
                    label="Elenco numerato"
                    pressed={!!active.ol}
                    icon={<FiListOlIcon />}
                    onClick={() => cmd("insertOrderedList")}
                />
                <ToolbarButton
                    label="Citazione"
                    pressed={!!active.quote}
                    icon={<FiQuoteIcon />}
                    onClick={() => formatBlock("BLOCKQUOTE")}
                />
                <ToolbarButton
                    label="Blocco di codice"
                    pressed={!!active.code}
                    icon={<FiCodeIcon />}
                    onClick={() => formatBlock("PRE")}
                />

                <Divider />

                <ToolbarButton label="Link (Ctrl/Cmd+K)" pressed={false} icon={<FiLinkIcon />} onClick={onLink} />
                <ToolbarButton label="Pulisci formattazione" pressed={false} icon={<FiTrash2Icon />} onClick={removeFormatting} />

                <div className="ml-auto flex items-center gap-1">
                    <ToolbarButton label="Annulla" pressed={false} icon={<FiRotateCcwIcon />} onClick={doUndo} />
                    <ToolbarButton label="Ripristina" pressed={false} icon={<FiRotateCwIcon />} onClick={doRedo} />
                </div>
            </div>

            {/* Editor */}
            <div className="relative h-full">
                {/* Placeholder overlay */}
                {isEmpty && (
                    <div className="pointer-events-none absolute left-3 top-3 text-sm text-gray-400">
                        {placeholder}
                    </div>
                )}

                <div
                    ref={editableRef}
                    className="prose-sm max-w-none focus:outline-none px-3 py-3 text-gray-900 dark:text-gray-100 text-sm
                        absolute h-full max-h-full w-full min-h-[140px] overflow-auto
                        [&_img[data-rte-img='1']]:max-w-full [&_img[data-rte-img='1']]:h-auto [&_img[data-rte-img='1']]:align-middle"
                    //style={{ maxHeight }}
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onKeyDown={onKeyDown}
                    onKeyUp={recalcActive}
                    onMouseUp={recalcActive}
                    onClick={recalcActive}
                    onFocus={recalcActive}
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Editor di testo"
                />
            </div>

            {/* Modal Link */}
            <AnimatePresence>
                {linkUI.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 grid place-items-center bg-black/30"
                    >
                        <motion.div
                            initial={{ y: 12, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 12, opacity: 0 }}
                            className="w-[min(520px,92vw)] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Inserisci link</h4>
                                <button
                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={() => setLinkUI({ open: false, url: "" })}
                                    aria-label="Chiudi"
                                >
                                    <FiXIcon />
                                </button>
                            </div>
                            <input
                                autoFocus
                                type="url"
                                placeholder="https://…"
                                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm 
                                text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                                value={linkUI.url}
                                onChange={(e) => setLinkUI((s) => ({ ...s, url: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") applyLink();
                                }}
                            />
                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setLinkUI({ open: false, url: "" })}
                                >
                                    Annulla
                                </button>
                                <button
                                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={applyLink}
                                >
                                    Applica
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(RichTextEditor);

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------
const ToolbarButton = memo(function ToolbarButton({
    label,
    pressed,
    onClick,
    icon,
}: {
    label: string;
    pressed: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            title={label}
            onClick={onClick}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors
                ${pressed
                    ? "bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
        >
            {icon}
        </button>
    );
});

const Divider = () => (
    <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" aria-hidden />
);

// -----------------------------------------------------------------------------
// DOM helpers
// -----------------------------------------------------------------------------
function nearestTag(el: HTMLElement | null, tags: string[]): string | null {
    if (!el) return null;
    const set = new Set(tags);
    let cur: HTMLElement | null = el;
    while (cur && cur.nodeType === 1) {
        if (set.has(cur.tagName)) return cur.tagName;
        cur = cur.parentElement;
    }
    return null;
}

function hardenLinksInSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer as HTMLElement;
    const root = container.nodeType === 1 ? container : container.parentElement;
    if (!root) return;
    root.querySelectorAll("a[href]").forEach((a) => {
        (a as HTMLAnchorElement).target = "_blank";
        (a as HTMLAnchorElement).rel = "noopener noreferrer";
    });
}

function unwrapTagsInSelection(tagName: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer as HTMLElement;
    const root = container.nodeType === 1 ? container : container.parentElement;
    if (!root) return;
    root.querySelectorAll(tagName).forEach((el) => {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
    });
}

function escapeHtml(text: string) {
    const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (ch) => map[ch]);
}