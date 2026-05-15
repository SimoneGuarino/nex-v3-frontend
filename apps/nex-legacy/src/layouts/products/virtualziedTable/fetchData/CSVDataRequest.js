import { FetchData } from '../../../../examples/Fetch';

export function CSVDataRequest(userContext, abortController, query) {
    if(userContext.details === undefined){return;}

    const handleDownloadCsv = (path, fileName) => {
        const fileUrl = import.meta.env.VITE_API_PRODUCTS + path;

        fetch(fileUrl)
            .then(response => response.blob()) // Importante: ottieni la risposta come oggetto Blob
            .then(blob => {
                const csvFileUrl = URL.createObjectURL(blob);

                // Creare un link di download dinamico
                const downloadLink = document.createElement('a');
                downloadLink.href = csvFileUrl;
                downloadLink.setAttribute('download', fileName);
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            })
            .catch(error => {
                console.error('Errore durante il download del file:', error);
            });
    };

    FetchData(import.meta.env.VITE_API_PRODUCTS + 'tablecsv?skip=0&' + query, 'POST', {
        username: userContext?.details?.username,
        token: userContext.token,
        csv: 1,
    }, abortController).then(res => {
        handleDownloadCsv(res.csv, res.csv.split("/")[2])
    }).catch(error => console.error(error))
}