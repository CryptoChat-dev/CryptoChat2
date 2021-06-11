import CryptoJS from 'crypto-js';

export const crypt = (function () {
    // Encrypts and decrypts data using CryptoJS in password mode.
    
    return {
        encryptMessage: function (messageToencrypt = '', secretkey = '') {
            var encryptedMessage = CryptoJS.AES.encrypt(messageToencrypt, secretkey);
            return encryptedMessage.toString();
        },
        decryptMessage: function (encryptedMessage = '', secretkey = '') {
            try {
                var decryptedBytes = CryptoJS.AES.decrypt(encryptedMessage, secretkey);
                var decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
                return decryptedMessage;
            } catch (err) {
                console.log("Malformed UTF-8 Data.")
                return '';
            }
        }
    };
})();
