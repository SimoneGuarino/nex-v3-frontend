import * as React from "react";
import { buildPdfThumbUrl } from "layouts/documentiPDF/lib/openPdf";
import { VscPreview } from "react-icons/vsc";

const VscPreviewIcon = VscPreview as React.FC<{ size?: number; className?: string }>;

export const DocPreview: React.FC<{
    name: string;
    company: "FOCELDA" | "IOT";
    className?: string;
    style?: React.CSSProperties;
    page?: number;
    w?: number;
    ratio?: number; // es. 0.707 (A4 W/H) per evitare layout shift
}> = ({ name, company, className, style, page = 1, w = 320, ratio = 0.707 }) => {
    const [src, setSrc] = React.useState<string>("");
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);

    // reset stato quando cambia documento (evita artefatti)
    React.useEffect(() => {
        setSrc("");
        setLoaded(false);
        setError(false);
    }, [name, company, page, w]);

    React.useEffect(() => {
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setSrc(buildPdfThumbUrl({ fileName: name, company, page, w }));
                io.disconnect();
            }
        }, { rootMargin: "200px" });

        if (ref.current) io.observe(ref.current);
        return () => io.disconnect();
    }, [name, company, page, w]);

    return (
        <div ref={ref} className={className} style={{ ...style }}>
            <div
                className="relative w-full h-full overflow-hidden rounded-xl bg-gray-100 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-800"
            >
                {!loaded && !error && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-200/40 to-neutral-300/30 dark:from-neutral-700/30 dark:to-neutral-800/30" />
                )}

                {src && !error && (
                    <img
                        src={src}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setLoaded(true)}
                        onError={() => setError(true)}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-none object-top transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
                    />
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-xs gap-2">
                        <VscPreviewIcon size={28} className="text-neutral-300 dark:text-neutral-700" />
                        <span>Anteprima non disponibile</span>
                    </div>
                )}
            </div>
        </div>
    );
};