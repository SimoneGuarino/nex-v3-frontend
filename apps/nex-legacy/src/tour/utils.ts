// src/tour/utils.ts
export function lsKey(userId: string, tourId: string, ver: string) {
    return `tour:${tourId}:${ver}:user:${userId}`;
}

export function q(selector?: string): HTMLElement | null {
    if (!selector) return null;
    return document.querySelector(selector) as HTMLElement | null;
}

export function getRect(el: HTMLElement | null) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function ensureFocusable(el: HTMLElement | null) {
    if (!el) return;
    if (el.tabIndex < 0) el.tabIndex = 0;
}

export function waitForSelector(
    selector: string,
    { timeout = 3000, interval = 50 } = {}
): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
        const start = performance.now();

        const check = () => {
            const el = document.querySelector(selector) as HTMLElement | null;
            if (el) return resolve(el);
            if (performance.now() - start >= timeout) return resolve(null);
            setTimeout(check, interval);
        };

        check();
    });
}

// Attende che l’elemento esista e che la sua bounding box smetta di cambiare
export async function waitForStableRect(
    selector: string,
    { timeout = 800, samples = 3, gapMs = 32 } = {}
): Promise<HTMLElement | null> {
    const start = performance.now();

    // 1) aspetta che esista
    const el = await waitForSelector(selector, { timeout });
    if (!el) return null;

    // 2) campiona più volte la rect finché è stabile
    let last: DOMRect | null = null;
    let stableCount = 0;

    return new Promise((resolve) => {
        const tick = () => {
            const now = performance.now();
            if (now - start > timeout) return resolve(el);

            const r = el.getBoundingClientRect();
            const same =
                last &&
                Math.abs(r.x - last.x) < 0.5 &&
                Math.abs(r.y - last.y) < 0.5 &&
                Math.abs(r.width - last.width) < 0.5 &&
                Math.abs(r.height - last.height) < 0.5;

            stableCount = same ? stableCount + 1 : 0;
            last = r;

            if (stableCount >= samples) return resolve(el);
            setTimeout(tick, gapMs);
        };
        tick();
    });
}

// -------------------
// helper data-tour (scalabile)
// -------------------
export type ResolveDataToursOpts<K extends string, N extends string> = {
    scope: string; // es "filters"
    names: readonly N[];
    perKeyPrefix: Partial<Record<K, string>>; // es { documents:"docs", rubrica:"rubrica" }
    fallbackPrefix?: string; // default: "global"
};

/**
 * Ritorna SEMPRE stringhe "prefix-scope-name".
 * Se activeKey è undefined o non presente in perKeyPrefix -> usa fallbackPrefix.
 */
export function resolveDataTours<K extends string, N extends string>(
    activeKey: K | undefined,
    opts: ResolveDataToursOpts<K, N>
): Record<N, string> {
    const prefix = (activeKey && opts.perKeyPrefix[activeKey]) || opts.fallbackPrefix || "global";
    const out = {} as Record<N, string>;
    for (const n of opts.names) out[n] = `${prefix}-${opts.scope}-${n}`;
    return out;
}

//Blocco azioni esterne durante il tour-system
type ShieldOpts = { targetEl: HTMLElement | null; allowTarget?: boolean; trapFocus?: boolean };

const EV = ["pointerdown", "click", "contextmenu"] as const;

export function installTourShield({ targetEl, allowTarget = true, trapFocus = true }: ShieldOpts) {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const allowed = (n: EventTarget | null) =>
        n instanceof Element &&
        (n.closest("[data-tour-allow]") ||
            (allowTarget && targetEl && (n === targetEl || targetEl.contains(n))));

    const h = (e: Event) => {
        if (!allowed(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            (e as any).stopImmediatePropagation?.();
        }
    };
    EV.forEach((t) => document.addEventListener(t, h, true));

    const pop = () => document.querySelector("[data-tour-allow]") as HTMLElement | null;
    const fi = (e: FocusEvent) => {
        if (trapFocus && !allowed(e.target)) {
            e.preventDefault();
            (pop() || targetEl || document.body)?.focus?.({ preventScroll: true });
        }
    };
    const kd = (e: KeyboardEvent) => {
        if (trapFocus && e.key === "Tab" && !allowed(document.activeElement)) {
            e.preventDefault();
            (pop() || targetEl)?.focus?.();
        }
    };
    document.addEventListener("focusin", fi, true);
    document.addEventListener("keydown", kd, true);

    return () => {
        document.body.style.overflow = prev;
        EV.forEach((t) => document.removeEventListener(t, h, true));
        document.removeEventListener("focusin", fi, true);
        document.removeEventListener("keydown", kd, true);
    };
}
