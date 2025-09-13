import { create } from "zustand";
import { auth } from "../firebase/config";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ensureUserDoc, saveProfilePhoto } from "../firebase/user";
import {
  createChat,
  getOrCreateDailyChat,
  sendUserMessage,
  sendAIMessage,
  watchMessages,
  getChatsForMonth,
  checkChatHasMessages,
  getAllUserChats,
} from "../firebase/chat";
import {
  doc,
  getDocs,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getTodayDateString, isToday } from "@/utils/dateUtils";
import { transformUserMessage } from "@/utils/transformPrompt";
import { increment } from "firebase/firestore";
import Constants from "expo-constants";

const {API_KEY_GEMINI} = Constants.expoConfig.extra.eas;


const API_KEY = API_KEY_GEMINI;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export const useStore = create((set, get) => ({
  user: null,
  chats: [],
  messages: [],
  loading: false,
  currentChatId: null,
  loadingAuth: true,
  loadingChat: false,
  currentDate: getTodayDateString(),
  isAiTyping: false,
  unsubscribeMessages: null,
  userStats: null,

  initAuth: () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
          try {
            await ensureUserDoc(authUser);
            const userRef = doc(db, "users", authUser.uid);
  
            // Listen to Firestore user doc changes
            const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()) {
                const userData = docSnap.data();
  
                // Merge auth user info and Firestore fields
                const mergedUser = {
                  uid: authUser.uid,
                  email: authUser.email,
                  displayName: authUser.displayName,
                  photoURL: authUser.photoURL,
                  ...userData,
                };
  
                set({ user: mergedUser });
                get().updateUserStats(); // Recalculate stats
              }
            });
  
            // Fetch Firestore user data once initially to avoid empty fields
            const initialDoc = await getDoc(userRef);
            const initialData = initialDoc.exists() ? initialDoc.data() : {};
            const mergedInitialUser = {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL,
              ...initialData,
            };
  
            set({
              user: mergedInitialUser,
              loadingAuth: false,
              unsubscribeUser,
              currentDate: getTodayDateString(),
            });
  
            await get().updateUserStats();
            await get().createTodayChat();
          } catch (error) {
            console.error("Error ensuring user doc:", error);
            set({ user: null, loadingAuth: false });
          }
        } else {
          set({ user: null, loadingAuth: false });
        }
        resolve();
      });
    });
  },
  

  signup: async (email, password, displayName, dob, gender) => {
    set({ loading: true, error: null });
  
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
  
      if (displayName?.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
  
      // Prepare Firestore payload
      const username = displayName?.trim() || cred.user.uid;
      const payload = {
        username: displayName?.trim() || cred.user.uid,
        dob: dob?.trim() || null,
        gender: gender?.trim() || null,
        email: email?.trim(),
      };
      await ensureUserDoc(cred.user, payload);
  
      const freshUserDoc = await get().getUserData();
  
      set({
        user: { ...cred.user, ...(freshUserDoc || {}) },
        loading: false,
      });
  
      await get().initAuth();
      await get().createTodayChat();
    } catch (error) {
      console.error("Signup error:", error);
      set({ error, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user);
      await get().initAuth();
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const { unsubscribeUser, unsubscribeMessages } = get();

    // ✅ First unsubscribe from ALL listeners
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeMessages) unsubscribeMessages();

    // ✅ Also check if there are any other listeners that might be active
    // For example, if you have chat listeners in other components

    // ✅ THEN sign out
    await signOut(auth);

    set({
      user: null,
      chats: [],
      messages: [],
      currentChatId: null,
      unsubscribeUser: null,
      unsubscribeMessages: null,
      userStats: null,
    });
  },

  // --- CHATS ---

  // In your useStore
  // In your useStore - FIXED sendMessage function
  sendMessage: async (text) => {
    const { user, chats, sendAIResponse } = get();
    if (!user) {
      console.error("No user found");
      return;
    }

    const todayStr = getTodayDateString();

    // Ensure today's chat exists and update currentChatId
    const newChatId = await getOrCreateDailyChat(user.uid, todayStr);
    set({ currentChatId: newChatId, currentDate: todayStr });

    // Use the updated currentChatId
    const chatId = get().currentChatId;

    try {
      console.log("Sending message:", text);

      // ✅ Save user message
      await sendUserMessage(user.uid, chatId, text);

      // ✅ Update stats in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { totalMessages: increment(1) });

      const chatRef = doc(db, "users", user.uid, "chats", todayStr);
      const chatSnap = await getDoc(chatRef);
      const chatData = chatSnap.data();

      if (chatData && !chatData.firstMessageLogged) {
        await updateDoc(userRef, { totalDaysChatted: increment(1) });
        await updateDoc(chatRef, { firstMessageLogged: true });
      }

      // ✅ Show typing indicator
      set({ isAiTyping: true });

      // ✅ Send to Gemini API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: transformUserMessage(text, user) }] }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "AI API Error");

      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text
          ?.replace(/\*\*(.*?)\*\*/g, "$1")
          ?.trim() || "No AI response";

      console.log("AI Response:", aiText);

      // Reload chats for today
      await get().loadDailyChats(
        new Date().getMonth(),
        new Date().getFullYear()
      );

      // Save AI message
      await sendAIResponse(aiText);

      await get().updateUserStats();
    } catch (err) {
      console.error("AI Error:", err);
      await sendAIMessage(
        user.uid,
        chatId,
        "Sorry, I encountered an error. Please try again."
      );
    } finally {
      set({ isAiTyping: false });
    }
  },

  loadDailyChats: async (month, year) => {
    const { user } = get();
    if (!user) return;

    const today = new Date();
    const currentMonth = month ?? today.getMonth();
    const currentYear = year ?? today.getFullYear();

    // Get ALL chats regardless of month
    const allChats = await getAllUserChats(user.uid);

    const dailyChats = [];
    const todayStr = getTodayDateString();
    const todayDate = new Date(todayStr);
    todayDate.setHours(0, 0, 0, 0);

    // Load dates for the current month PLUS any dates from previous months that have chats
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const chatData = allChats[dateStr];
      let status = "upcoming";
      const chatDate = new Date(dateStr);
      chatDate.setHours(0, 0, 0, 0);

      // Check if this chat exists
      if (chatData) {
        const hasMessages = await checkChatHasMessages(user.uid, dateStr);

        if (hasMessages) {
          status = "done";
        } else if (chatDate < todayDate) {
          status = "missed";
        } else if (chatDate.getTime() === todayDate.getTime()) {
          status = "pending";
        }
      } else if (chatDate < todayDate) {
        status = "missed";
      } else if (chatDate.getTime() === todayDate.getTime()) {
        status = "pending";
      }

      dailyChats.push({
        date: dateStr,
        chatId: chatData ? dateStr : null,
        status,
      });
    }

    // ADD THIS: Also include any chats from previous months that exist
    Object.keys(allChats).forEach(async (dateStr) => {
      // Skip if already included in current month
      if (dailyChats.find((chat) => chat.date === dateStr)) return;

      // Only include past dates that have messages
      const chatDate = new Date(dateStr);
      chatDate.setHours(0, 0, 0, 0);

      if (chatDate < todayDate) {
        const hasMessages = await checkChatHasMessages(user.uid, dateStr);
        if (hasMessages) {
          dailyChats.push({
            date: dateStr,
            chatId: dateStr,
            status: "done",
          });
        }
      }
    });

    console.log("📅 Loaded daily chats:", dailyChats);
    set({ chats: dailyChats });
  },

  openDailyChat: async (date) => {
    const { user, loadMessages } = get();
    if (!user) return;

    try {
      console.log("Opening daily chat for date:", date);

      const todayStr = getTodayDateString();

      // Ensure daily chat exists before opening
      let chatId = date;
      const currentChatRef = doc(db, "users", user.uid, "chats", date);
      const chatSnap = await getDoc(currentChatRef);

      if (!chatSnap.exists()) {
        console.log("Chat doesn't exist, creating...");
        chatId = await getOrCreateDailyChat(user.uid, date);
      }

      // If opening today's chat, always ensure correct chat
      if (date === todayStr) {
        const newChatId = await getOrCreateDailyChat(user.uid, todayStr);
        chatId = newChatId;
      }

      set({ currentChatId: chatId, currentDate: date });

      // Load messages for this chat
      const unsubscribe = loadMessages(chatId);
      return unsubscribe;
    } catch (error) {
      console.error("Error opening daily chat:", error);
      Alert.alert("Error", "Could not open chat for this date");
    }
  },

  startChat: async (title) => {
    const { user } = get();
    if (!user) return;
    const chatId = await createChat(user.uid, title);
    set({ currentChatId: chatId });
  },

  loadMessages: (chatId) => {
    const { user } = get();
    if (!user) return;

    // Unsubscribe previous messages if any
    if (get().unsubscribeMessages) {
      get().unsubscribeMessages();
    }

    const unsubscribe = watchMessages(user.uid, chatId, (messages) =>
      set({ messages })
    );

    set({ currentChatId: chatId, unsubscribeMessages: unsubscribe });
    return unsubscribe;
  },

  // --- MESSAGING ---
  sendAIResponse: async (text, extra) => {
    const { user, currentChatId } = get();
    if (!user || !currentChatId) return;
    await sendAIMessage(user.uid, currentChatId, text, extra);
  },
  // In your useStore
  createTodayChat: async () => {
    const { user, chats, loadingChat } = get();
    if (!user) {
      console.error("No user found when creating today's chat");
      return null;
    }

    if (loadingChat) return null;

    set({ loadingChat: true });

    const todayStr = getTodayDateString();
    console.log("🔄 Creating/ensuring chat for today:", todayStr);

    try {
      const newChatId = await getOrCreateDailyChat(user.uid, todayStr);
      if (!newChatId) {
        console.error("Failed to get or create today's chat");
        return null;
      }

      // Update or add chat
      const existingChatIndex = chats.findIndex((c) => c.date === todayStr);
      const updatedChats =
        existingChatIndex >= 0
          ? [
              ...chats.slice(0, existingChatIndex),
              { date: todayStr, chatId: newChatId, status: "pending" },
              ...chats.slice(existingChatIndex + 1),
            ]
          : [
              ...chats,
              { date: todayStr, chatId: newChatId, status: "pending" },
            ];

      set({
        chats: updatedChats,
        currentChatId: newChatId,
        currentDate: todayStr,
      });

      console.log("✅ Today's chat ready:", newChatId);
      return newChatId;
    } catch (error) {
      console.error("❌ Error creating today's chat:", error);
      return null;
    } finally {
      set({ loadingChat: false });
    }
  },

  getStreak: () => {
    const { user } = get();
    if (!user) return 0;
    return user.dailyStreak || 0;
  },

  getUserData: async () => {
    const { user } = get();
    if (!user) return null;
  
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;
  
      return {
        ...user,
        ...userSnap.data(),
      };
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  handleDateChange: async (newDate) => {
    const { user } = get();
    if (!user) return;

    console.log("📅 Date changed to:", newDate);

    const todayStr = getTodayDateString();

    // Ensure chat exists for the new date
    const newChatId = await getOrCreateDailyChat(user.uid, newDate);

    set({ currentDate: newDate, currentChatId: newChatId });

    // Reload chats to update the calendar
    const today = new Date();
    get().loadDailyChats(today.getMonth(), today.getFullYear());
  },

  // In your store, add a debug function
  debugDateInfo: () => {
    const { currentDate, currentChatId, chats } = get();
    const today = new Date().toISOString().split("T")[0];

    console.log("🐛 DEBUG DATE INFO:");
    console.log("System today:", today);
    console.log("Store currentDate:", currentDate);
    console.log("Current chat ID:", currentChatId);
    console.log("All chats:", chats);

    const currentChat = chats.find((chat) => chat.chatId === currentChatId);
    console.log("Current chat date:", currentChat?.date);

    return {
      systemToday: today,
      storeDate: currentDate,
      chatId: currentChatId,
      chatDate: currentChat?.date,
    };
  },

  debugChats: async () => {
    const { user } = get();
    if (!user) return;

    console.log("🔍 DEBUG: Checking all chats");
    const chatsCol = collection(db, "users", user.uid, "chats");
    const snap = await getDocs(chatsCol);

    snap.forEach((doc) => {
      console.log(`Chat ${doc.id}:`, doc.data());
    });
  },
  // Add to your store
  debugAllChats: async () => {
    const { user } = get();
    if (!user) return;

    console.log("🔍 DEBUG: All user chats");
    const chatsCol = collection(db, "users", user.uid, "chats");
    const snap = await getDocs(chatsCol);

    const allChats = [];
    snap.forEach((doc) => {
      allChats.push({ id: doc.id, data: doc.data() });
    });

    console.log("All chats:", allChats);
    return allChats;
  },

  // Add this to your store
  debugAugust31Chat: async () => {
    const { user } = get();
    if (!user) return;

    console.log("🔍 DEBUG: Checking August 31st chat specifically");
    const chatRef = doc(db, "users", user.uid, "chats", "2025-08-31");
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      console.log("✅ August 31st chat EXISTS:", chatSnap.data());

      // Check messages in this chat
      const messagesCol = collection(
        db,
        "users",
        user.uid,
        "chats",
        "2025-08-31",
        "messages"
      );
      const messagesSnap = await getDocs(messagesCol);
      console.log(`📨 August 31st has ${messagesSnap.size} messages`);

      messagesSnap.forEach((doc) => {
        console.log("Message:", doc.data());
      });
    } else {
      console.log("❌ August 31st chat does NOT exist");
    }
  },
  updateProfilePhoto: async (base64String) => {
    const { user } = get();
    if (!user) return;

    try {
      // Optimistic UI update
      set({ user: { ...user, photoBase64: base64String } });

      // Persist to Firestore
      await saveProfilePhoto(user.uid, base64String);

      console.log("✅ Profile photo updated via Zustand");
    } catch (error) {
      console.error("❌ Error updating profile photo:", error);
    }
  },
  updateUserStats: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const allChats = await getAllUserChats(user.uid);

      let totalMessages = 0;
      let totalDaysChatted = 0;
      let peakMessages = 0;
      let highestStreak = 0;
      let currentStreak = 0;

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let chattingDaysThisMonth = 0;

      // Sort chat dates ascending
      const sortedDates = Object.keys(allChats).sort(
        (a, b) =>
          new Date(a + "T00:00:00").getTime() -
          new Date(b + "T00:00:00").getTime()
      );
      let prevDate = null;

      for (const dateStr of sortedDates) {
        const chatData = allChats[dateStr];

        // Count messages
        let messageCount = chatData?.messageCount ?? 0;
        if (!chatData?.messageCount) {
          const snap = await getDocs(
            collection(db, "users", user.uid, "chats", dateStr, "messages")
          );
          messageCount = snap.size;
        }

        if (messageCount > 0) {
          totalDaysChatted++;
          totalMessages += messageCount;
          peakMessages = Math.max(peakMessages, messageCount);

          const d = new Date(dateStr);
          if (
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          ) {
            chattingDaysThisMonth++;
          }

          // --- streak calculation ---
          if (prevDate) {
            const diffDays = Math.round(
              (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 1) {
              currentStreak++;
            } else if (diffDays > 1) {
              currentStreak = 1;
            }
          } else {
            currentStreak = 1; // first day
          }

          highestStreak = Math.max(highestStreak, currentStreak);
          prevDate = d;
        }
      }

      // Ensure current streak ends on today if the last chat is yesterday or today
      if (prevDate) {
        const diffToToday = Math.round(
          (today.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffToToday > 1) {
          currentStreak = 0;
        }
      }

      const avgMessagesPerChat =
        totalDaysChatted > 0 ? Math.round(totalMessages / totalDaysChatted) : 0;

      const firstChatDate = sortedDates.length
        ? new Date(sortedDates[0])
        : new Date();

      const daysSinceFirst =
        Math.floor(
          (now.getTime() - firstChatDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      const consistency =
        daysSinceFirst > 0
          ? Math.round((totalDaysChatted / daysSinceFirst) * 100)
          : 0;

      // Update user object in store
      set({
        userStats: {
          totalMessages,
          totalDaysChatted,
          avgMessagesPerChat,
          currentStreak,
          highestStreak,
          peakMessages,
          chattingDaysThisMonth,
          avgStreak: highestStreak,
          consistency,
        },
        user: {
          ...user,
          dailyStreak: currentStreak,
          highestStreak,
        },
      });

      console.log("📊 Updated user stats:", {
        totalMessages,
        totalDaysChatted,
        avgMessagesPerChat,
        currentStreak,
        highestStreak,
        peakMessages,
        chattingDaysThisMonth,
        consistency,
      });
    } catch (err) {
      console.error("Error updating stats:", err);
    }
  },
}));
