import io from "socket.io-client";

export var socket;

socket = io(process.env.REACT_APP_API); // Initiate the socket connection to the API
