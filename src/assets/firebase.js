import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0jyidsYu8-DQyLun9UJadbkScCZVdV3I",
  authDomain: "three-shop-78da4.firebaseapp.com",
  projectId: "three-shop-78da4",
  storageBucket: "three-shop-78da4.firebasestorage.app",
  messagingSenderId: "709138116138",
  appId: "1:709138116138:web:853404f6d7bd793a95dd53"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db}