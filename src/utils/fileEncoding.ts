/**
 * Encodage de fichiers pour les pièces jointes email (CommunicationService).
 */

export const blobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

export const textToBase64 = (content: string): string =>
  btoa(unescape(encodeURIComponent(content)));
