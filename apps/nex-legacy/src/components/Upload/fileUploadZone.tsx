import { getFileIconData } from 'config/dist_avatars';
import { icon_close, icon_done } from 'config/icons';
import React, { useRef, useState, ChangeEvent, DragEvent } from 'react';
import { FileUploadItem } from 'types/files';
import * as FaIcons from "react-icons/fa";

interface FileUploadZoneProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<any>>;
    filesKey?: string; // chiave per identificare i file nel contesto
    allowedExtensions?: string[];    // es. ['XLS','XLSX']
    maxFileSizeMB?: number;          // es. 25
    onError?: (msg: string) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    files,
    setFiles,
    filesKey,
    allowedExtensions = ['XLS', 'XLSX', 'CSV', 'PDF', 'DOC', 'DOCX', 'TXT'],
    maxFileSizeMB = 25,
    onError
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragActive, setIsDragActive] = useState(false);

    /** Stato interno per la UI delle progress bar */
    const [items, setItems] = useState<FileUploadItem[]>([]);

    // quando la lettura finisce, aggiungo il file al parent-state
    const pushToParent = (file: File) => {
        setFiles((prev: any) => {
            if (prev.some((f: any) => f.name === file.name)) return prev;
            return [...prev, file];
        });
    };

    // ------------ VALIDAZIONE & AGGIUNTA ------------
    /** Elabora file: filtra estensioni/dimensioni e poi li legge con FileReader */
    const processFiles = (incoming: File[]) => {
        const valid = incoming.filter(f => {
            const ext = f.name.split('.').pop()?.toUpperCase() || '';
            if (!allowedExtensions.includes(ext)) {
                onError?.(`Estensione non supportata: ${f.name}`);
                return false;
            }
            if (f.size > maxFileSizeMB * 1024 * 1024) {
                onError?.(`File troppo grande: ${f.name}`);
                return false;
            }
            return true;
        });
        valid.forEach(file => {
            // inizializzo l'item in stato interno
            setItems((prev: any) => [
                ...prev,
                { file, progress: 0, status: 'loading' },
            ]);

            const reader = new FileReader();
            reader.onprogress = e => {
                if (e.lengthComputable) {
                    const prog = Math.round((e.loaded / e.total) * 100);
                    setItems(prev =>
                        prev.map(it =>
                            it.file === file ? { ...it, progress: prog } : it
                        )
                    );
                }
            };
            reader.onload = () => {
                // progress finale e status
                setItems(prev =>
                    prev.map(it =>
                        it.file === file
                            ? { ...it, progress: 100, status: 'done' }
                            : it
                    )
                );
                // ora che il file è in memoria, lo passo al parent
                pushToParent(file);
            };
            reader.onerror = () => {
                setItems(prev =>
                    prev.map(it =>
                        it.file === file ? { ...it, status: 'error' } : it
                    )
                );
                onError?.(`Errore nel caricamento: ${file.name}`);
            };
            // avvia la lettura in memoria
            reader.readAsArrayBuffer(file);
        });
    };

    // ------------ HANDLER DnD ------------
    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(true);
    };
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        // mantiene isDragActive = true
    };
    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(false);
    };
    const handleDrop = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(false);
        const dropped = Array.from(e.dataTransfer.files);
        processFiles(dropped);
    };

    // ------------ HANDLER CLICK/SELECT ------------
    const handleClick = () => inputRef.current?.click();
    const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        processFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    // ------------ VALIDAZIONE & AGGIUNTA ------------
    /*const processFiles = (incoming: File[]) => {
        const filtered = incoming.filter(f => {
            const ext = f.name.split('.').pop()?.toUpperCase() || '';
            if (!allowedExtensions.includes(ext)) {
                onError?.(`Estensione non supportata: ${f.name}`);
                return false;
            }
            if (f.size > maxFileSizeMB * 1024 * 1024) {
                onError?.(`File troppo grande: ${f.name}`);
                return false;
            }
            return true;
        });
        if (filtered.length) {
            setFiles((prev: any) => {
                // evita duplicati
                const uniques = filtered.filter(f => !prev.some((p: any) => p.name === f.name));
                return [...prev, ...uniques];
            });
        }
    };*/

    return (
        <div className="w-full">
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`
                  relative flex flex-col items-center justify-center
                  w-full h-48 !p-4 !mb-2
                  border-2 border-dashed rounded-lg
                  transition-colors duration-200 ease-in-out
                  ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white dark:bg-neutral-900'}
                  cursor-pointer
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={allowedExtensions.map(e => `.${e.toLowerCase()}`).join(',')}
                    className="hidden"
                    onChange={handleFilesSelected}
                />

                {/* Icona centrale */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-gray-400 !mb-2"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"
                    />
                </svg>

                {/* Testo */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Drag and Drop file here or{' '}
                    <span className="text-blue-600 underline">Choose file</span>
                </p>
            </div>

            {/* Footer info */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Supported formats: {allowedExtensions.join(', ')}</span>
                <span>Maximum size: {maxFileSizeMB} MB</span>
            </div>

            {/* ▶ LISTA PROGRESS */}
            <div className="!space-y-3 !mt-4">
                {items.map((it: FileUploadItem, idx: number) => {
                    const { iconName, colorClass } =
                        getFileIconData({ filename: it.file.name, type: it.file.type });
                    const RawIcon =
                        (FaIcons[iconName as keyof typeof FaIcons] as React.ElementType) ||
                        FaIcons.FaFile;

                    console.log({ filename: it.file.name, type: it.file.type });

                    return <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center bg-gray-100 dark:bg-neutral-800 rounded !p-2">
                            <div className="flex items-center gap-2">
                                <RawIcon className={`w-5 h-5 ${colorClass}`} />
                                <span className="truncate text-sm">{it.file.name} </span>
                            </div>
                            <span className="text-xs text-gray-500">
                                {it.status === 'loading'
                                    ? `${it.progress}%`
                                    : it.status === 'done'
                                        ? icon_done({ width: 22, height: 22, color: 'green' })
                                        : icon_close({ width: 22, height: 22, color: 'red' })}
                            </span>
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                            <div
                                className={`
                                    h-full rounded
                                    ${it.status === 'loading'
                                        ? 'bg-blue-500'
                                        : it.status === 'done'
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                    }
                                `}
                                style={{ width: `${it.progress}%` }}
                            />
                        </div>
                    </div>
                })}
            </div>
        </div>
    );
};
