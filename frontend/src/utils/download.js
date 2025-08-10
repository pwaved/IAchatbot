// utils/download.js

/**
 * Aciona o download de um arquivo no navegador a partir de um Blob.
 * @param {Blob} blob - O conteúdo do arquivo.
 * @param {string} fileName - O nome que o arquivo terá ao ser salvo.
 */
export function triggerBrowserDownload(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    
    // Limpeza
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}