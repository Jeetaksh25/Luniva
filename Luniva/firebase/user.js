import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config"; // Remove ts import

/** Create the /users/{uid} doc if missing */
export async function ensureUserDoc(user, { username = null } = {}) {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    const base = {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? null,
      username: username ?? (user.displayName?.toLowerCase()?.replace(/\s+/g, '') ?? ""),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      dailyStreak: 0,
      streakUpdatedOn: null,
    };

    if (!snap.exists()) {
      await setDoc(ref, base);
      console.log("User document created");
    } else {
      await updateDoc(ref, { lastLogin: serverTimestamp() });
      console.log("User document updated");
    }
  } catch (error) {
    console.error("Error in ensureUserDoc:", error);
    throw error;
  }
}