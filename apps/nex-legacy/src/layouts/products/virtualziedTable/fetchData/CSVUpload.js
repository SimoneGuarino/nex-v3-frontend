import { FetchFileData } from '../../../../examples/Fetch/FetchFileData';
import { CookieCompareV3 } from '../../utils/CookieData';


export async function CSVUploadRequest(userContext, abortController, 
    formData, setProgressUpload, openErrorSB) {
    if(userContext.details === undefined){return;}

    const __dist = await CookieCompareV3('stored_settings_prodotti');

    //assegna __dist (lista dei fornitori) al body del fetch.
    if(__dist && __dist.length > 0 ){
        formData.append('__dist', JSON.stringify(__dist));
    };

    const handleDownloadCsv = (path, fileName) => {
        const fileUrl = import.meta.env.VITE_API_PRODUCTS + path.slice(1);

        fetch(fileUrl)
            .then(response => response.blob()) // Importante: ottieni la risposta come oggetto Blob
            .then(blob => {
                const csvFileUrl = URL.createObjectURL(blob);
                setProgressUpload(() => 100);
                // Creare un link di download dinamico
                const downloadLink = document.createElement('a');
                downloadLink.href = csvFileUrl;
                downloadLink.setAttribute('download', fileName);
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                setTimeout(() => setProgressUpload(() => 0), 1500)

            })
            .catch(error => {
                console.error('Errore durante il download del file:', error);
            });
        
    };

    FetchFileData(import.meta.env.VITE_API_PRODUCTS + 'csv-upload', 'POST', formData, abortController).then(res => {
        setProgressUpload(() => 60);
        if(res.csv){
            handleDownloadCsv(res.csv, res.csv.split("/")[2]);
        }else{
            openErrorSB('error', 'Ops!, sembra che questo file sia già elaborato, perfavore inseriscine un altro.');
            setProgressUpload(() => 0);
        }
    }).catch(error => console.error(error));
}