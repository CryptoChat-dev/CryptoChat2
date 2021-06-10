import React, {useContext, useEffect, useRef} from 'react';
import {Helmet} from 'react-helmet';
import {Context} from '../Components/Store';
import {useHistory} from 'react-router-dom';
import useSound from 'use-sound';
import notificationSound from '../assets/notification.mp3';

// Crypto JS
import CryptoJS from 'crypto-js';

// Icons

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faPaperclip, faTimes} from '@fortawesome/free-solid-svg-icons'

// Socket.IO
import io from "socket.io-client";
let socket;


export const initiateSocket = (room) => {
    socket = io(process.env.REACT_APP_API);
    var roomName = CryptoJS.SHA512(room).toString();
    socket.emit('join', roomName)
}

var blobToBase64 = function (blob, callback) {
    var reader = new FileReader();
    reader.onload = function () {
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        callback(base64);
    };
    reader.readAsDataURL(blob);
};

const Chat = () => {
    const history = useHistory();
    const divRef = useRef(null);
    const [playNotification] = useSound(notificationSound);
    const hiddenFileInput = React.useRef(null);

    const [state, dispatch] = useContext(Context);

    const [message, setMessage] = React.useState();
    const [messageIcon, setMessageIcon] = React.useState('faPaperclip')

    const [fileSelected, setFileSelected] = React.useState(false);
    const [file, setFile] = React.useState('');
    const [fileObject, setFileObject] = React.useState(null);

    const [received, setReceived] = React.useState([]);
    const [joinedSent, setJoinedSent] = React.useState(false);
    const [disabled, setDisabled] = React.useState(false);
    var themeSetting;


    // Helper Functions

    const crypt = (function () { // encryption function
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

    useEffect(() => {
        if (state.key === null || state.username === null) {
            history.push('/');
            return;
        }

        var roomName = CryptoJS.SHA512(state.key).toString();

        dispatch({type: 'SET_ROOM', payload: roomName});

        initiateSocket(state.key);

        if (joinedSent === false) {
            var greetingMessage = JSON.parse(JSON.stringify({ // on join, broadcast to room
                "roomName": roomName,
                "user_name": crypt.encryptMessage(state.username, state.key),
                "message": crypt.encryptMessage('has joined the room.', state.key)
            }));
            console.log(greetingMessage)
            socket.emit('chat event', greetingMessage);
            setJoinedSent(true);
        }
    }, [state.roomName])

    useEffect(() => {
        window.onbeforeunload = broadcastLeave;
        try {
            socket.on('chat response', messageHandler);
            socket.on('file response', fileHandler)
        } catch (err) {
            history.push('/');
            return;
        }
        return() => {
            socket.off('chat response');
            socket.off('file response');
        }
    }, []);

    function messageHandler(msg) {
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        var decryptedMessage = crypt.decryptMessage(msg.message, state.key);
        if (decryptedUsername !== '' || decryptedMessage !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p> <b>{decryptedUsername}</b>: {decryptedMessage}</p>
                </div>
            ]);
            playNotification();
            divRef.current.scrollIntoView({behavior: 'smooth'});
        } else {
            console.log(`Not my message: ${msg}`)
        }
    }

    function fileHandler(msg) {
        var decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        var decryptedName = crypt.decryptMessage(msg.name, state.key);
        if (decryptedUsername !== '') { // if the username is an empty value, stop
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p><b>{decryptedUsername} sent an attachment</b>. Decrypt {decryptedName}.</p>
                </div>
            ]);
            playNotification();
            divRef.current.scrollIntoView({behavior: 'smooth'});
        } else {
            console.log(`Not my message: ${msg.name}`)
        }
    }

    function broadcastLeave() {
        socket.emit('chat event', JSON.parse(JSON.stringify({ // on leave, broadcast to room
            "roomName": state.roomName,
            "user_name": crypt.encryptMessage(state.username, state.key),
            "message": crypt.encryptMessage('has left the room.', state.key)
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
            console.log("[Send Button] Attachment mode.");

            // Define the FileReader which is able to read the contents of Blob
            var reader = new FileReader();

            reader.onload = function () {
                // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
                var b64 = reader.result.replace(/^data:.+;base64,/, '');
            };

            reader.readAsDataURL(fileObject) // Reader Object, contains base64 data
            console.log("[Send Button] Base64 encoded data. Sending...")
            console.log(reader)
            socket.emit('file event', JSON.parse(JSON.stringify({
                "roomName": state.roomName,
                "name": crypt.encryptMessage(file.name, state.key),
                "data": crypt.encryptMessage(reader.result, state.key)
            })))
            console.log("[Send Button] Data sent.");
            setMessage('');
            setFileSelected(false);
            setFile(null);
            setFileObject(null);
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
        setFileObject(new Blob(binaryData))
        var thisFile = event.target.files[0];
        setFile(thisFile);
        const sizeMB = thisFile.size / 1024000;
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
                    {/* <img src={fileObject}></img> */} </div>
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
                            </div>
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

    </React.Fragment>)
}
export default Chat;
