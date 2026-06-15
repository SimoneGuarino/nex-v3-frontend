import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import React from "react";
import {
    FiPenTool, FiRotateCcw, FiTrash2, FiDownload, FiShare2
} from "react-icons/fi";
import { TfiEraser } from "react-icons/tfi";

const FiPenToolIcon = FiPenTool as React.FC<{ className?: string }>;
const FiEraserIcon = TfiEraser as React.FC<{ className?: string }>;
const FiRotateCcwIcon = FiRotateCcw as React.FC<{ className?: string }>;
const FiTrash2Icon = FiTrash2 as React.FC<{ className?: string }>;
const FiDownloadIcon = FiDownload as React.FC<{ className?: string }>;
const FiShareIcon = FiShare2 as React.FC<{ className?: string }>;

/** Persistenza */
const LS_KEY = "smartdash.papernote.v1";

/** Un tratto: lista di punti in coordinate canvas */
type Point = { x: number; y: number };
type Stroke = {
    tool: "pen" | "eraser";
    color: string;     // usato solo per "pen"
    size: number;      // px
    points: Point[];
};

type PaperNoteState = {
    title: string;
    text: string;
    strokes: Stroke[];
    updatedAt: number;
};

/** palette colori penna */
const PALETTE = ["#6EE7B7", "#60A5FA", "#F59E0B", "#A78BFA", "#F87171", "#10B981"];

/* UTILS per esportazione RTF */
function rtfEscape(text: string): string {
    return (text ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}")
        // CR/LF → \line (oppure \par)
        .replace(/\r\n|\r|\n/g, "\\line ");
}

// DataURL (PNG) → Uint8Array
function dataURLToUint8Array(dataURL: string): Uint8Array {
    const base64 = dataURL.split(",")[1] || "";
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

// Byte array → stringa esadecimale (per RTF \pict)
function bytesToHex(bytes: Uint8Array): string {
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
        const h = bytes[i].toString(16).padStart(2, "0");
        out += h;
    }
    return out;
}

// px → twip (1 twip = 1/1440 inch; ~15 twip @ 96 DPI)
const pxToTwip = (px: number) => Math.round(px * 15);

function useDPRCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
    const setup = React.useCallback(() => {
        const c = canvasRef.current; if (!c) return;
        const dpr = Math.max(1, window.devicePixelRatio || 1);

        // Misura le dimensioni CSS REALI del canvas
        const rect = c.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));

        // Imposta la risoluzione interna coerente col DPR
        // (non tocchiamo più c.style.width/height: li governa il CSS)
        c.width = Math.floor(width * dpr);
        c.height = Math.floor(height * dpr);

        const ctx = c.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // coord = CSS px
        return { ctx, width, height };
    }, [canvasRef]);

    return { setup };
}

