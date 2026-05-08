import { useCallback, useMemo, useState } from "react";
import type { ObjectIdString } from "../../model/types";

export interface CanvasSelectionApi {
    selectedIds: ObjectIdString[];
    selectedIdsSet: Set<ObjectIdString>;
    hasSelection: boolean;
    isSelected: (id: ObjectIdString) => boolean;
    toggle: (id: ObjectIdString) => void;
    selectOnly: (id: ObjectIdString) => void;
    clear: () => void;
    setMany: (ids: ObjectIdString[]) => void;
}

export function useCanvasSelection(initialIds: ObjectIdString[] = []): CanvasSelectionApi {
    const [selectedIds, setSelectedIds] = useState<ObjectIdString[]>(() => [...new Set(initialIds)]);

    const selectedIdsSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const toggle = useCallback((id: ObjectIdString) => {
        setSelectedIds((current) => {
            if (current.includes(id)) return current.filter((item) => item !== id);
            return [...current, id];
        });
    }, []);

    const selectOnly = useCallback((id: ObjectIdString) => {
        setSelectedIds((current) => (current.length === 1 && current[0] === id ? current : [id]));
    }, []);

    const clear = useCallback(() => {
        setSelectedIds((current) => (current.length === 0 ? current : []));
    }, []);

    const setMany = useCallback((ids: ObjectIdString[]) => {
        const unique = [...new Set(ids)];
        setSelectedIds((current) => {
            if (current.length === unique.length && current.every((item, index) => item === unique[index])) {
                return current;
            }
            return unique;
        });
    }, []);

    const isSelected = useCallback((id: ObjectIdString) => selectedIdsSet.has(id), [selectedIdsSet]);

    return {
        selectedIds,
        selectedIdsSet,
        hasSelection: selectedIds.length > 0,
        isSelected,
        toggle,
        selectOnly,
        clear,
        setMany,
    };
}
