export async function DecryptAES(
    encryptedData: string,
    secretKeyHex: string,
    ivHex: string
): Promise<string> {
    try {
        // Converti la chiave e l'IV da esadecimale a ArrayBuffer
        const secretKey = hexStringToArrayBuffer(secretKeyHex);
        const iv = hexStringToArrayBuffer(ivHex);

        // Importa la chiave per utilizzarla nella decrittazione
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw", // La chiave grezza
            secretKey, // La chiave sotto forma di ArrayBuffer
            { name: "AES-CBC" }, // Algoritmo che utilizza la chiave
            false, // Non permettiamo l'esportazione della chiave
            ["decrypt"] // Scopo della chiave
        );

        // Converti i dati cifrati da esadecimale a ArrayBuffer
        const encryptedArrayBuffer = hexStringToArrayBuffer(encryptedData);

        // Decrittazione
        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: "AES-CBC", // Algoritmo utilizzato
                iv: iv, // IV sotto forma di ArrayBuffer
            },
            cryptoKey, // Chiave AES importata
            encryptedArrayBuffer // Dati cifrati sotto forma di ArrayBuffer
        );

        // Decodifica i dati decrittati (ArrayBuffer) in una stringa UTF-8
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);

    } catch (err) {
        console.error("Decryption failed:", err);
        throw err;
    }
}

// Funzione per convertire una stringa esadecimale in ArrayBuffer
function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
    const byteArray = new Uint8Array(
        hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    return byteArray.buffer;
}
