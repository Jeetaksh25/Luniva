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
      // Check if we need to update streak
      const userData = snap.data();
      const lastLoginDate = userData.lastLogin?.toDate();
      const today = new Date();
      
      // Reset streak if more than 1 day has passed since last login
      if (lastLoginDate && (today - lastLoginDate) > 24 * 60 * 60 * 1000) {
        await updateDoc(ref, { 
          lastLogin: serverTimestamp(), // ✅ WITH parentheses
          dailyStreak: 0,
          streakUpdatedOn: serverTimestamp() // ✅ WITH parentheses
        });
        console.log("Streak reset due to gap");
      } else {
        await updateDoc(ref, { lastLogin: serverTimestamp() }); // ✅ WITH parentheses
        console.log("User document updated");
      }
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

    // Convert lastStreakUpdate to date string
    let lastStreakUpdate = userData.streakUpdatedOn;
    if (lastStreakUpdate && lastStreakUpdate.toDate) {
      lastStreakUpdate = lastStreakUpdate.toDate().toISOString().split('T')[0];
    } else if (lastStreakUpdate && typeof lastStreakUpdate === 'string') {
      lastStreakUpdate = lastStreakUpdate.split('T')[0];
    }

    console.log("Today:", today, "Chat date:", chatDate, "Last update:", lastStreakUpdate);
    
    // Only update streak if:
    // 1. This is today's chat OR yesterday's chat (in case user chats after midnight)
    // 2. AND streak hasn't been updated today
    // 3. AND the chat has meaningful content (not just system messages)
    if ((chatDate === today || chatDate === yesterdayStr) && 
        lastStreakUpdate !== today) {
      
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