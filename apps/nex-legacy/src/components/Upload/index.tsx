//src\components\Upload\index.tsx
import styled from "@emotion/styled";
import { Button, Collapse, IconButton, Stack } from "@mui/material";
import MDTypography from "components/MDTypography";
import { enqueueSnackbar } from "components/MessageBox";
import { icon_attachFiles, icon_attachFilesCloud, icon_close, icon_file } from "config/icons";
import { TransitionGroup } from "react-transition-group";


// Definisci le estensioni permesse
export const allowedExtensions = ['csv', 'txt', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'jfif'];

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

interface AttachmentsFormProps {
    selectedFile: File[];
    setSelectedFile: React.Dispatch<React.SetStateAction<File[]>>;
    showPdfSelected?: boolean;
    extensions?: Array<string>;
    buttonType?: 'icon' | 'button';
    maxFileSize?: number;
    loading?: boolean;
};
/**
 * Componente per la gestione degli upload, quindi selezione dei file e salvataggio di tali elementi nello stato passato come props.
 * @param selectedFile State <File[]> | contiene i file selezionati dall'utente
 * @param setSelectedFile SetState
 * @returns 
 */
export const AttachmentsForm: React.FC<AttachmentsFormProps> = ({
    selectedFile,
    setSelectedFile,
    extensions = ['csv', 'txt', 'pdf', 'xls', 'xlsx', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'jfif'],
    maxFileSize = 25, //Limite della grandezza del file espresso in MB
    showPdfSelected,
    loading,
    buttonType }) => {

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        // Filtra i file in base alle estensioni permesse
        const filteredFiles = Array.from(e.target.files).filter((file: File) => {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (maxFileSize && file.size > (maxFileSize * 1024 * 1024)) {
                enqueueSnackbar(`Il file "${file.name}" supera il limite di ${maxFileSize}MB.`, {
                    title: 'Ops.. File troppo grande',
                    type: 'error',
                });
                return false;
            }
            return fileExtension && (extensions || allowedExtensions).includes(fileExtension);
        });

        if (filteredFiles.length === 0) {
            enqueueSnackbar("Impossibile importare i file, sembra che alcuni dei file selezionati siano di una tipologia non supportata. Scegli un formato valido.", {
                title: 'Ops.. File non Supportati',
                type: 'error',
            });
            return;
        };

        // Controlla se i file sono già presenti
        setSelectedFile((prev) => {
            const newFiles = filteredFiles.filter(
                (file) => !prev.some((existingFile) => existingFile.name === file.name)
            );

            if (newFiles.length === 0) {
                enqueueSnackbar("Il file selezionato è già stato aggiunto.", {
                    title: 'File Duplicato',
                    type: 'info',
                });
            }

            return [...prev, ...newFiles];
        });

        // Resetta l'input file per gestire nuove selezioni
        e.target.value = '';
    };

    const deleteAttached = (index: number) => {
        setSelectedFile((prev: any) => {
            const newSelectedFile = [...prev]; // Crea una copia dell'array
            newSelectedFile.splice(index, 1); // Rimuovi l'elemento all'indice specificato
            return newSelectedFile; // Ritorna l'array aggiornato
        });
    };


    return <form encType="multipart/form-data" method="post" style={{ width: '100%' }}>
        {(showPdfSelected) && <TransitionGroup style={{ width: '100%', maxHeight: 250, overflow: 'auto' }}>
            {selectedFile.map((item: any, index: number) => (
                <Collapse key={index}><Stack direction='row' width='100%' gap={1} mb={0.5} alignItems='center'>
                    {icon_file()}
                    <MDTypography variant='body2'>
                        {item.name}
                    </MDTypography>
                    <IconButton onClick={() => deleteAttached(index)} sx={{ ml: 'auto', padding: "3px" }} aria-label="delete" size="small">
                        {icon_close()}
                    </IconButton>
                </Stack></Collapse>
            ))}
        </TransitionGroup>}
        {(buttonType && buttonType == 'button') ?
            <Button
                disabled={loading}
                color="secondary"
                component="label"
                role={undefined}
                variant="outlined"
                tabIndex={-1}
                startIcon={icon_attachFilesCloud()}
                sx={{ maxWidth: 200 }}
            >
                Upload Files
                <VisuallyHiddenInput
                    type="file"
                    onChange={onSelectFile}
                    multiple
                />
            </Button>
            : <IconButton
                component="label"
                role={undefined}
                tabIndex={-1}
            >
                {icon_attachFiles()}
                <VisuallyHiddenInput
                    type="file"
                    onChange={onSelectFile}
                    multiple
                />
            </IconButton>}
    </form>
}