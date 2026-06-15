import React, { useContext, useEffect, useRef, useState } from "react";
import { AIContext } from "context/AIContext";

/**
 * Lazy reference to the global AI layout.
 *
 * `layouts/AI` is intentionally not imported statically by the Overview. The AI
 * surface is valuable, but it is also one of the heavier UI/runtime areas of NEX;
 * deferring it keeps dashboard KPIs and document previews responsive first.
 */
const EmbeddedAiLayout = React.lazy(async () => {
    const module = await import("layouts/AI");
    return { default: module.default as React.ComponentType<{ variant?: string }> };
});

type DeferredEmbeddedAiProps = {
    tenderId: string;
};

/**
 * Stable placeholder for the deferred AI card.
 *
 * It mirrors the final card proportions so the Overview grid does not jump when
 * the AI bundle becomes available or when the browser delays IntersectionObserver
 * callbacks under CPU pressure.
 */
function EmbeddedAiSkeleton() {
    return (
        <div className="flex h-full min-h-[320px] flex-col justify-end overflow-hidden rounded-[28px] border border-slate-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mx-auto mb-auto mt-16 flex w-full max-w-sm flex-col items-center text-center">
                <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-neutral-800" />
                <div className="mt-5 h-3 w-40 animate-pulse rounded-full bg-slate-100 dark:bg-neutral-800" />
                <div className="mt-3 h-8 w-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-neutral-800" />
            </div>
            <div className="mt-8 h-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-neutral-800" />
        </div>
    );
}

/**
 * Defers the heavy global AI layout inside the Overview dashboard card.
 *
 * The Overview is a high-density dashboard and should become interactive before
 * the embedded chat bundle/canvas is downloaded and mounted. The chat is loaded
 * when its card enters the viewport, preserving the user experience while
 * reducing initial work on office laptops, tablets and narrow screens.
 */
export function DeferredEmbeddedAi({ tenderId }: DeferredEmbeddedAiProps) {
    const { aiAttentionPulse } = useContext(AIContext);
    // Ref observed by IntersectionObserver. It is a ref, not state, because DOM
    // node identity must not trigger React renders while scrolling.
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Local mount gate for the heavy embedded chat. False means we keep only the
    // skeleton in the tree; true means the lazy AI layout can be resolved and mounted.
    const [shouldMount, setShouldMount] = useState(false);
    const [attentionActive, setAttentionActive] = useState(false);

    // A tender change must rebuild the embedded AI session boundary. Resetting the
    // mount gate prevents a previous tender conversation layout from being reused
    // while the new workspace is still settling.
    useEffect(() => {
        setShouldMount(false);
    }, [tenderId]);

    // Viewport-driven mount policy. We load the AI before it is fully visible
    // (`rootMargin`) so users perceive it as ready when they scroll to the card,
    // but we avoid paying that cost during the first dashboard render.
    useEffect(() => {
        const element = containerRef.current;
        if (!element || shouldMount) return;

        if (!("IntersectionObserver" in window)) {
            setShouldMount(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setShouldMount(true);
                    observer.disconnect();
                }
            },
            { root: null, rootMargin: "240px 0px", threshold: 0.01 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [shouldMount, tenderId]);

    useEffect(() => {
        if (!aiAttentionPulse) return;

        setShouldMount(true);
        setAttentionActive(true);
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

        const timer = window.setTimeout(() => setAttentionActive(false), 1200);
        return () => window.clearTimeout(timer);
    }, [aiAttentionPulse]);

    return (
        <div
            ref={containerRef}
            className={`h-full min-h-0 rounded-[32px] transition-all duration-500 ${attentionActive
                ? "ring-4 ring-violet-400/55 shadow-[0_0_0_8px_rgba(139,92,246,0.12),0_24px_70px_rgba(139,92,246,0.28)]"
                : "ring-0 ring-transparent"
                }`}
        >
            {shouldMount ? (
                <React.Suspense fallback={<EmbeddedAiSkeleton />}>
                    <EmbeddedAiLayout key={`mepa-overview-ai-${tenderId}`} variant="embedded" />
                </React.Suspense>
            ) : (
                <EmbeddedAiSkeleton />
            )}
        </div>
    );
}
