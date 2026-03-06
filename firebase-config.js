// Firebase Configuration for Mars Algoritmika
// Using Firebase v9 Compat libraries for easier browser usage

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBd_9fUGo1FG3_tddxiCJyHTQWCgFUSw3s",
    authDomain: "mars-181d0.firebaseapp.com",
    databaseURL: "https://mars-181d0-default-rtdb.firebaseio.com",
    projectId: "mars-181d0",
    storageBucket: "mars-181d0.firebasestorage.app",
    messagingSenderId: "29093363218",
    appId: "1:29093363218:web:e087a0493aa48dcb0962cb",
    measurementId: "G-XB53DG0TSF"
};

// Initialize Firebase when the script loads
firebase.initializeApp(firebaseConfig);

// Make firebase available globally
window.firebase = firebase;

console.log("Firebase initialized successfully!");
