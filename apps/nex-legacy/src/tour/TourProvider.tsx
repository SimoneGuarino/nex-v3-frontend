//src\tour\TourProvider.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { lsKey, q, ensureFocusable, waitForSelector, waitForStableRect, installTourShield } from "./utils";
import { Role, Step } from "./types";
import { Popover } from "./components/Popover";
import { SpotlightOverlay } from "./components/SpotlightOverlay";
import { createPortal } from "react-dom";
import type { TourKey } from "./tours";

/* =========================
 * Types
 * =======================*/

type Cfg = {
    id: string;
    version: string;
    user: { id: string; role: Role };
    steps: Step[];
    keys?: TourKey[] | TourKey;
    autoStart?: boolean;
    autoStartDelay?: number;
    actions?: { [stepIndex: number]: (currStep?: number, skip?: (to: number) => void, reqFromBack?: any) => void };
};

type Ctx = {
    isOpen: boolean;
    index: number;
    activeKey?: TourKey;
    activeKeys?: TourKey[];
    activeStepSelector?: string;
    open: (cfg: Cfg) => void;
    startIfNeeded: (cfg: Cfg) => void;
    close: () => void;
    next: () => void;
    prev: () => void;
    reset: (id: string, version: string, userId: string) => void;
};

/* =========================
 * Context / Hook
 * =======================*/

// ✅ esportato per poter fare useContext(TourCtx) in componenti riusabili (es. FDSelect)
export const TourCtx = createContext<Ctx | null>(null);

export const useTour = () => {
    const ctx = useContext(TourCtx);
    if (!ctx) throw new Error("useTour must be used within TourProvider");
    return ctx;
};

/* =========================
 * Helpers
 * =======================*/

function setupKeybindings(handlers: {
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}) {
    const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") handlers.onClose();
        if (e.key === "ArrowRight") handlers.onNext();
        if (e.key === "ArrowLeft") handlers.onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
}

function attachAdvanceOnListener(step: Step, onAdvance: () => void) {
    if (!step.advanceOn) return () => { };

    const targetSelector = step.advanceOn.selector ?? step.selector;
    const eventName = step.advanceOn.event ?? "click";

    let disposed = false;
    let timer: number | null = null;
    let attachedEl: HTMLElement | null = null;

    const handler = async () => {
        if (step.afterAdvanceWaitFor) {
            await waitForSelector(step.afterAdvanceWaitFor);
        }
        onAdvance();
    };

    const tryAttach = () => {
        if (disposed) return;
        const el = q(targetSelector || "");
        if (el) {
            attachedEl = el;
            el.addEventListener(eventName as any, handler, { once: true });
        } else {
            timer = window.setTimeout(tryAttach, 50);
        }
    };

    tryAttach();

    return () => {
        disposed = true;
        if (timer) window.clearTimeout(timer);
        if (attachedEl) attachedEl.removeEventListener(eventName as any, handler);
    };
}

function setupAutoRelayout(trigger: () => void) {
    const ro = new ResizeObserver(trigger);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", trigger, true);
    return () => {
        ro.disconnect();
        window.removeEventListener("scroll", trigger, true);
    };
}

