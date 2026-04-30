const HANDOFF_KEY = "nex_cross_app_loading";

export type CrossAppTarget = "survey" | "drive" | "access";

export function startCrossAppLoading(target: CrossAppTarget) {
    sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({
            active: true,
            target,
            startedAt: Date.now(),
        })
    );
};

export function readCrossAppLoading() {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    };
};

export function clearCrossAppLoading() {
    sessionStorage.removeItem(HANDOFF_KEY);
};