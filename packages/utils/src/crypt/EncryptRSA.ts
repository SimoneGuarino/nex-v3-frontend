
const { subtle } = globalThis.crypto;


const encryptData = async (publicKey: CryptoKey, data: string): Promise<ArrayBuffer> => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    return await subtle.encrypt(
        {
            name: 'RSA-OAEP'
        },
        publicKey,
        encodedData
    );
};

const importPublicKey = async (pem: string): Promise<CryptoKey> => {
    // Rimuovi le intestazioni e le interruzioni di riga dal PEM
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';

    // Assicurati che il PEM sia formattato correttamente
    if (!pem.includes(pemHeader) || !pem.includes(pemFooter)) {
        throw new Error('La chiave PEM RSA non è correttamente formattata.');
    }

    const pemContents = pem
        .replace(pemHeader, '')
        .replace(pemFooter, '')
        .replace(/\s+/g, ''); // Rimuove gli spazi bianchi e le interruzioni di riga

    const binaryDerString = window.atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await subtle.importKey(
        'spki',
        binaryDer.buffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true,
        ['encrypt']
    );
};

export async function EncryptRSA(tkey: string, dataToEncrypt: any) {
    const publicKey = await importPublicKey(tkey);
    const encryptedData = await encryptData(publicKey, dataToEncrypt);
    const base64EncryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
    return base64EncryptedData;
}