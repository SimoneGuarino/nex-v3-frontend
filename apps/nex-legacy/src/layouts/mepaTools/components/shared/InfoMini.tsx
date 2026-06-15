type InfoMiniProps = {
    /** Label shown above the value. It should describe the metric, not the data source. */
    label: string;
    /**
     * Already-formatted display value.
     *
     * Formatting stays outside this component so currency, date and status
     * normalization remain centralized in domain utilities instead of being
     * duplicated across small visual primitives.
     */
    value: string;
};

/**
 * Compact label/value row used in dense tender and product detail cards.
 *
 * The value is truncated to preserve grid stability on narrow screens. When a
 * caller needs full copyable content it should provide a tooltip or a detail
 * panel at feature level, not expand this primitive.
 */
export function InfoMini({ label, value }: InfoMiniProps) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-neutral-950">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1 truncate font-semibold">{value}</p>
        </div>
    );
}
