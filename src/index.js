import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
const loader = document.querySelector('.loader');

// if you want to show the loader when React loads data again
const showLoader = () => loader.classList.remove('loader--hide');

const hideLoader = () => loader.classList.add('loader--hide');
ReactDOM.render (
    <React.StrictMode>
        <App       hideLoader={hideLoader}
      showLoader={showLoader} 
/>
    </React.StrictMode>,
    document.getElementById('root')
);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) { // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) { // Registration Failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}