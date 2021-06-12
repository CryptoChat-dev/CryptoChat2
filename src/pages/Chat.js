import React, {useContext, useEffect, useRef} from 'react';
import {Helmet} from 'react-helmet';
import {useHistory} from 'react-router-dom';
import {Context} from '../Components/Store';
import useSound from 'use-sound';
import notificationSound from '../assets/notification.mp3';
import Picker from 'emoji-picker-react';

// ReachUI

import {Dialog} from "@reach/dialog";
import "@reach/dialog/styles.css"

// Crypto JS
import CryptoJS from 'crypto-js';

// Icons

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPaperclip, faTimes, faLaugh} from '@fortawesome/free-solid-svg-icons'

// Util Imports

import {b64toBlob, saveBlob, retrieveB64FromBlob} from '../utils/blob';
import {crypt} from '../utils/encryption.js';

// Socket.IO
import io from "socket.io-client";
const ss = require('socket.io-stream')
let socket;


// Code
const Chat = () => {
    const history = useHistory();
    const divRef = useRef(null);
    const hiddenFileInput = React.useRef(null);

    // State Varibles
    const [playNotification] = useSound(notificationSound);

    const [state, dispatch] = useContext(Context);

    const [message, setMessage] = React.useState('');
    const [messageIcon, setMessageIcon] = React.useState('faPaperclip');

    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

    const [fileSelected, setFileSelected] = React.useState(false);
    const [file, setFile] = React.useState('');
    const [fileObject, setFileObject] = React.useState(null);

    const [received, setReceived] = React.useState([]);
    const [joinedSent, setJoinedSent] = React.useState(false);
    const [disabled, setDisabled] = React.useState(false);
    var themeSetting;

    const [showDialog, setShowDialog] = React.useState(false);
    const open = () => setShowDialog(true);
    const close = () => setShowDialog(false);

    const [showDialogTL, setShowDialogTL] = React.useState(false);
    const openTL = () => setShowDialogTL(true);
    const closeTL = () => setShowDialogTL(false);
    
    // Before the tab closes:
    window.onbeforeunload = (event) => {
        const e = event || window.event;
        // Cancel the event
        e.preventDefault();
        console.log("[Tab] Close attempt detected.")
        console.log("[Tab] Broadcasting leave.");
        broadcastLeave();
    };

    useEffect(() => {
        if (state.key === null || state.username === null) {
            // If the key or username doesn't exist in the parent state, go to the splash screen.
            history.push('/');
            return;
        }
        
        // Hash the room key with SHA-512
        var roomName = CryptoJS.SHA512(state.key).toString();
        
        // Set the room name as the hashed key
        dispatch({type: 'SET_ROOM', payload: roomName});
        
        if (joinedSent === false) {
            // If the join message hasn't been sent, do it.
            socket = io(process.env.REACT_APP_API); // Initiate the socket connection to the API
            socket.emit('join', {
                "roomName": roomName,
                "user_name": crypt.encryptMessage(state.username, state.key)
            }); // Emit the join event
            setJoinedSent(true); // Don't send the event again
        }
    }, [state.roomName])

    useEffect(() => {
        try {
            // Subscribe to socket events
            socket.on('chat response', messageHandler);
            socket.on('file response', fileHandler);
            socket.on('join response', joinHandler);
            socket.on('leave response', leaveHandler);
        } catch (err) {
            // If there's an error, cancel.
            history.push('/');
            return;
        }
        return() => {
            // Unsubscribe to responses
            socket.off('chat response');
            socket.off('file response');
            socket.off('join response')
            socket.off('leave response');
        }
    }, []);

    function joinHandler(msg) {
        // Handles join responses
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key); // Decrypt the username
        if (decryptedUsername !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [// Display
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername} has joined the room.</b></p>
                </div>
            ]);
            playNotification();
            try {
                // Scroll down
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            console.log(`Not my message: ${msg}`)
        }
    }

    function leaveHandler(msg) {
        // Handles leave responses
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key); // Decrypt the username
        if (decryptedUsername !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [// Display
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername} has left the room.</b></p>
                </div>
            ]);
            playNotification();
            try {
                // Scroll down
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            console.log(`Not my message: ${msg}`)
        }
    }

    function messageHandler(msg) {
        // Handles incoming message responses
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key); // Decrypt the username
        var decryptedMessage = crypt.decryptMessage(msg.message, state.key); // Decrypt the message
        if (decryptedUsername !== '' || decryptedMessage !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [// Display
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername}</b>: {decryptedMessage}</p>
                </div>
            ]);
            try {
                // Scroll down
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            setReceived((messages) => [// Display a decryption error
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b>[DECRYPTION ERROR]</b>: [DECRYPTION ERROR]</p>
                </div>
            ]);
            console.log(`Not my message: ${msg}`)
        }
        playNotification();
    }

    function fileHandler(msg) {
        // Handles incoming file responses
        console.log(msg); // Print file response for debugging

        console.log("[File Handler] file received");

        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key); // Decrypt the username
        var decryptedName = crypt.decryptMessage(msg.name, state.key); // Decrypt the file name
        var decryptedMIME = crypt.decryptMessage(msg.type, state.key); // Decrypt the MIME type

        if (decryptedUsername !== '') { // if the username is an empty value, stop
            switch(decryptedMIME) {
                case 'image/jpeg':
                case 'image/png':
                    setReceived((messages) => [// Display
                        ...messages,
                        <div ref={divRef}>
                            <p>
                                <b> {decryptedUsername} sent an image</b>.
                                <span class="decrypt"
                                    onClick={
                                        () => {
                                            // Pass the encrypted file data, decrypted name and decrypted MIME
                                            // to the file decryption
                                            handleImagePreviewClick(msg.data, decryptedName, decryptedMIME)
                                        }
                                }> Click to preview {decryptedName}.</span>
                                <img id={decryptedName} class="previewedImage" alt={decryptedName} style={{display: 'none'}}></img>
                            </p>
                        </div>
                    ]);    
                    return;
                case 'audio/mpeg':
                case 'audio/flac':
                    setReceived((messages) => [// Display
                        ...messages,
                        <div ref={divRef}>
                            <p>
                                <b> {decryptedUsername} sent an audio file</b>.
                                <span class="decrypt"
                                    onClick={
                                        () => {
                                            // Pass the encrypted file data, decrypted name and decrypted MIME
                                            // to the file decryption
                                            handleAudioPreviewClick(msg.data, decryptedName, decryptedMIME)
                                        }
                                }> Click to preview {decryptedName}.</span>
                                <br></br>
                                <audio class="previewedImage" id={decryptedName} controls style={{display: 'none'}}/>
                            </p>
                        </div>
                    ]);    
                    return;
                default:
                    setReceived((messages) => [// Display
                        ...messages,
                        <div ref={divRef}>
                            <p>
                                <b> {decryptedUsername} sent an attachment</b>.
                                <span class="decrypt"
                                    onClick={
                                        () => {
                                            // Pass the encrypted file data, decrypted name and decrypted MIME
                                            // to the file decryption/save function
                                            handleDecryptClick(msg.data, decryptedName, decryptedMIME)
                                        }
                                }> Click to decrypt {decryptedName}.</span>
                            </p>
                        </div>
                    ]);
                }
            }


            playNotification();

            try {
                // Scroll down
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        // } else {
        //     setReceived((messages) => [// Display a decryption error message
        //         ...messages,
        //         <div ref={divRef}>
        //             <p>
        //                 <b>[DECRYPTION ERROR]</b>: [DECRYPTION ERROR]</p>
        //         </div>
        //     ]);
        //     console.log(`Not my message: ${
        //         msg.name
        //     }`)
        // }
    }

    function handleDecryptClick(encryptedData, decryptedName, decryptedMIME) {
        // Handles decryption and saving
        const decryptedData = crypt.decryptMessage(encryptedData, state.key); // Decrypt file data
        console.log(`[Decrypt Button] Decrypted Data.\n[DecryptButton] Converting base64 to ${decryptedMIME} blob.`)
        const blob = b64toBlob(atob(decryptedData), decryptedMIME); // Decode base64 and create blob
        console.log("[Decrypt Button] Blob created.");
        console.log(blob); // Print blob for debugging
        saveBlob(blob, decryptedName); // Save blob
    }

    const handleImagePreviewClick = (encryptedData, decryptedName, decryptedMIME) => {
        const imageElement = document.getElementById(decryptedName);
        if (imageElement.style.cssText === "display: inline-block;") {
            imageElement.style = "display: none;"
            return;
        }

        const decryptedData = crypt.decryptMessage(encryptedData, state.key); // Decrypt file data
        console.log(`[Decrypt Button] Decrypted Data.\n[DecryptButton] Converting base64 to ${decryptedMIME} blob.`)
        const blob = b64toBlob(atob(decryptedData), decryptedMIME); // Decode base64 and create blob        
        var objectURL = URL.createObjectURL(blob);
        document.getElementById(decryptedName).src = objectURL;
        document.getElementById(decryptedName).style = 'display: inline-block;';
    }

    const handleAudioPreviewClick = (encryptedData, decryptedName, decryptedMIME) => {
        const imageElement = document.getElementById(decryptedName);
        if (imageElement.style.cssText === "display: inline-block;") {
            imageElement.style = "display: none;"
            return;
        }

        const decryptedData = crypt.decryptMessage(encryptedData, state.key); // Decrypt file data
        console.log(`[Decrypt Button] Decrypted Data.\n[DecryptButton] Converting base64 to ${decryptedMIME} blob.`)
        const blob = b64toBlob(atob(decryptedData), decryptedMIME); // Decode base64 and create blob        
        var objectURL = URL.createObjectURL(blob);
        document.getElementById(decryptedName).src = objectURL;
        document.getElementById(decryptedName).style = 'display: inline-block;';
    }

    function broadcastLeave() {
        // Broadcasts a leave event to the room
        socket.emit('leave', {
            "roomName": state.roomName,
            "user_name": crypt.encryptMessage(state.username, state.key)
        });
    }

    function changeTheme() { // Change app-wide theme
        if (state.theme === 'light') {
            themeSetting = 'dark';
            dispatch({type: 'SET_OTHEME', payload: 'light'})
            dispatch({type: 'SET_MODAL', payload: '#292929'})
        } else {
            themeSetting = 'light';
            dispatch({type: 'SET_OTHEME', payload: 'dark'})
            dispatch({type: 'SET_MODAL', payload: '#b3b3b3'})
        }
        dispatch({type: 'SET_THEME', payload: themeSetting})
        document.documentElement.setAttribute('data-theme', themeSetting);
    }

    // Handlers

    function handleLeave() {
        broadcastLeave();
        history.push('/');
    }

    function socketEmit(msg) {
        // Emits message events
        socket.emit('chat event', {
            "roomName": state.roomName,
            "user_name": crypt.encryptMessage(state.username, state.key),
            "message": crypt.encryptMessage(msg, state.key)
        });
    }

    function handleSend() {
        // Handles send button click
        console.log("[Send Button] Clicked.")
        if (message === '') {
            // If the message is empty just stop
            console.log("[Send Button] Message is empty. Returning.")
            return;
        }

        if (fileSelected === true) {
            // If a file is attached:
            open(); // Open the loading dialog
            console.log("[Send Button] Attachment mode.");

            // Define the FileReader which is able to read the contents of Blob
            var reader = new FileReader();

            reader.readAsDataURL(fileObject) // Reader Object, contains base64 data

            reader.onload = function () { // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
                reader.result.replace(/^data:.+;base64,/, '');
                var encodedData = retrieveB64FromBlob(reader.result);

                console.log(`[Send Button] Base64 encoded data. Sending ${
                    fileObject.type
                }.`)

                var encryptedUsername = crypt.encryptMessage(state.username, state.key);
                var encryptedName = crypt.encryptMessage(file.name, state.key);
                var encryptedMIME = crypt.encryptMessage(fileObject.type, state.key);
                console.log("[Send Button] Username, file name and file MIME encrypted.");
                var encryptedData = crypt.encryptMessage(encodedData, state.key);
                console.log("[Send Button] File data encrypted. Sending...")

                var stream = ss.createStream();
                try {
                    ss(socket).emit('file event', stream, {
                        "roomName": state.roomName,
                        "user_name": encryptedUsername,
                        "name": encryptedName,
                        "type": encryptedMIME,
                        "data": encryptedData
                    });
                } catch(err) {
                    console.log("[Send Button] Couldn't send file.");
                    close();
                    return;
                }

                socket.on('file progress', function (msg) {
                    if (msg.finished === true) {
                        console.log("[Send Button] Data sent.");
                        setMessage('');
                        setFileSelected(false);
                        setFile(null);
                        setFileObject(null);
                        setMessageIcon('faPaperclip')
                        setDisabled(false);
                        close();
                        socket.off('file progress');
                    }
                })
            };
            return;
        }
        console.log("[Send Button] Message mode.")

        switch(message) {
            // Checks for commands
            case '/?':
            case '/cryptochat':
            case '/commands':
            case '/cmds':
            case '/help':
                setReceived((messages) => [
                    ...messages,
                    <div ref={divRef}>
                        <p>
                        <b class="systemmsg">SYSTEM: Only you can see this help message.</b>
                        <br></br>
                        <b>CryptoChat Command Help</b>
                        <br></br>
                        /shrug - Send a shrug emoticon.
                        <br></br>
                        /tableflip - Send a table flipping emoticon.
                        <br></br>
                        /unflip - Send a table unflipping emoticon.
                        <br></br>
                        /leave - Leave the room.</p>
                    </div>
                ]);    
                break;    
            case '/quit':
            case '/bye':
            case '/exit':
            case '/leave':
                broadcastLeave();
                history.push('/');
                break;
            case '/shrug':
                socketEmit('¯\\_(ツ)_/¯');
                break;
            case '/tableflip':
                socketEmit('(╯°□°）╯︵ ┻━┻');
                break;
            case '/unflip':
                socketEmit('┬─┬ ノ( ゜-゜ノ)');
                break;
            default:
                socketEmit(message);
        }
        
        try {
            // Scroll down
            divRef.current.scrollIntoView({behavior: 'smooth'});
        } catch(err) {
            return;
        }
        setMessage('')
    }

    function handleMessageKeyDown(e) {
        // Handle enter presses in the message box
        if (e.keyCode === 13) {
            handleSend();
        }
    }

    function handleInputChange(event) {
        // Handle file input change
        setFileSelected(true);
        var binaryData = [];
        binaryData.push(event.target.files[0]);
        
        try {
            // Try to set the file object to a blob
            setFileObject(new Blob(binaryData, {type: event.target.files[0].type}))
        } catch (err) {
            setFileSelected(false);
            setFileObject(null);
            return;
        }

        var thisFile = event.target.files[0];
        setFile(thisFile);
        const sizeMB = thisFile.size / 1024000; // Calculate the size in MB
        if (sizeMB > process.env.REACT_APP_SIZE_LIMIT) {
            // Stop the user if the size of the file is larger than the serverside limit
            openTL();
            setFileSelected(false);
            setFileObject(null);
            setFile(null);
            return;
        }

        setMessage(`Attached: ${
            thisFile.name
        } (${
            sizeMB.toFixed(2)
        } MB)`);
        setDisabled(true);
        setMessageIcon('faTimes');
    }

    function handleMessageButtonClick(event) {
        // Handle the attachment icon click
        console.log("[Message Button] Clicked.")
        if (messageIcon === 'faPaperclip' && fileSelected === false) {
            console.log("[Message Button] Attachment selection mode.")
            hiddenFileInput.current.click();
        } else if (messageIcon === 'faTimes' && fileSelected === true) {
            // Clear file if the X button is clicked
            console.log("[Message Button] Attachment removal mode.")
            setFileSelected(false);
            setFile(null);
            setMessage('');
            setDisabled(false);
            setMessageIcon('faPaperclip');
        }
    }

    function handleEmojiButtonClick() {
        if (fileSelected === true) {
            return;
        }

        if (showEmojiPicker === true) {
            setShowEmojiPicker(false);
            return;
        }
        setShowEmojiPicker(true);
    }

    // Return

    return (<React.Fragment>
        <Helmet>
            <link rel="stylesheet" href="/styles/Chat.css"/>
        </Helmet>
        <div class="chatbox-parent" id="chatbox-parent">
            <div class="chatbox-child">
                <div class="chatbox-header">
                    <p class="keyname title" id="keyname">Room Key: <p class="keyname">{
                        state.key
                    }</p></p>
                    <h1 class="chatbox-title">CryptoChat</h1>
                    <h2 class="chatbox-subtitle">
                        A stunning encrypted chat webapp.
                    </h2>
                </div>
                <div class="chatbox-messages">
                    <div class="messageviewer-parent">
                        <div id="messageviewer" name="messageviewer" class="messageviewer">
                            <div class="messagetxt" id="messagetxt"> {received}</div>
                        </div>
                    </div>
                    <div class="messagebox">
                        <div class="fields">
                            <div class="username">
                                <input id="msg" type="text" class="message" placeholder="What's up?"
                                    disabled={
                                        (disabled) ? "disabled" : ""
                                    }
                                    value={message}
                                    onChange={(e) => {setMessage(e.target.value);}}
                                    onKeyDown={handleMessageKeyDown}/>
                                <input type="file" id="file-input" class="fileinput"
                                    ref={hiddenFileInput}
                                    onChange={handleInputChange}/>
                                <button class="iconbutton attach"
                                    onClick={handleMessageButtonClick}> {
                                    messageIcon === 'faPaperclip' && <FontAwesomeIcon icon={faPaperclip}/>
                                }
                                    {
                                    messageIcon === 'faTimes' && <FontAwesomeIcon icon={faTimes}/>
                                }</button>
                                <button class="iconbutton emoji" onClick={handleEmojiButtonClick}><FontAwesomeIcon icon={faLaugh} /></button>
                            </div>
                            {showEmojiPicker === true &&
                                <div class="emojiPicker">
                                    <Picker onEmojiClick={(e, emojiObject) => {setMessage(message.concat(emojiObject.emoji))}}/>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <div class="chatbox-buttons">
                    <button class="button theme" id="toggler"
                        onClick={changeTheme}> {
                        state.oppositeTheme
                    }</button>
                    <button class="button send" id="sendbutton"
                        onClick={handleSend}>Send</button>
                    <button class="button leave" id="leavebutton"
                        onClick={handleLeave}>Leave</button>
                </div>
            </div>

        </div>
        <Dialog style={
                {
                    backgroundColor: state.modalColor,
                    minWidth: "calc(min(350px,90%))",
                    width: "25%",
                    padding: "2%",
                    textAlign: "center",
                    borderRadius: "10px"
                }
            }
            isOpen={showDialog}>
        <div class="loader"></div>
            <h1>Uploading File...</h1>
            <p>Please standby while your file is being end-to-end encrypted and uploaded to the server.</p>
        </Dialog>
        <Dialog style={
                {
                    backgroundColor: state.modalColor,
                    minWidth: "calc(min(350px,90%))",
                    width: "25%",
                    padding: "2%",
                    textAlign: "center",
                    borderRadius: "10px"
                }
            }
            isOpen={showDialogTL}
            onDismiss={closeTL}>
                <h1>File Too Large</h1>
                <p>The file you selected is larger than the size limit ({process.env.REACT_APP_SIZE_LIMIT} MB) and cannot be uploaded.</p>
                <div class="modalButtons">
                <button class="button"
                                onClick={closeTL}>Ok</button>
                </div>
        </Dialog>

    </React.Fragment>)
}
export default Chat;
