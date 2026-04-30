import FDBox from "components/UI/box/FDBox";

interface SkeletonLoaderProps {
    count?: number;
    height?: number | string;
    className?: string;
}

/**
 * SkeletonLoader
 * - count: number of skeleton items to render
 * - variant: visual style of skeletons ("card" | "list" | "table")
 * - className: extra classes for the wrapper
 *
 * Usa tailwindcss (animate-pulse, bg-gray-200 / dark:bg-gray-700)
 */
export default function SkeletonLoader({
    count = 1,
    height = 360,
    className = "flex-wrap"
}: SkeletonLoaderProps) {
    if (!count || count <= 0) return null;

    const items = Array.from({ length: count });

    return (
        <FDBox variant='ghost'
            className={`w-full gap-4 flex dark:bg-neutral-800 ${className}`}
        >
            {items.map((_, i) => {
                return <div key={i} style={{height: `${height}px`}} className={`col-span-1 w-full 
                    md:w-[calc((100%-16px)/2)] xl:w-[calc((100%-64px)/4)] bg-gray-200 dark:bg-gray-700 rounded`} />;
            })}
        </FDBox>

    );
};