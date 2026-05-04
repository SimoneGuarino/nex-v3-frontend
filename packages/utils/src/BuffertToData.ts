export function BufferToData(uint8Array : any) {
    const arrayBuffer = Uint8Array.from(uint8Array.data).buffer;

    const buffer = new TextDecoder().decode(arrayBuffer);

    // Decodifica il buffer come stringa UTF-8
    return JSON.parse(buffer.toString());
}