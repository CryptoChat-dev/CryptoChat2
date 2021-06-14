import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {useHistory} from 'react-router-dom';

const loader = document.querySelector('.loader');
const overlay = document.querySelector('.overlay');
var showLoader;
var hideLoader;

try {
    showLoader = () => {loader.classList.remove('loader--hide'); overlay.classList.remove('overlay--hide')};
    hideLoader = () => {loader.remove('loader'); overlay.remove('overlay')};
} catch (err) {
    useHistory.push('/');
}

ReactDOM.render (<React.StrictMode>
    <App hideLoader={hideLoader}
        showLoader={showLoader}/>
</React.StrictMode>, document.getElementById('root'));

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) { // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) { // Registration Failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
