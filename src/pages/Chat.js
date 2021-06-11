import React, {useContext, useEffect, useRef} from 'react';
import {Helmet} from 'react-helmet';
import {Context} from '../Components/Store';
import {useHistory} from 'react-router-dom';
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
let socket;


// Code
const Chat = () => {
    const history = useHistory();
    const divRef = useRef(null);
    const [playNotification] = useSound(notificationSound);
    const hiddenFileInput = React.useRef(null);

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
            history.push('/');
            return;
        }
        
        var roomName = CryptoJS.SHA512(state.key).toString();
        
        dispatch({type: 'SET_ROOM', payload: roomName});
        
        if (joinedSent === false) {
            socket = io(process.env.REACT_APP_API);
            socket.emit('join', JSON.parse(JSON.stringify({
                "roomName": roomName,
                "user_name": crypt.encryptMessage(state.username, state.key)
            })));
            setJoinedSent(true);
        }
    }, [state.roomName])

    useEffect(() => {
        try {
            socket.on('chat response', messageHandler);
            socket.on('file response', fileHandler);
            socket.on('join response', joinHandler);
            socket.on('leave response', leaveHandler);
        } catch (err) {
            history.push('/');
            return;
        }
        return() => {
            socket.off('chat response');
            socket.off('file response');
            socket.off('leave response');
        }
    }, []);

    function joinHandler(msg) {
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        if (decryptedUsername !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername} has joined the room.</b></p>
                </div>
            ]);
            playNotification();
            try {
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            console.log(`Not my message: ${msg}`)
        }
    }

    function leaveHandler(msg) {
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        if (decryptedUsername !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername} has left the room.</b></p>
                </div>
            ]);
            playNotification();
            try {
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            console.log(`Not my message: ${msg}`)
        }
    }

    function messageHandler(msg) {
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        var decryptedMessage = crypt.decryptMessage(msg.message, state.key);
        if (decryptedUsername !== '' || decryptedMessage !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername}</b>: {decryptedMessage}</p>
                </div>
            ]);
            playNotification();
            try {
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            console.log(`Not my message: ${msg}`)
        }
    }

    function fileHandler(msg) {
        console.log(msg)
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        var decryptedName = crypt.decryptMessage(msg.name, state.key);
        var decryptedMIME = crypt.decryptMessage(msg.type, state.key);
        if (decryptedUsername !== '') { // if the username is an empty value, stop
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p>
                        <b> {decryptedUsername} sent an attachment</b>.
                        <span class="decrypt"
                            onClick={
                                () => {
                                    handleDecryptClick(msg.data, decryptedName, decryptedMIME)
                                }
                        }> Click to decrypt {decryptedName}.</span>
                    </p>
                </div>
            ]);
            playNotification();
            try {
                divRef.current.scrollIntoView({behavior: 'smooth'});
            } catch(err) {
                return;
            }
        } else {
            console.log(`Not my message: ${
                msg.name
            }`)
        }
    }

    function handleDecryptClick(encryptedData, decryptedName, decryptedMIME) {
        const decryptedData = crypt.decryptMessage(encryptedData, state.key);
        console.log(`[Decrypt Button] Decrypted Data.\n[DecryptButton] Converting base64 to ${decryptedMIME} blob.`)
        const blob = b64toBlob(atob(decryptedData), decryptedMIME);
        console.log("[Decrypt Button] Blob created.");
        console.log(blob)
        saveBlob(blob, decryptedName)
    }

    function broadcastLeave() {
        socket.emit('leave', JSON.parse(JSON.stringify({ // on leave, broadcast to room
            "roomName": state.roomName,
            "user_name": crypt.encryptMessage(state.username, state.key)
        })));
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

    function handleMessageChange(e) {
        setMessage(e.target.value);
    }


    function handleLeave() {
        broadcastLeave();
        history.push('/');
    }

    function handleSend() {
        console.log("[Send Button] Clicked.")
        if (message === '') {
            console.log("[Send Button] Message is empty. Returning.")
            return;
        }

        if (fileSelected === true) {
            open();
            console.log("[Send Button] Attachment mode.");

            // Define the FileReader which is able to read the contents of Blob
            var reader = new FileReader();

            reader.readAsDataURL(fileObject) // Reader Object, contains base64 data

            reader.onload = function () { // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
                var b64 = reader.result.replace(/^data:.+;base64,/, '');
                var encodedData = retrieveB64FromBlob(reader.result);
                console.log(`[Send Button] Base64 encoded data. Sending ${
                    fileObject.type
                }.`)
                socket.emit('file event', JSON.parse(JSON.stringify({
                    "roomName": state.roomName,
                    "user_name": crypt.encryptMessage(state.username, state.key),
                    "name": crypt.encryptMessage(file.name, state.key),
                    "type": crypt.encryptMessage(fileObject.type, state.key),
                    "data": crypt.encryptMessage(encodedData, state.key)
                })))
                console.log("[Send Button] Data sent.");
                setMessage('');
                setFileSelected(false);
                setFile(null);
                setFileObject(null);
                setMessageIcon('faPaperclip')
                setDisabled(false);
                close();
            };
            return;
        }
        console.log("[Send Button] Message mode.")

        socket.emit('chat event', JSON.parse(JSON.stringify({
            "roomName": state.roomName,
            "user_name": crypt.encryptMessage(state.username, state.key),
            "message": crypt.encryptMessage(message, state.key)
        })));
        setDisabled(false);
        setMessage('')
    }

    function handleMessageKeyDown(e) {
        if (e.keyCode === 13) {
            handleSend();
        }
    }

    function handleInputChange(event) {
        setFileSelected(true);
        var binaryData = [];
        binaryData.push(event.target.files[0]);
        try {
            setFileObject(new Blob(binaryData, {type: event.target.files[0].type}))
        } catch (err) {
            setFileSelected(false);
            setFileObject(null);
            return;
        }
        var thisFile = event.target.files[0];
        setFile(thisFile);
        const sizeMB = thisFile.size / 1024000;
        if (sizeMB > process.env.REACT_APP_SIZE_LIMIT) {
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
        console.log("[Message Button] Clicked.")
        if (messageIcon === 'faPaperclip' && fileSelected === false) {
            console.log("[Message Button] Attachment selection mode.")
            hiddenFileInput.current.click();
        } else if (messageIcon === 'faTimes' && fileSelected === true) {
            console.log("[Message Button] Attachment removal mode.")
            setFileSelected(false);
            setFile(null);
            setMessage('');
            setDisabled(false);
            setMessageIcon('faPaperclip');
        }
    }

    function handleEmojiButtonClick() {
        if (showEmojiPicker === true) {
            setShowEmojiPicker(false);
            return;
        }
        setShowEmojiPicker(true);
    }

    function onEmojiClick(event, emojiObject) {
        setMessage(message.concat(emojiObject.emoji))
    }

    // Return

    return (<React.Fragment>
        <Helmet>
            <link rel="stylesheet" href="/styles/Chat.css"/>
        </Helmet>
        <div class="chatbox-parent" id="chatbox-parent">
            <div class="chatbox-child">
                <div class="chatbox-header">
                    <p class="keyname" id="keyname">Room Key: {
                        state.key
                    }</p>
                    <h1 class="chatbox-title">CryptoChat</h1>
                    <h2 class="chatbox-subtitle">
                        A stunning encrypted chat webapp.
                    </h2>
                </div>
                <div class="chatbox-messages">
                    <div class="messageviewer-parent">
                        <div id="messageviewer" name="messageviewer" class="messageviewer">
                            <div class="messagetxt"> {received}</div>
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
                                    onChange={handleMessageChange}
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
                                    <Picker onEmojiClick={onEmojiClick}/>
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
            isOpen={showDialog}
            onDismiss={close}>
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
