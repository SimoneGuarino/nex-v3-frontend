//src\tour\useSectionTour.tsx
import { useEffect, useMemo } from "react";
import { useTour } from "./TourProvider";
import { getStepsFor, TourKey, Role } from "./tours";

export function useSectionTour({
    id, version, user, keys, autoStart = false, autoStartDelay = 800, actions
}: {
    id: string;
    version: string;
    user: { id: string; role: Role };
    keys: TourKey[] | TourKey;        // qui passi "dashboard" o ["dashboard","comparator"]
    autoStart?: boolean;
    autoStartDelay?: number;
    actions?: { [stepIndex: number]: (currStep?: number, skip?: (to: number) => void) => void };
}) {
    const tour = useTour();

    const steps: any = useMemo(() => getStepsFor(keys, user.role).map(s => ({
        selector: s.selector,
        title: s.title,
        description: s.description,
        hint: s.hint,
        important: s.important,
        side: s.side,
        advanceOn: s.advanceOn,
        afterAdvanceWaitFor: s.afterAdvanceWaitFor,
        blockNextUntilAdvance: s.blockNextUntilAdvance,
        enterWaitFor: s.enterWaitFor,
        enterDelayMs: s.enterDelayMs,
        onEnter: s.onEnter,
        onLeave: s.onLeave,
    })), [keys, user.role]);

    useEffect(() => {
        if (!autoStart) return;
        tour.startIfNeeded({ id, version, user, steps, keys, autoStart, autoStartDelay, actions });
    }, [id, version, user.id, user.role, steps, autoStart, autoStartDelay, actions]);

    //per tasto reset tour globale su navbar
    if (typeof window !== "undefined") {
        const w = window as any;

        w.__fdCurrentTourRestart = () => {
            // resetta lo stato "visto" di questo tour
            tour.reset(id, version, user.id);
            // e lo riapre subito dall'inizio
            tour.open({ id, version, user, steps, actions, keys });
        };

        // salviamo anche la pagina su cui questo tour è stato registrato
        w.__fdCurrentTourPath = window.location.pathname;
    }
    //

    return {
        start: () => tour.open({ id, version, user, steps, keys, actions: actions }),
        reset: () => tour.reset(id, version, user.id),
        isOpen: tour.isOpen,
        index: tour.index,
    };
}
