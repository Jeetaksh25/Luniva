import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";

export async function ensureUserDoc(user, { username = null } = {}) {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    const base = {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? null,
      username: username ?? (user.displayName?.toLowerCase()?.replace(/\s+/g, '') ?? ""),
      createdAt: serverTimestamp(), // ✅ WITH parentheses
      lastLogin: serverTimestamp(), // ✅ WITH parentheses
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
    const today = getTodayDateString(); // Use the corrected function
    
    // Convert lastStreakUpdate to date string if it's a timestamp
    let lastStreakUpdate = userData.streakUpdatedOn;
    if (lastStreakUpdate && lastStreakUpdate.toDate) {
      lastStreakUpdate = lastStreakUpdate.toDate().toISOString().split('T')[0];
    } else if (lastStreakUpdate && lastStreakUpdate.seconds) {
      lastStreakUpdate = new Date(lastStreakUpdate.seconds * 1000).toISOString().split('T')[0];
    }
    
    console.log("Today:", today, "Last update:", lastStreakUpdate, "Current streak:", userData.dailyStreak);
    
    // Only update streak if this is today's chat and streak hasn't been updated today
    if (chatDate === today && lastStreakUpdate !== today) {
      const newStreak = (userData.dailyStreak || 0) + 1;
      await updateDoc(userRef, {
        dailyStreak: newStreak,
        streakUpdatedOn: serverTimestamp()
      });
      console.log("✅ Streak updated to:", newStreak);
    } else {
      console.log("❌ Streak not updated - conditions not met");
    }
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}