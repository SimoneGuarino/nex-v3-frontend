import React, { useLayoutEffect, useRef } from "react";
import nexLogoWhite from "assets/images/login/logo_nex_transp_white.webp";
import { Important } from "./UI/Important";

type Side = "top" | "bottom" | "left" | "right" | "center";

const GAP = 8;        // distanza dal target
const MARGIN = 16;    // margini dai bordi dello schermo
const MAX_W = 520;
const MIN_W = 300;
const MIN_H = 140;

export function Popover({
    target,
    side,
    title,
    description,
    index,
    total,
    onPrev,
    onNext,
    onClose,
    nextDisabled,
    hint,
    important,
}: {
    target: HTMLElement | null;
    side: Side;
    title?: React.ReactNode;
    description?: React.ReactNode;
    index: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
    nextDisabled?: boolean;
    hint?: React.ReactNode;
    important?: React.ReactNode;
}) {
    const floatingRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const node = floatingRef.current;
        if (!node) return;

        // Applica dimensioni base (servono per misurare)
        node.style.position = "fixed";
        node.style.maxWidth = `${MAX_W}px`;
        node.style.width = "min(90vw, 520px)";
        node.style.maxHeight = ""; // reset
        node.style.overflow = "";  // reset

        // funzione che posiziona e mantiene nei bounds
        const reposition = () => {
            if (!node) return;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const rect = target?.getBoundingClientRect() || null;

            // misura floating con layout corrente
            // (offsetWidth/Height includono padding/border)
            const fw = clamp(node.offsetWidth || MIN_W, MIN_W, MAX_W);
            const fhRaw = Math.max(node.offsetHeight || MIN_H, MIN_H);

            // caso "center" o target mancante: centra e limita entro viewport
            if (!rect || side === "center") {
                const w = Math.min(fw, vw - MARGIN * 2);
                const h = Math.min(fhRaw, vh - MARGIN * 2);
                node.style.maxHeight = `${vh - MARGIN * 2}px`;
                node.style.overflow = h < fhRaw ? "auto" : "visible";
                const left = clamp(vw / 2 - w / 2, MARGIN, vw - w - MARGIN);
                const top = clamp(vh / 2 - h / 2, MARGIN, vh - h - MARGIN);
                node.style.left = `${left}px`;
                node.style.top = `${top}px`;
                return;
            }

            // calcola spazi disponibili intorno al target
            const spaceTop = rect.y - MARGIN;
            const spaceBottom = vh - (rect.y + rect.height) - MARGIN;
            const spaceLeft = rect.x - MARGIN;
            const spaceRight = vw - (rect.x + rect.width) - MARGIN;

            // determina lato migliore (flip se non entra)
            const chosen = pickSide(side, {
                fw, fh: fhRaw, rect, spaceTop, spaceBottom, spaceLeft, spaceRight, vw, vh,
            });

            // posizionamento primario in base al lato scelto
            let left = 0, top = 0;

            if (chosen === "bottom") {
                top = rect.y + rect.height + GAP;
                left = rect.x + rect.width / 2 - fw / 2;
            } else if (chosen === "top") {
                top = rect.y - fhRaw - GAP;
                left = rect.x + rect.width / 2 - fw / 2;
            } else if (chosen === "left") {
                top = rect.y + rect.height / 2 - fhRaw / 2;
                left = rect.x - fw - GAP;
            } else if (chosen === "right") {
                top = rect.y + rect.height / 2 - fhRaw / 2;
                left = rect.x + rect.width + GAP;
            }

            // SHIFT orizzontale/verticale per restare nei bounds
            // 1) limita larghezza utile
            const maxWidthInside = vw - MARGIN * 2;
            node.style.maxWidth = `${Math.min(MAX_W, maxWidthInside)}px`;

            // 2) se l’altezza eccede, abilita scroll
            const maxHeightInside = vh - MARGIN * 2;
            node.style.maxHeight = `${maxHeightInside}px`;
            node.style.overflow = fhRaw > maxHeightInside ? "auto" : "visible";

            // 3) clamp finale
            left = clamp(left, MARGIN, vw - (node.offsetWidth || fw) - MARGIN);
            top = clamp(top, MARGIN, vh - (node.offsetHeight || fhRaw) - MARGIN);

            node.style.left = `${left}px`;
            node.style.top = `${top}px`;
        };

        // primo posizionamento dopo 2 RAF per assicurare misura corretta
        const raf1 = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(reposition);
            (reposition as any).__raf2 = raf2;
        });

        // auto-update su resize/scroll
        const onUpdate = () => reposition();
        const ro = new ResizeObserver(onUpdate);
        ro.observe(document.documentElement);
        if (target) ro.observe(target);

        window.addEventListener("resize", onUpdate, { passive: true });
        window.addEventListener("scroll", onUpdate, true); // cattura scroll di antenati

        return () => {
            cancelAnimationFrame(raf1);
            if ((reposition as any).__raf2) cancelAnimationFrame((reposition as any).__raf2);
            ro.disconnect();
            window.removeEventListener("resize", onUpdate);
            window.removeEventListener("scroll", onUpdate, true);
        };
    }, [target, side, index]); // riposiziona anche quando cambia step

    const isLast = index === total - 1;

    return (
        <div ref={floatingRef}
            data-tour-allow
            className="fixed z-[9999]"
            role="dialog"
            aria-modal="true"
            data-tour-layer="true"
        >
            <div className="w-[min(90vw,520px)] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 text-neutral-100 shadow-2xl backdrop-blur">
                <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <img src={nexLogoWhite} alt="" className="w-20" />
                    <div className="flex-1">
                        <div className="text-sm font-semibold">{title}</div>
                        <div className="text-xs text-neutral-400">Step {index + 1} / {total}</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-white/10 px-3 py-1 text-sm hover:bg-white/5"
                    >
                        Chiudi
                    </button>
                </header>

                <div className="px-4 py-3 text-sm leading-relaxed text-neutral-200">
                    {description}
                    {hint && (
                        <p className="mt-2 text-xs text-amber-300/90">{hint}</p>
                    )}
                    {important && (
                        <Important>{important}</Important>
                    )}
                    {!hint && !important && nextDisabled && (
                        <p className="mt-2 text-xs text-amber-300/90">
                            Suggerimento: clicca il pulsante evidenziato per continuare.
                        </p>
                    )}
                </div>

                <footer className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
                    <button
                        onClick={onPrev}
                        disabled={index === 0}
                        className="rounded-lg border border-white/10 px-3 py-1 text-sm text-neutral-200 hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                    >
                        Indietro
                    </button>
                    <button onClick={onNext} disabled={nextDisabled}
                        className={`rounded-lg bg-white px-3 py-1 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-40 
                            ${nextDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        {isLast ? "Fine" : "Avanti"}
                    </button>
                </footer>
            </div>
        </div>
    );
}

function clamp(v: number, a: number, b: number) {
    return Math.min(Math.max(v, a), b);
}

function pickSide(
    preferred: Side,
    ctx: {
        fw: number;
        fh: number;
        rect: DOMRect;
        spaceTop: number;
        spaceBottom: number;
        spaceLeft: number;
        spaceRight: number;
        vw: number;
        vh: number;
    }
): Side {
    // Se il lato preferito ha spazio sufficiente, tienilo
    if (preferred === "top" && ctx.spaceTop >= ctx.fh + GAP) return "top";
    if (preferred === "bottom" && ctx.spaceBottom >= ctx.fh + GAP) return "bottom";
    if (preferred === "left" && ctx.spaceLeft >= ctx.fw + GAP) return "left";
    if (preferred === "right" && ctx.spaceRight >= ctx.fw + GAP) return "right";

    // Altrimenti, scegli il lato opposto se c'è più spazio
    if (preferred === "top" || preferred === "bottom") {
        return ctx.spaceBottom >= ctx.spaceTop ? "bottom" : "top";
    } else if (preferred === "left" || preferred === "right") {
        return ctx.spaceRight >= ctx.spaceLeft ? "right" : "left";
    }

    // fallback
    return "bottom";
}
