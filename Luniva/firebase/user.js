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
export async function ensureUserDoc(user, { username = null, dailyChats = [] } = {}) {
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
      streakUpdatedOn: serverTimestamp(),
      highestStreak: 0,
      totalDaysChatted: 0,
      totalMessages: 0,

      gender: user.gender ?? null,
      dob: user.dob ?? null,
    };

    if (!snap.exists()) {
      await setDoc(ref, base);
      console.log("✅ User document created");
    } else {
      const userData = snap.data();
      const today = getTodayDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let lastUpdate = userData.streakUpdatedOn;
      if (lastUpdate?.toDate) {
        lastUpdate = lastUpdate.toDate().toISOString().split("T")[0];
      } else if (typeof lastUpdate === "string") {
        lastUpdate = lastUpdate.split("T")[0];
      } else {
        lastUpdate = null;
      }

      const updates = { lastLogin: serverTimestamp() };

      // 🔑 check missed-day logic from dailyChats first
      if (dailyChats.length && shouldResetStreak(dailyChats, today)) {
        console.log("⚠️ Resetting streak because yesterday was missed");
        updates.dailyStreak = 0;
      }
      // fallback: check gap based on streakUpdatedOn
      else if (!lastUpdate || (lastUpdate !== today && lastUpdate !== yesterdayStr)) {
        console.log("⚠️ Resetting streak due to gap:", lastUpdate, "→", today);
        updates.dailyStreak = 0;
        updates.streakUpdatedOn = serverTimestamp();
      }

      await updateDoc(ref, updates);
      console.log("✅ User document updated with streak check");
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

    if (!userSnap.exists()) {
      console.log("❌ User document doesn't exist");
      return;
    }

    const userData = userSnap.data();
    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let lastStreakUpdate = userData.streakUpdatedOn;
    if (lastStreakUpdate?.toDate) {
      lastStreakUpdate = lastStreakUpdate.toDate().toISOString().split("T")[0];
    } else if (typeof lastStreakUpdate === "string") {
      lastStreakUpdate = lastStreakUpdate.split("T")[0];
    } else {
      lastStreakUpdate = null;
    }

    // ✅ reset streak if dailyChats shows a missed day
    if (dailyChats && shouldResetStreak(dailyChats, today)) {
      await updateDoc(userRef, {
        dailyStreak: 0,
        streakUpdatedOn: serverTimestamp()
      });
      console.log("⚠️ Resetting streak because yesterday was missed");
      return 0;
    }

    console.log("Today:", today, "Chat date:", chatDate, "Last update:", lastStreakUpdate);

    // ✅ increment if today/yesterday
    // ✅ also allow increment when streak is 0 (fresh reset case)
    if ((chatDate === today || chatDate === yesterdayStr) &&
        (lastStreakUpdate !== today || userData.dailyStreak === 0)) {
      const newStreak = (userData.dailyStreak || 0) + 1;
      const newHighest = Math.max(newStreak, userData.highestStreak || 0);

      await updateDoc(userRef, {
        dailyStreak: newStreak,
        highestStreak: newHighest,
        streakUpdatedOn: serverTimestamp()
      });
      console.log("✅ Streak updated to:", newStreak);
      return newStreak;
    } else {
      console.log("❌ Streak not updated - conditions not met");
      return userData.dailyStreak || 0;
    }
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