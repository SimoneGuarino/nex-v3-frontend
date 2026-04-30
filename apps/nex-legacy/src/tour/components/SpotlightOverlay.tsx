// src/tour/components/SpotlightOverlay.tsx
import { getRect } from "../utils";

export function SpotlightOverlay({ target, radius = 12, padding = 8, opacity = 0.55 }: {
    target: HTMLElement | null;
    radius?: number;
    padding?: number;
    opacity?: number;
}) {
    const r = getRect(target);
    const vw = window.innerWidth, vh = window.innerHeight;

    // target “center” quando non c’è selector
    const hole = r
        ? { x: Math.max(0, r.x - padding), y: Math.max(0, r.y - padding), w: r.w + padding * 2, h: r.h + padding * 2 }
        : { x: vw / 2 - 200, y: vh / 2 - 80, w: 400, h: 160 };

    return (
        <svg className="fixed inset-0 pointer-events-none z-[9998]" width={vw} height={vh} style={{ width: "100vw", height: "100vh" }}>
            <defs>
                <mask id="nex-tour-mask">
                    <rect x="0" y="0" width={vw} height={vh} fill="white" />
                    <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={radius} ry={radius} fill="black" />
                </mask>
            </defs>
            <rect x="0" y="0" width={vw} height={vh} fill={`rgba(0,0,0,${opacity})`} mask="url(#nex-tour-mask)" />
        </svg>
    );
};