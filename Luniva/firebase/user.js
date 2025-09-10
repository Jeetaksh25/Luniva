import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { getTodayDateString } from "@/utils/dateUtils";

// Ensure user document exists and handle streak reset
export async function ensureUserDoc(user, extraData = {}) {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    const base = {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? null,
      username:
        extraData.username ?? (user.displayName?.toLowerCase()?.replace(/\s+/g, "") ?? ""),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      dailyStreak: 0,
      streakUpdatedOn: serverTimestamp(),
      highestStreak: 0,
      totalDaysChatted: 0,
      totalMessages: 0,
      gender: extraData.gender?.trim() || null,
      dob: extraData.dob?.trim() || null,
    };

    if (!snap.exists()) {
      await setDoc(ref, base);
      console.log("✅ User document created");
    } else {
      const updates = {
        lastLogin: serverTimestamp(),
        gender: extraData.gender ?? snap.data().gender ?? null,
        dob: extraData.dob ?? snap.data().dob ?? null,
      };

      await updateDoc(ref, updates);
      console.log("✅ User document updated with extraData");
    }
  } catch (error) {
    console.error("❌ Error in ensureUserDoc:", error);
    throw error;
  }
}

// Update streak after a chat, with optional missed-day check
export async function updateUserStreak(uid, chatDate, dailyChats = null) {
  try {
    console.log("Updating streak for:", uid, "chat date:", chatDate);

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let lastStreakUpdate = null;
    if (userData.streakUpdatedOn?.toDate) {
      lastStreakUpdate = userData.streakUpdatedOn.toDate().toISOString().split("T")[0];
    }

    // ✅ Reset streak if yesterday was missed
    if (dailyChats && shouldResetStreak(dailyChats, today)) {
      await updateDoc(userRef, {
        dailyStreak: 0,
        streakUpdatedOn: new Date()
      });
      console.log("⚠️ Resetting streak because yesterday was missed");
      return 0;
    }

    console.log("Today:", today, "Chat date:", chatDate, "Last update:", lastStreakUpdate);

    // ✅ Block duplicate increments on same day
    if (lastStreakUpdate === today) {
      console.log("⏸ Already updated today, skipping increment");
      return userData.dailyStreak;
    }

    // ✅ Increment only if today or yesterday
    if (chatDate === today || chatDate === yesterdayStr) {
      const newStreak = (userData.dailyStreak || 0) + 1;
      const newHighest = Math.max(newStreak, userData.highestStreak || 0);

      await updateDoc(userRef, {
        dailyStreak: newStreak,
        highestStreak: newHighest,
        streakUpdatedOn: new Date() // store plain date string instead of serverTimestamp()
      });

      console.log("✅ Streak updated to:", newStreak);
      return newStreak;
    }

    console.log("❌ Streak not updated - conditions not met");
    return userData.dailyStreak || 0;
  } catch (error) {
    console.error("❌ Error updating streak:", error);
    throw error;
  }
}

export async function saveProfilePhoto(uid, base64String) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { photoBase64: base64String });
    console.log("✅ Profile photo updated");
  } catch (error) {
    console.error("❌ Error saving profile photo:", error);
    throw error;
  }
}