import decompress from 'brotli/decompress';

function uint8ArrayToJson<T>(uint8Array: Uint8Array): T {
  const decoded = new TextDecoder().decode(uint8Array);
  return JSON.parse(decoded) as T;
}

export async function DecompressBrotliObjects<T = unknown>(compressedObject: { data: Uint8Array }): Promise<T> {
  const decompressed = (await decompress(compressedObject.data)) as Uint8Array;
  return uint8ArrayToJson<T>(decompressed);
}
