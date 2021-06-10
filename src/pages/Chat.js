import React, {useContext, useEffect, useRef} from 'react';
import {Helmet} from 'react-helmet';
import {Context} from '../Components/Store';
import {useHistory} from 'react-router-dom';
import useSound from 'use-sound';
import notificationSound from '../assets/notification.mp3';

// Crypto JS
import CryptoJS from 'crypto-js';

// Socket.IO
import io from "socket.io-client";
let socket;

export const initiateSocket = (room) => {
    socket = io(process.env.REACT_APP_API);
    var roomName = CryptoJS.SHA512(room).toString();
    socket.emit('join', roomName)
}

const Chat = () => {
    const history = useHistory();
    const divRef = useRef(null);
    const [playNotification] = useSound(notificationSound);

    const [state, dispatch] = useContext(Context);
    const [message, setMessage] = React.useState();
    const [received, setReceived] = React.useState([]);
    const [joinedSent, setJoinedSent] = React.useState(false);

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

        dispatch({
            type: 'SET_ROOM',
            payload: roomName
        });

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
        socket.on('my response', messageHandler);
        return() => {
            socket.off('my response')
        }
    }, []);

    function messageHandler(msg) {
        var decryptedUsername;
        var decryptedMessage;
        decryptedUsername = crypt.decryptMessage(msg.user_name, state.key);
        decryptedMessage = crypt.decryptMessage(msg.message, state.key);
        if (decryptedUsername !== '' || decryptedMessage !== '') { // if the username and message are empty values, stop
            console.log(msg); // for debugging: print the encrypted contents of the response
            setReceived((messages) => [
                ...messages,
                <div ref={divRef}>
                    <p> {decryptedUsername}: {decryptedMessage}</p>
                </div>
            ]);
            playNotification();
            divRef.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.log(`Not my message: ${msg}`)
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
        if (message === '') {
            return;
        }
        socket.emit('chat event', JSON.parse(JSON.stringify({ // on leave, broadcast to room
            "roomName": state.roomName,
            "user_name": crypt.encryptMessage(state.username, state.key),
            "message": crypt.encryptMessage(message, state.key)
        })));
        setMessage('')
    }

    function handleMessageKeyDown(e) {
        if (e.keyCode === 13) {
            handleSend();
        }
    }

    // Return

    return (
        <React.Fragment>
            <Helmet>
                <link rel="stylesheet" href="/styles/Chat.css"/> {/* <script src="/crypto-js/aes.js"></script> */} </Helmet>
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
                                <div class="messagetxt">
                                    {received}</div>
                            </div>
                        </div>
                        <div class="messagebox">
                            <div class="fields">
                                <div class="username">
                                    <input id="msg" type="text" class="message" placeholder="What's up?"
                                        value={message}
                                        onChange={handleMessageChange}
                                        onKeyDown={handleMessageKeyDown}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chatbox-buttons">
                        <button class="button theme" id="toggler"
                            onClick={changeTheme}>
                            {
                            state.oppositeTheme
                        }</button>
                        <button class="button send" id="sendbutton"
                            onClick={handleSend}>Send</button>
                        <button class="button leave" id="leavebutton"
                            onClick={handleLeave}>Leave</button>
                    </div>
                </div>
            </div>

        </React.Fragment>
    )
}
export default Chat;
