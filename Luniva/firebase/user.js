import {
    doc, getDoc, setDoc, updateDoc
  } from "firebase/firestore";
  import { db, ts } from "./config";
  
  /** Create the /users/{uid} doc if missing */
  export async function ensureUserDoc(user, { username = null,} = {}) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
  
    const base = {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? null,
      username: username ?? (user.displayName?.toLowerCase()?.replace(/\s+/g,'') ?? ""),
      createdAt: ts(),
      lastLogin: ts(),
      dailyStreak: 0,
      streakUpdatedOn: null,
    };
  
    if (!snap.exists()) {
      await setDoc(ref, base);
    } else {
      await updateDoc(ref, { lastLogin: ts()});
    }
  }
  