/* =========================
 * Provider
 * =======================*/

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [layerVisible, setLayerVisible] = useState(false);
    const prepSeqRef = useRef(0);

    const [isOpen, setIsOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [nextLocked, setNextLocked] = useState(false);
    const [_, force] = useState(0);
    const rerender = () => force((x) => x + 1);

    // ✅ nuovo: chiave/i del tour attivo, esposte ai componenti
    const [activeKey, setActiveKey] = useState<TourKey | undefined>(undefined);
    const [activeKeys, setActiveKeys] = useState<TourKey[] | undefined>(undefined);

    const activeCfgRef = useRef<Cfg | null>(null);

    const keydownCleanupRef = useRef<(() => void) | null>(null);
    const advanceCleanupRef = useRef<(() => void) | null>(null);

    const currentIndexRef = useRef(0);
    useEffect(() => { currentIndexRef.current = index; }, [index]);

    const later = (fn: any) => window.setTimeout(fn, 0);

    const activeStepSelector =
        isOpen ? activeCfgRef.current?.steps?.[index]?.selector : undefined;

    async function prepareAndFocus(
        step?: Step,
        forceRerender?: () => void,
        actions?: { [stepIndex: number]: (currStep?: number, skip?: (to: number) => void, reqFromBack?: boolean) => void },
        reqFromBack?: boolean
    ) {
        const seq = ++prepSeqRef.current;
        setLayerVisible(false);

        if (!step) { setLayerVisible(true); return; }

        const skipTo = (to: number) => {
            const cfg = activeCfgRef.current;
            if (!cfg) return;
            const max = cfg.steps.length - 1;
            const target = Math.max(0, Math.min(max, to | 0));

            advanceCleanupRef.current?.();
            advanceCleanupRef.current = null;
            setNextLocked(false);
            setIndex(target);
            prepareAndFocus(cfg.steps[target], forceRerender, cfg.actions);
        };

        const jump_toSkip = (to: any) => later(() => skipTo(to));

        const cfgNow = activeCfgRef.current;
        const currIdx = cfgNow && step ? Math.max(0, cfgNow.steps.indexOf(step)) : index;

        if (actions) {
            const actionFn = actions[currIdx];
            if (typeof actionFn === "function") {
                try {
                    actionFn(currIdx, jump_toSkip, reqFromBack);
                } catch (e) {
                    console.warn("Tour action error at step", currIdx, e);
                }
            }
        }

        const w = window as any;
        const ui = w.__fdUI;

        if (ui && step?.selector) {
            if (step.selector === '[data-tour="global-tour-entry"]') {
                ui.setMenuAutoLock(true);
                ui.setTourModal(false);
                ui.setUserMenu(false);
            } else if (step.selector === '.tour-menu-start') {
                ui.setMenuAutoLock(true);
                ui.setTourModal(false);
                ui.setUserMenu(true);
            } else if (step.selector === '[data-tour="tour-modal-start"]') {
                ui.setMenuAutoLock(true);
                ui.setTourModal(true);

                const isLastStep = cfgNow && currIdx === cfgNow.steps.length - 1;
                ui.setUserMenu(!isLastStep);
            }
        }

        if (step.enterWaitFor) {
            await waitForSelector(step.enterWaitFor, { timeout: 1200 });
        }

        if (step.enterDelayMs) {
            await new Promise((r) => setTimeout(r, step.enterDelayMs));
        }

        if (step.selector) {
            await waitForStableRect(step.selector, { timeout: 300, samples: 3, gapMs: 32 });
            if (seq !== prepSeqRef.current) return;

            const el = q(step.selector);
            if (el) {
                ensureFocusable(el);
                try { el.focus({ preventScroll: true }); } catch { }
                try { el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" }); } catch { }
            }
        }

        if (seq === prepSeqRef.current) {
            setLayerVisible(true);
            forceRerender?.();
        }
    }

    // ✅ helper: normalizza cfg.keys in [activeKey, activeKeys]
    const computeKeys = (keys?: TourKey[] | TourKey) => {
        if (!keys) return { k: undefined as TourKey | undefined, ks: undefined as TourKey[] | undefined };
        const arr = Array.isArray(keys) ? keys : [keys];
        return { k: arr[0], ks: arr };
    };

    const open = useCallback((cfg: Cfg) => {
        activeCfgRef.current = cfg;

        // ✅ setta activeKey/activeKeys PRIMA di aprire (così i componenti leggono subito)
        const { k, ks } = computeKeys(cfg.keys);
        setActiveKey(k);
        setActiveKeys(ks);

        setIndex(0);
        setIsOpen(true);

        prepareAndFocus(cfg.steps[0], rerender, cfg.actions);

        keydownCleanupRef.current?.();
        keydownCleanupRef.current = setupKeybindings({
            onPrev: () => prev(),
            onNext: () => next(),
            onClose: () => close(),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const close = useCallback(() => {
        const cfg = activeCfgRef.current;
        if (cfg) {
            localStorage.setItem(lsKey(cfg.user.id, cfg.id, cfg.version), JSON.stringify(true));
        }

        try {
            const ui = (window as any).__fdUI;
            if (ui) {
                ui.setMenuAutoLock(false);
                ui.setTourModal(false);
                ui.setUserMenu(false);
            }
        } catch { }

        setIsOpen(false);
        setIndex(0);

        // ✅ reset chiavi tour
        setActiveKey(undefined);
        setActiveKeys(undefined);

        keydownCleanupRef.current?.(); keydownCleanupRef.current = null;
        advanceCleanupRef.current?.(); advanceCleanupRef.current = null;
    }, []);

    const next = useCallback(() => {
        const cfg = activeCfgRef.current;
        if (!cfg) return;
        setIndex((i) => {
            const last = i >= cfg.steps.length - 1;
            const ni = last ? i : i + 1;
            prepareAndFocus(cfg.steps[ni], rerender, cfg.actions);
            return ni;
        });
    }, []);

    const prev = useCallback(() => {
        const cfg = activeCfgRef.current;
        if (!cfg) return;
        setIndex((i) => {
            const ni = Math.max(i - 1, 0);
            prepareAndFocus(cfg.steps[ni], rerender, cfg.actions, true);
            return ni;
        });
    }, []);

    const reset = useCallback((id: string, version: string, userId: string) => {
        localStorage.removeItem(lsKey(userId, id, version));
    }, []);

    const startIfNeeded = useCallback((cfg: Cfg) => {
        const done = JSON.parse(localStorage.getItem(lsKey(cfg.user.id, cfg.id, cfg.version)) || "false");
        if (!done) {
            const delay = cfg.autoStartDelay ?? 800;
            setTimeout(() => open(cfg), delay);
        }
    }, [open]);

    useEffect(() => {
        if (!isOpen) return;
        const cleanup = setupAutoRelayout(() => force((x) => x + 1));
        return cleanup;
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const cfg = activeCfgRef.current;
        if (!cfg) return;

        advanceCleanupRef.current?.();
        advanceCleanupRef.current = null;

        const step = cfg.steps[index];

        setNextLocked(!!step?.blockNextUntilAdvance);

        if (step?.advanceOn) {
            const attachIndex = index;
            advanceCleanupRef.current = attachAdvanceOnListener(step, () => {
                if (currentIndexRef.current !== attachIndex) return;
                setNextLocked(false);
                next();
            });
        }
    }, [isOpen, index, next]);

    const ctx = useMemo<Ctx>(() => ({
        isOpen,
        index,
        activeKey,
        activeKeys,
        activeStepSelector,
        open,
        startIfNeeded,
        close,
        next,
        prev,
        reset,
    }), [isOpen, index, activeKey, activeKeys, activeStepSelector, open, startIfNeeded, close, next, prev, reset]);

    const cfg = activeCfgRef.current;
    const step = cfg?.steps[index];
    const targetEl = step?.selector ? q(step.selector) : null;
    const total = cfg?.steps.length ?? 0;

    useEffect(() => {
        if (!isOpen || !layerVisible) return;

        const hasTarget = !!targetEl && targetEl.offsetWidth > 0 && targetEl.offsetHeight > 0;

        return installTourShield({
            targetEl: hasTarget ? targetEl : null,
            allowTarget: hasTarget,
            trapFocus: true,
        });
    }, [isOpen, index, targetEl, layerVisible]);

    return (
        <TourCtx.Provider value={ctx}>
            {children}
            {isOpen && cfg && step && layerVisible && createPortal(
                <>
                    <SpotlightOverlay target={targetEl} />
                    <Popover
                        target={targetEl}
                        side={step.side ?? "bottom"}
                        title={step.title}
                        description={step.description}
                        hint={step.hint}
                        index={index}
                        total={total}
                        onPrev={prev}
                        onNext={() => { if (index === total - 1) close(); else if (!nextLocked) next(); }}
                        onClose={close}
                        nextDisabled={nextLocked}
                    />
                </>,
                document.body
            )}
        </TourCtx.Provider>
    );
}