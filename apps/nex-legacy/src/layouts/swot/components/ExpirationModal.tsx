import { FileUploadZone } from 'components/Upload/fileUploadZone';
import { motion, AnimatePresence } from 'framer-motion';
import { FDButton } from '@nex/fd-ui';

interface ExpirationModalProps {
    isOpen: boolean;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    expirationDate: string;
    setExpirationDate: (d: string) => void;
    notifyBefore: boolean;
    setNotifyBefore: (f: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ExpirationModal({
    isOpen, files, setFiles,
    expirationDate, setExpirationDate,
    notifyBefore, setNotifyBefore,
    onConfirm, onCancel
}: ExpirationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white dark:bg-neutral-900 rounded-lg !p-6 w-11/12 max-w-xl text-gray-700 dark:text-gray-300"
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                    >
                        <h3 className="text-lg font-semibold !mb-4">Dettagli Upload</h3>

                        <FileUploadZone
                            files={files}
                            setFiles={setFiles}
                            allowedExtensions={['XLS', 'XLSX', 'CSV', 'PDF', 'DOC', 'DOCX', 'TXT']}
                            maxFileSizeMB={25}
                        />

                        <div className="!space-y-4 !mt-4">
                            {files && Array.isArray(files) && files.length > 0 && <div>
                                <p className="font-medium">File:</p>
                                <ul className="list-disc list-inside text-sm">
                                    {files.map((f, i) => <li key={i}>{f.name}</li>)}
                                </ul>
                            </div>}

                            <div>
                                <label className="block text-sm !mb-1">Data di scadenza</label>
                                <input
                                    type="date"
                                    value={expirationDate}
                                    onChange={e => setExpirationDate(e.target.value)}
                                    className="w-full border rounded !p-2 bg-white dark:bg-neutral-800 text-sm cursor-pointer"
                                />
                            </div>

                            <label className="flex items-center text-sm gap-2">
                                <input
                                    type="checkbox"
                                    checked={notifyBefore}
                                    onChange={e => setNotifyBefore(e.target.checked)}
                                    className="mr-2"
                                />
                                Avvisami 5 giorni prima
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-4">
                            <FDButton onClick={onCancel} variant="soft" color="secondary" size="medium">Annulla</FDButton>
                            <FDButton onClick={onConfirm} variant="solid" color="primary" size="medium">Conferma</FDButton>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
