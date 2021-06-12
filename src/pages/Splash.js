// Modules
import React, {useContext} from 'react';
import {Helmet} from 'react-helmet';
import {Context} from '../Components/Store';
import {useHistory} from 'react-router-dom';

// Reach UI

import {Dialog} from "@reach/dialog";
import "@reach/dialog/styles.css"

// Files
import {scorePassword, getWordNum} from '../utils/password';

// Code

const Splash = () => {
    const history = useHistory();
    
    // State Variables

    const [state, dispatch] = useContext(Context);
    const [key, setKey] = React.useState('');
    const [username, setUsername] = React.useState('');

    const [showDialog, setShowDialog] = React.useState(false);
    const open = () => setShowDialog(true);
    const close = () => setShowDialog(false);

    const [showEVDialog, setShowEVDialog] = React.useState(false);
    const openEV = () => setShowEVDialog(true);
    const closeEV = () => setShowEVDialog(false);

    // Handler functions

    var themeSetting;

    function changeTheme() {
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

    function handleJoin() {
        // Handle join click

        // Store the username and key in the global/parent state.
        dispatch({type: 'SET_USERNAME', payload: username});
        dispatch({type: 'SET_KEY', payload: key});
        history.push('/chat'); // Go to the chat page.
    }

    function screening() {
        if (key.length < 1 || username.length < 1) {
            // If there are empty values, stop the user.
            openEV();
            return;
        }

        // Score the key.
        var score = scorePassword(key);        
        if (score < 80) {
            // If key scores less than 80% strength, warn the user.
            open();
            return;
        }

        handleJoin();
    }

    // Return JSX

    return (
        <React.Fragment>
            <Helmet>
                <link rel="stylesheet" href="/styles/Splash.css"></link>
            </Helmet>
            <div id="content">
                <div class="container">
                    <div class="logo"></div>
                    <h1 class="title splash">CryptoChat 2.3</h1>
                    <h2 class="subtitle splash">Simple, secure and ephemeral anonymous messaging.</h2>
                </div>
                <div class="messagebox-parent">
                    <div class="messagebox">
                        <div class="username">
                            <input id="msg" type="username" class="message" placeholder="Username"
                                onChange={
                                    (e) => setUsername(e.target.value)
                                }/>
                            <div class="roomkey">
                                <input id="key" type="username" class="message"
                                    value={key}
                                    placeholder="Room Key"
                                    onChange={
                                        (e) => setKey(e.target.value)
                                    }/>
                                    <div class="randomize-parent">
                                <div class="randomize">
                                    <button class="button randomize" id="randomizer"
                                        onClick={() => {setKey(getWordNum())}}>Random</button>
                                </div>
                                    </div>
                            </div>
                            <div class="buttons">
                                <div class="buttons top">
                                    <button class="button theme" id="toggler"
                                        onClick={changeTheme}>
                                        {
                                        state.oppositeTheme
                                    }</button>
                                    <button class="button join" id="join"
                                        onClick={screening}>Join</button>
                                </div>
                                <div class="buttons bottom">
                                    <button class="button legal"
                                        onClick={
                                            () => {
                                                history.push('/legal')
                                            }
                                    }>Legal</button>
                                    <a href="https://github.com/CryptoChat-dev" rel="noreferrer" target="_blank">
                                        <button class="button github">Github</button>
                                    </a>
                                </div>
                            </div>
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
                    <h1>Weak Key</h1>
                    <p>The key you entered is insecure. It is recommended to use the random button. Do you wish to override?</p>
                    <div class="modalButtons">
                        <button class="modalButton red"
                            onClick={handleJoin}>Yes</button>
                        <button class="button"
                            onClick={close}>No</button>
                    </div>
                </Dialog>
                <Dialog isOpen={showEVDialog}
                    onDismiss={closeEV}
                    style={
                        {
                            backgroundColor: state.modalColor,
                            minWidth: "calc(min(350px,90%))",
                            width: "25%",
                            padding: "2%",
                            textAlign: "center",
                            borderRadius: "10px"
                        }
                }>
                    <h1>Empty Values</h1>
                    <p>You can't have an empty username or key!</p>
                    <div class="modalButtons">
                        <button class="button"
                            onClick={closeEV}>Ok</button>
                    </div>
                </Dialog>

            </div>

        </React.Fragment>
    )
}

export default Splash;
