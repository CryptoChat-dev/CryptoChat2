export const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    // Converts base64 encoded data into a blob.

    // Decode base64 data
    const byteCharacters = atob(btoa(b64Data));
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    // Create a blob and return it
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

export function saveBlob(blob, fileName) {
    // Saves a blob to disk.

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
};

export function retrieveB64FromBlob(encodedBlobData) {
    // Splits the blob and returns only the base64 encoded data.
    
    var array = encodedBlobData.toString().split(",");
    return array[1]
}   