# CryptoChat 2.4 [![CodeFactor](https://www.codefactor.io/repository/github/cryptochat-dev/cryptochat2/badge)](https://www.codefactor.io/repository/github/cryptochat-dev/cryptochat2) [![Memes](https://img.shields.io/badge/need-memes-red)](https://img.shields.io/badge/need-memes-red)

[Official Instance](https://cryptochat.dev), [Beta Instance](https://beta.cryptochat.dev), [Legal](https://cryptochat.dev/legal), [Email Us](mailto:contact@cryptochat.dev)

CryptoChat is a simple, secure and beautiful chat webapp. Chatting has never been so satisfying.

## Features

Here's an overview of the features CryptoChat has to offer.

### Simple UI

CryptoChat has barely any clutter on its user interface. It's a simple, yet featured, interface that anybody could use--even your grandma!

### Secure File Transfer

CryptoChat supports end-to-end encrypted file transfer\*, so you can send sensitive files without leaving a trace.

\*Requires CryptoChat version 2.1 or later.

### Encryption

All messages sent through the official CryptoChat clients are end-to-end encrypted locally, meaning nobody except for the message recipients can read their contents. If you need more piece of mind during your chats, use the random key generator for an extra-secure key (it would take 27,255,689 years to crack!<sub>[Source](https://www.rempe.us/diceware/#eff)</sub>).

### Ephemeral

Message history is *never* stored when using CryptoChat clients. Not on the server, not on the client, not anywhere. When the browser tab goes, so does the chat history.

### Cross-Compatible

Since CryptoChat uses web frameworks, all you need is an electronic device with a web browser. Whether the device is a smartphone, tablet, game console or desktop computer, you can take CryptoChat with you everywhere.

### Open-Source

CryptoChat is open-source meaning that anybody can see its interworkings. This allows the community to improve on its codebase and spot potential security vulnerabilities, leading to an awesome product.

## Encryption Specifics

CryptoChat relies on the Crypto-JS AES encryption framework to encrypt all usernames and messages with the specified encryption/room key using AES-256 bit encryption.

Here's how CryptoChat's encryption works:

During this overview, Bob and Alice will be communicating with each other.

### Joining

1. The user enters their username and room key (which is used for the encryption key).

Bob and Alice enter their different usernames and the same room key on the splash screen. Both of their clients send a SHA-512 hashed version of their encryption key to the backend webserver using Socket.IO to join the same socket room. The plaintext encryption keys never leave their clients--ever.

### Text

2. The user sends a message.

Bob says, "Hello Alice!". Bob's client uses the plaintext encryption key to locally encrypt his username (Bob) and message (Hello Alice!). Before sending the message, his client also generated a SHA-256 HMAC hash and attaches it to the message so that Alice can verify the message's authenticity. This hash can make it harder for a middle-man to tamper with Bob's message. Bob's client sends the SHA-512 hashed version of their encryption key along with his encrypted username, message and message HMAC hash to the server. 

Alice's client receives the end-to-end message from the backend's using Socket.IO. First, her client calculates the SHA-256 HMAC hash and compares it with the one she received from Bob. If the hashes match, her client decrypts the encrypted username and message using her local encryption key that she entered on the splash screen. Otherwise, her client refuses to decrypt the message and tells Alice that there was an error verifying the authenticity of the received information.

### File Attachment

2. The user attaches a file.

Bob attaches a very sensitive PDF document on CryptoChat.

Upon clicking the "Send" button, Bob's client encodes the file using Base64, end-to-end encrypts the text data and calculates a SHA-256 HMAC hash. Along with the actual file data itself, its MIME type is also encrypted and stored in memory. This end-to-end encrypted data is then sent to the backend webserver using Socket.IO with his end-to-end encrypted username and SHA-512 hashed encryption key as the room key. 

After Bob's client finishes uploading the document, Alice's client downloads the encrypted file content and MIME type. Before decrypting the data, her client calculates the SHA-256 HMAC hash and compares it with the one she received from Bob. If the hashes do not match, Alice's client tells her that there was an error verifying the authenticity of the received information. 

If the HMAC verification is successful, when Alice clicks on the decryption button, her client locally decrypts the file and MIME type information with the decryption key she entered on the splash screen. Her client then decodes the base64 text and creates a Javascript blob object with the included MIME type. This blob object is finally saved to her computer, and Alice can now view the file on her side.

### Leaving

3. The user leaves the room.

Bob says goodbye to Alice and he closes his CryptoChat tab. His username, encryption key and messages are now discarded from his end. When Alice leaves CryptoChat, the same happens with her client.

Since the backend server never received any plaintext data (such as encryption keys, messages and files), Bob and Alice can rest assured that their communication on CryptoChat was secure and anonymous.