function drawAll(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const s of strokes) {
        if (s.points.length === 0) continue;
        ctx.save();
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = s.size;
        if (s.tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = s.color;
        }
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
            const p = s.points[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

export default function PaperNoteWidget() {
    const [state, setState] = React.useState<PaperNoteState>(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) return JSON.parse(raw) as PaperNoteState;
        } catch { }
        return {
            title: "My notes",
            text: "",
            strokes: [],
            updatedAt: Date.now(),
        };
    });

    const [askClear, setAskClear] = React.useState(false);

    React.useEffect(() => {
        try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { }
    }, [state]);

    const liveStroke = React.useRef<Stroke | null>(null);
    const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const { setup } = useDPRCanvas(canvasRef);

    // tool UI
    const [drawMode, setDrawMode] = React.useState(false);
    const [tool, setTool] = React.useState<"pen" | "eraser">("pen");
    const [color, setColor] = React.useState(PALETTE[0]);
    const [size, setSize] = React.useState(6);

    // redraw on resize / state change
    const redraw = React.useCallback(() => {
        const cfg = setup(); if (!cfg) return;
        drawAll(cfg.ctx, state.strokes);
    }, [setup, state.strokes]);

    React.useEffect(() => {
        redraw();
        const onResize = () => redraw();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [redraw]);

    React.useEffect(() => {
        const cfg = setup(); if (!cfg) return;
        ctxRef.current = cfg.ctx;
        drawAll(cfg.ctx, state.strokes); // redraw persistiti
    }, [setup, state.strokes]);

    const beginStroke = (p: Point) => {
        liveStroke.current = { tool, color, size, points: [p] };
    };

    const extendStroke = (p: Point) => {
        const s = liveStroke.current, ctx = ctxRef.current; if (!s || !ctx) return;
        const prev = s.points[s.points.length - 1];
        s.points.push(p);
        // disegna SOLO il nuovo segmento
        ctx.save();
        ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = s.size;
        ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = s.tool === "eraser" ? "rgba(0,0,0,1)" : s.color;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.restore();
    };

    const commitStroke = () => {
        const s = liveStroke.current; if (!s) return;
        setState(prev => ({ ...prev, strokes: [...prev.strokes, s], updatedAt: Date.now() }));
        liveStroke.current = null;
    };


    // drawing handlers
    const drawing = React.useRef<{ active: boolean; last?: Point } | null>(null);

    const pointerPos = (e: React.PointerEvent) => {
        const c = canvasRef.current!;
        const rect = c.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        const p = pointerPos(e);
        drawing.current = { active: true, last: p };

        // start new stroke
        const s: Stroke = {
            tool,
            color,
            size,
            points: [p],
        };
        setState((prev) => ({ ...prev, strokes: [...prev.strokes, s], updatedAt: Date.now() }));
        beginStroke(p);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!drawing.current?.active) return;
        const p = pointerPos(e);
        setState((prev) => {
            const strokes = prev.strokes.slice();
            const curr = strokes[strokes.length - 1];
            if (!curr) return prev;
            curr.points.push(p);
            return { ...prev, strokes };
        });
        extendStroke(p);
    };

    const endStroke = () => {
        drawing.current = { active: false };
        commitStroke();
    };

    const undo = () =>
        setState((prev) => ({ ...prev, strokes: prev.strokes.slice(0, -1), updatedAt: Date.now() }));

    const exportPNG = () => {
        const c = canvasRef.current!; if (!c) return;
        const url = c.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url; a.download = "paper-note.png"; a.click();
    };

    const exportRTF = () => {
        const title = (state.title ?? "Note").trim();
        const edited = editedLabel ?? ""; // se hai già la label tipo "Modificato il …"
        const body = state.text ?? "";

        // Parte immagine: se ci sono tratti, catturo il canvas in PNG
        const canvas = canvasRef?.current as HTMLCanvasElement | null;
        let pict = ""; // blocco \pict per RTF, eventualmente vuoto

        if (canvas && (state.strokes?.length ?? 0) > 0) {
            // Usa dimensioni del canvas (non CSS) per evitare scaling strani
            const wPx = canvas.width;
            const hPx = canvas.height;

            const dataURL = canvas.toDataURL("image/png");
            const pngBytes = dataURLToUint8Array(dataURL);
            const hex = bytesToHex(pngBytes);

            const picwgoal = pxToTwip(wPx);
            const pichgoal = pxToTwip(hPx);

            // Nota: \pngblip indica che i bytes sono un PNG
            // Word è tollerante: basta \pngblip + hex, picwgoal/pichgoal impostano la resa
            pict =
                `\\par \\par {\\pard\\qc \\b Disegno\\b0\\par}` + // piccolo titolo centrato
                `{\\pict\\pngblip\\picwgoal${picwgoal}\\pichgoal${pichgoal}\n` +
                hex.replace(/(.{128})/g, "$1\n") + // va a capo ogni tot per non avere righe infinite
                `}\n`;
        }

        // Header RTF minimale + font table
        const rtfHeader = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\n`;
        const rtfTitle = `{\\pard\\sa200\\sb200\\fs36\\b ${rtfEscape(title)}\\b0\\par}\n`;
        const rtfMeta = edited ? `{\\pard\\fs20\\i ${rtfEscape(edited)}\\i0\\par}\n` : "";
        const rtfBody = `{\\pard\\fs24 ${rtfEscape(body)}\\par}\n`;
        const rtfFooter = `}`;

        const rtf = rtfHeader + rtfTitle + rtfMeta + rtfBody + pict + rtfFooter;

        const blob = new Blob([rtf], { type: "application/rtf;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // .doc o .rtf: entrambi si aprono in Word; uso .doc per familiarità utente
        a.download = `${title || "note"}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const editedLabel = new Intl.DateTimeFormat("it-IT", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(new Date(state.updatedAt));

    // ridisegna quando aggiungiamo punti
    React.useEffect(() => {
        const cfg = setup(); if (!cfg) return;
        drawAll(cfg.ctx, state.strokes);
    }, [state.strokes, setup]);

    return (
        <div className="relative h-full">
            {/* stack di fogli dietro (decorazione) */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-2 right-2 top-2 h-[96%] rounded-xl bg-white/50 dark:bg-neutral-800/50" />
                <div className="absolute left-4 right-4 top-4 h-[92%] rounded-xl bg-white/40 dark:bg-neutral-800/40" />
            </div>

            {/* foglio */}
            <div
                className="flex flex-col 
                dark:text-gray-200 text-neutral-900
                dark:bg-neutral-900 h-full"
                style={{
                    backgroundImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "40px 40px, 40px 40px",
                }}
            >
                {/* header foglio */}
                <div className="flex flex-wrap items-center justify-between px-4 pt-4">
                    {/* titolo */}
                    <div className="mb-4">
                        <input
                            value={state.title}
                            onChange={(e) => setState((s) => ({ ...s, title: e.target.value, updatedAt: Date.now() }))}
                            className="w-full max-w-[360px] bg-transparent text-base font-semibold outline-none"
                        />
                        <div className="text-xs text-neutral-500">Modificato {editedLabel}</div>
                    </div>

                    {/* strumenti */}
                    <div className="flex flex-wrap items-center gap-2 pb-2">
                        {/* controlli penna */}
                        <div className="hidden sm:flex items-center gap-1 rounded-md border 
                        border-neutral-200 bg-white/70 
                        dark:border-neutral-800 dark:bg-neutral-800/70 px-2 py-1">
                            <FiPenToolIcon className={` ${tool === "pen" ? "text-emerald-600" : "text-neutral-500"}`} />
                            <label className="text-xs text-neutral-700">Penna</label>
                            <input
                                type="range" min={2} max={18} value={size}
                                onChange={(e) => setSize(Number(e.target.value))}
                                className="mx-2 h-1 w-24 accent-emerald-500"
                                title="Spessore"
                            />
                        </div>
                        {/* controlli gomma */}
                        <div className="flex items-center gap-1 rounded-md 
                            border border-neutral-200 bg-white/70 
                            dark:border-neutral-800 dark:bg-neutral-800/70 px-2 py-1"
                        >
                            <button
                                onClick={() => setTool("pen")}
                                className={`rounded p-1 ${tool === "pen" ? "bg-emerald-500/20 text-emerald-700" : "text-neutral-600 hover:bg-black/5"}`}
                                title="Penna"
                            ><FiPenToolIcon /></button>
                            <button
                                onClick={() => setTool("eraser")}
                                className={`rounded p-1 ${tool === "eraser" ? "bg-neutral-900/10 text-neutral-800" : "text-neutral-600 hover:bg-black/5"}`}
                                title="Gomma"
                            ><FiEraserIcon /></button>
                            <button
                                onClick={() => setDrawMode(v => !v)}
                                className={`rounded px-2 py-1 text-xs ml-2 ${drawMode
                                    ? "bg-emerald-500/20 text-emerald-700 border border-emerald-400/40"
                                    : "text-neutral-600 hover:bg-black/5 border border-neutral-200 bg-white/70 dark:border-neutral-700 dark:bg-neutral-800/70"
                                    }`}
                                title={drawMode ? "Modalità disegno attiva" : "Attiva modalità disegno"}
                            >
                                {drawMode ? "Disegno: ON" : "Disegno: OFF"}
                            </button>
                        </div>

                        {/* controlli colore */}
                        <div className="hidden sm:flex items-center gap-1 rounded-md 
                            border border-neutral-200 bg-white/70 
                            dark:border-neutral-800 dark:bg-neutral-800/70 px-2 py-1"
                        >
                            {PALETTE.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => { setColor(c); setTool("pen"); }}
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: c, outline: color === c ? "2px solid rgba(0,0,0,0.2)" : "none" }}
                                    title={c}
                                />
                            ))}
                        </div>

                        {/* controlli operazioni */}
                        <div>
                            <button onClick={undo} className="rounded p-2 text-neutral-600 hover:bg-black/5"
                                data-tooltip-id="general-dashboard-tooltip" data-tooltip-content="Annulla l'ultima azione"><FiRotateCcwIcon /></button>

                            <button onClick={() => setAskClear(true)} className="rounded p-2 text-red-600/80 hover:bg-red-500/10"
                                data-tooltip-id="general-dashboard-tooltip" data-tooltip-content="Pulisci completamente il foglio"><FiTrash2Icon /></button>

                            <button onClick={exportRTF} className="rounded p-2 text-neutral-600 hover:bg-black/5"
                                data-tooltip-id="general-dashboard-tooltip" 
                                data-tooltip-content="Esporta tutto"><FiDownloadIcon /></button>

                            <button className="rounded p-2 text-neutral-600 opacity-40 hover:bg-black/5"
                                data-tooltip-id="general-dashboard-tooltip" 
                                data-tooltip-content="[In Sviluppo] Condividi le note con gli altri utenti"><FiShareIcon /></button>
                        </div>
                    </div>
                </div>

                {/* superficie unica: testo + canvas sopra */}
                <div
                    className=" px-4 pb-4 h-full relative bg-white/60 dark:border-neutral-800 dark:bg-neutral-900 h-full"
                    style={{ minHeight: 260 }}
                >
                    {/* Layer TESTO (base) */}
                    <div
                        contentEditable={!drawMode}
                        suppressContentEditableWarning
                        onInput={(e) => {
                            const html = (e.currentTarget as HTMLDivElement).innerText; // testo puro
                            setState((s) => ({ ...s, text: html, updatedAt: Date.now() }));
                        }}
                        onPaste={(e) => {
                            // incolla solo testo semplice
                            e.preventDefault();
                            const text = e.clipboardData.getData("text/plain");
                            document.execCommand("insertText", false, text);
                        }}
                        className={`absolute inset-0 overflow-auto p-3 text-sm outline-none ${drawMode ? "cursor-crosshair select-none" : "cursor-text"
                            }`}
                        // inizializza il contenuto quando monta o quando cambia il titolo
                        ref={el => {
                            if (!el) return;
                            // evita di reimpostare ad ogni render
                            if (el.dataset._inited) return;
                            el.innerText = state.text || "";
                            el.dataset._inited = "1";
                        }}
                        aria-label="Area di scrittura"
                    />

                    {/* Layer CANVAS (sopra) */}
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 block w-full !h-full touch-none
                                ${drawMode ? "pointer-events-auto" : "pointer-events-none"
                            }`}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endStroke}
                        onPointerCancel={endStroke}
                        onPointerLeave={endStroke}
                        aria-label="Area di disegno"
                    />

                    {/* Hint modalità */}
                    <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-white/70 
                        dark:bg-neutral-700 px-2 py-1 text-[10px] text-neutral-600 dark:text-neutral-300">
                        {drawMode ? "Disegno attivo — trascina per disegnare" : "Scrittura — clicca per inserire testo"}
                    </div>
                </div>
            </div>

            {/* modale */}
            {askClear && (
                <div className="fixed inset-0 z-1 grid place-items-center bg-black/40 rounded-2xl backdrop-blur-xs">
                    <FDBox radius="xl" pad="md" /*className="rounded-xl bg-white dark:bg-neutral-800 p-4 shadow-xl"*/>
                        <p className="mb-3 text-sm">Vuoi davvero cancellare il disegno?</p>
                        <div className="flex gap-2 justify-end text-sm">
                            <FDButton
                                variant="outline"
                                color="error"
                                onClick={() => {
                                    setState((prev) => ({ ...prev, strokes: [], updatedAt: Date.now() }));
                                    setAskClear(false);
                                }}
                            >
                                Sì, cancella
                            </FDButton>
                            <FDButton
                                variant="soft"
                                color="neutral"
                                onClick={() => {
                                    setState((prev) => ({ ...prev, strokes: [], updatedAt: Date.now() }));
                                    setAskClear(false);
                                }}
                            >
                                Annulla
                            </FDButton>
                        </div>
                    </FDBox>
                </div>
            )}
        </div>
    );
}
