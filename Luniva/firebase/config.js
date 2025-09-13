import { initializeApp } from "firebase/app";
import {
  getFirestore, serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const { API_KEY_FIREBASE, AUTH_DOMAIN_FIREBASE, PROJECT_ID_FIREBASE, STORAGE_BUCKET_FIREBASE, MESSAGING_SENDER_ID_FIREBASE, APP_ID_FIREBASE, MEASUREMENT_ID_FIREBASE } = Constants.expoConfig.extra.eas;

const firebaseConfig = {
  apiKey: API_KEY_FIREBASE,
  authDomain: AUTH_DOMAIN_FIREBASE,
  projectId: PROJECT_ID_FIREBASE,
  storageBucket: STORAGE_BUCKET_FIREBASE,
  messagingSenderId: MESSAGING_SENDER_ID_FIREBASE,
  appId: APP_ID_FIREBASE,
  measurementId: MEASUREMENT_ID_FIREBASE
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const ts = serverTimestamp;
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});