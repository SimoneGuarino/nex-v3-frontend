export type HeaderSettings = {
    className?: {
        labels?: string;
        main_container?: string;
    };
    /**
     * Callback opzionale per delegare il sort lato server.
     * sortDirection: 0 = reset, 1 = asc, 2 = desc
     */
    onSortChange?: (props: { columnKey: string; sortDirection: number }) => void | Promise<void>;
    /**
     * Stato sort corrente gestito esternamente (es. server-side),
     * usato per riallineare le icone dell'header dopo remount.
     */
    sortState?: {
        columnKey: string;
        sortDirection: number;
    };
}
