//src\utils\dwdFile.ts
//import { enqueueSnackbar } from "components/MessageBox";

export const DwdFileFromLink = ({ path, fileName, serverUrl, completed, error_func, setProgressUpload }:
    { path: string, fileName: string, serverUrl: any, setProgressUpload?: (prev: number) => void; completed?: () => void; error_func?: () => void }): void => {
    const serverUrl_ = serverUrl ? serverUrl : "import.meta.env.VITE_API_PRODUCTS"
    const fileUrl: string = `${serverUrl_}${path}`;
    if (setProgressUpload != undefined && setProgressUpload != null) {
        setProgressUpload(10);
    }

    fetch(fileUrl)
        .then((response: Response) => {
            // Verifica se la risposta è OK (status 200-299)
            if (!response.ok) {
                throw new Error(`Errore durante il download del file: ${response.status} ${response.statusText}`);
            };
            if (setProgressUpload != undefined && setProgressUpload != null) {
                setProgressUpload(60);
            };
            return response.blob(); // Ottieni la risposta come oggetto Blob
        }).then((blob: Blob) => {
            const csvFileUrl: string = URL.createObjectURL(blob);

            // Creare un link di download dinamico
            const downloadLink: HTMLAnchorElement = document.createElement('a');
            downloadLink.href = csvFileUrl;
            if (setProgressUpload != undefined && setProgressUpload != null) {
                setProgressUpload(100);
            };
            downloadLink.setAttribute('download', fileName);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            if (setProgressUpload != undefined && setProgressUpload != null) {
                setTimeout(() => setProgressUpload(0), 1500);
            };

            if (completed != undefined && completed != null) {
                completed();
            };
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                if (error_func != undefined && error_func != null) {
                    error_func();
                };
                console.error('Errore durante il download del file:', error);
                let error_ = "Sembra che ci sia stato un problema nello scaricare il file, perfavore contatta un tecnico."
                if (error && (error?.msg || error?.message)) { error_ = (error.msg || error.message); };
                return console.error(error_); /*enqueueSnackbar(error_, {
                    title: "Ops..",
                    type: "error",
                });*/
            };
        });
};

export async function downloadFile(blob: any, fileName: string): Promise<void> {
    // Crea un URL oggetto per il blob
    const fileUrl = URL.createObjectURL(blob);

    // Crea un link di download dinamico
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.setAttribute('download', `${fileName}`);
    document.body.appendChild(downloadLink);

    // Fai clic sul link per avviare il download
    downloadLink.click();

    // Rimuovi il link di download dalla pagina
    document.body.removeChild(downloadLink);

    // Libera l'URL creato
    URL.revokeObjectURL(fileUrl);
}

export async function CreateAndDownloadExcel(data: any, fileName: string): Promise<void> {
    // Creare un buffer dal dato
    const arrayBuffer = Uint8Array.from(data.data).buffer;

    // Genera un blob contenente il file Excel
    const excelBlob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Crea un URL oggetto per il blob
    const excelFileUrl = URL.createObjectURL(excelBlob);

    // Crea un link di download dinamico
    const downloadLink = document.createElement('a');
    downloadLink.href = excelFileUrl;
    downloadLink.setAttribute('download', `${fileName}.xls`);
    document.body.appendChild(downloadLink);

    // Fai clic sul link per avviare il download
    downloadLink.click();

    // Rimuovi il link di download dalla pagina
    document.body.removeChild(downloadLink);
}

export async function CreateAndDownloadCSV(data: any, fileName: string): Promise<void> {
    // Suddividi il testo in righe
    const rows = data.split('\r\n').filter((row: any) => row.trim() !== '');

    // Converti ogni riga in un array di valori, usando il punto e virgola come delimitatore
    const csvContent = rows.map((row: any) => row.split(';').join(";")).join("\n");

    // Crea un blob contenente i dati CSV
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });

    // Crea un URL oggetto per il blob
    const csvFileUrl = URL.createObjectURL(csvBlob);

    // Crea un link di download dinamico
    const downloadLink = document.createElement('a');
    downloadLink.href = csvFileUrl;
    downloadLink.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(downloadLink);

    // Fai clic sul link per avviare il download
    downloadLink.click();

    // Rimuovi il link di download dalla pagina
    document.body.removeChild(downloadLink);
}