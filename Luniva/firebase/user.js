import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { getTodayDateString,isToday, isPastDate, isFutureDate } from "@/utils/dateUtils";

export async function ensureUserDoc(user, { username = null } = {}) {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    const base = {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? null,
      username:
        username ??
        (user.displayName?.toLowerCase()?.replace(/\s+/g, "") ?? ""),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      dailyStreak: 0,
      streakUpdatedOn: null,
    };

    if (!snap.exists()) {
      await setDoc(ref, base);
      console.log("User document created");
    } else {
      // Only update lastLogin - streak reset handled in updateUserStreak
      await updateDoc(ref, { lastLogin: serverTimestamp() });
      console.log("User document updated");
    }
  } catch (error) {
    console.error("Error in ensureUserDoc:", error);
    throw error;
  }
}

export async function updateUserStreak(uid, chatDate) {
  try {
    console.log("Updating streak for:", uid, "chat date:", chatDate);

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log("User document doesn't exist");
      return;
    }

    const userData = userSnap.data();
    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // --- Normalize lastStreakUpdate ---
    let lastStreakUpdate = userData.streakUpdatedOn;
    if (lastStreakUpdate?.toDate) {
      lastStreakUpdate = lastStreakUpdate.toDate().toISOString().split('T')[0];
    } else if (typeof lastStreakUpdate === 'string') {
      lastStreakUpdate = lastStreakUpdate.split('T')[0];
    }

    console.log("Today:", today, "Chat date:", chatDate, "Last update:", lastStreakUpdate);

    // --- NEW: Streak Reset Logic ---
    if (lastStreakUpdate && lastStreakUpdate !== today && lastStreakUpdate !== yesterdayStr) {
      console.log("⚠️ Gap detected - resetting streak to 0");
      await updateDoc(userRef, { dailyStreak: 0 });
    }

    // --- Existing Streak Update Logic ---
    if ((chatDate === today || chatDate === yesterdayStr) && lastStreakUpdate !== today) {
      const newStreak = (userData.dailyStreak || 0) + 1;
      await updateDoc(userRef, {
        dailyStreak: newStreak,
        streakUpdatedOn: serverTimestamp()
      });
      console.log("✅ Streak updated to:", newStreak);
      return newStreak;
    } else {
      console.log("❌ Streak not updated - conditions not met");
      return userData.dailyStreak || 0;
    }
  } catch (error) {
    console.error("Error updating streak:", error);
    throw error;
  }
}
