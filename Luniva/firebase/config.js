import { initializeApp } from "firebase/app";
import {
  getFirestore, serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAMorls1MDit3VCC07roneVaWTO-zX0vrQ",
  authDomain: "luniva-201a7.firebaseapp.com",
  projectId: "luniva-201a7",
  storageBucket: "luniva-201a7.firebasestorage.app",
  messagingSenderId: "612272065500",
  appId: "1:612272065500:web:727e8ef7922d3b452ddd19",
  measurementId: "G-KGJ5W8NT7T"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const ts = serverTimestamp;
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});