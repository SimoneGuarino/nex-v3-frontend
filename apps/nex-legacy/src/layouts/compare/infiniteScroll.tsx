import { useEffect, useRef, useCallback } from "react";

type InfiniteScrollProps = {
    /** Callback invocata quando il sentinel entra in viewport */
    InfiniteScroll: () => void;

    /** Opzioni opzionali per IntersectionObserver */
    root?: Element | Document | null;
    rootMargin?: string;
    threshold?: number | number[];
};

export default function InfiniteScroll({
    InfiniteScroll: onLoadMore,
    root = null,
    rootMargin = "20px",
    threshold = 1,
}: InfiniteScrollProps) {
    const loaderRef = useRef<HTMLDivElement | null>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    onLoadMore();
                }
            }
        },
        [onLoadMore]
    );

    useEffect(() => {
        const options: IntersectionObserverInit = {
            root,
            rootMargin,
            threshold,
        };

        const observer = new IntersectionObserver(handleObserver, options);
        const node = loaderRef.current;

        if (node) observer.observe(node);

        return () => {
            if (node) observer.unobserve(node);
            observer.disconnect();
        };
    }, [root, rootMargin, threshold, handleObserver]);

    return (
        <div
            ref={loaderRef}
            style={{ height: "10px" }}
            aria-hidden="true"
        // questo div funge da "sentinel"
        />
    );
};