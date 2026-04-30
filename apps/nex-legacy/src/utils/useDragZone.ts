// useDragZone.ts
import { useState, useRef, DragEvent } from 'react';

export function useDragZone<T = any>(onFilesDrop: (files: File[], data: T) => void, data: T) {
    const [isOver, setIsOver] = useState(false);
    const counter = useRef(0);

    const onDragEnter = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (++counter.current === 1) setIsOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (--counter.current === 0) setIsOver(false);
    };
    const onDragOver = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
    };
    const onDrop = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        counter.current = 0; setIsOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFilesDrop(files, data);
    };

    return { isOver, handlers: { onDragEnter, onDragLeave, onDragOver, onDrop } };
}
