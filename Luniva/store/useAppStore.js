import { create } from "zustand";
import { auth } from "../firebase/config";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ensureUserDoc } from "../firebase/user";
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
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { getTodayDateString, isToday } from "@/utils/dateUtils";
import { transformUserMessage } from "@/utils/transformPrompt";

const API_KEY = "AIzaSyApCBdx6xDwRZhWFEqT7CsGwnvp1mkVEhg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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

  initAuth: () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            await ensureUserDoc(user);

            const userRef = doc(db, "users", user.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                const userData = doc.data();
                console.log(
                  "🔥 User data updated - streak:",
                  userData.dailyStreak
                );
                set({ user: { ...user, ...userData } });
              }
            });

            set({
              user,
              loadingAuth: false,
              unsubscribeUser,
              currentDate: getTodayDateString(), // Use the corrected function
            });

            get().createTodayChat();
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

  signup: async (email, password, displayName) => {
    set({ loading: true });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      await ensureUserDoc(cred.user, { username: displayName });
      set({ user: cred.user });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const { unsubscribeUser } = get();
    if (unsubscribeUser) {
      unsubscribeUser();
    }
    await signOut(auth);
    set({
      user: null,
      chats: [],
      messages: [],
      currentChatId: null,
      unsubscribeUser: null,
    });
  },
  // --- CHATS ---

  // In your useStore
  // In your useStore - FIXED sendMessage function
  sendMessage: async (text) => {
    const { user, currentChatId, sendAIResponse, chats } = get(); // Added chats here

    if (!user || !currentChatId) {
      console.error("No user or chat ID");
      return;
    }

    console.log("Sending message:", text);

    const todayStr = getTodayDateString(); // Use utility here
    const currentChat = chats.find((chat) => chat.chatId === currentChatId);

    if (currentChat?.date !== todayStr) {
      console.error("Cannot send messages to past chats");
      return;
    }

    try {
      // Save user message first
      await sendUserMessage(user.uid, currentChatId, text);

      set({ isAiTyping: true });
      // Use Gemini API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: transformUserMessage(text) }],
            },
          ],
        }),
      });

      const data = await response.json();
      console.log("AI Raw Response:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error?.message || "AI API Error");
      }

      // Extract AI response text
      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text
          ?.replace(/\*\*(.*?)\*\*/g, "$1")
          ?.trim() || "No AI response";

      console.log("AI Response:", aiText);

      useStore
        .getState()
        .loadDailyChats(new Date().getMonth(), new Date().getFullYear());

      // Save AI message to Firestore
      await sendAIResponse(aiText);
    } catch (err) {
      console.error("AI Error:", err);
      // Add error message to chat
      await sendAIMessage(
        user.uid,
        currentChatId,
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
        status 
      });
    }
  
    // ADD THIS: Also include any chats from previous months that exist
    Object.keys(allChats).forEach(async (dateStr) => {
      // Skip if already included in current month
      if (dailyChats.find(chat => chat.date === dateStr)) return;
      
      // Only include past dates that have messages
      const chatDate = new Date(dateStr);
      chatDate.setHours(0, 0, 0, 0);
      
      if (chatDate < todayDate) {
        const hasMessages = await checkChatHasMessages(user.uid, dateStr);
        if (hasMessages) {
          dailyChats.push({
            date: dateStr,
            chatId: dateStr,
            status: "done"
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

      // First check if chat exists
      const chatRef = doc(db, "users", user.uid, "chats", date);
      const chatSnap = await getDoc(chatRef);

      let chatId;
      if (chatSnap.exists()) {
        chatId = date;
        console.log("Chat exists, using ID:", chatId);
      } else {
        // Create the chat if it doesn't exist but only for past dates with content
        console.log("Chat doesn't exist, creating...");
        chatId = await getOrCreateDailyChat(user.uid, date);
      }

      set({ currentChatId: chatId });

      // Load messages for this chat
      const unsubscribe = loadMessages(chatId);

      return unsubscribe;
    } catch (error) {
      console.error("Error opening daily chat:", error);
      // Show error to user
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
    set({ currentChatId: chatId });
    return watchMessages(user.uid, chatId, (messages) => set({ messages }));
  },

  // --- MESSAGING ---
  sendAIResponse: async (text, extra) => {
    const { user, currentChatId } = get();
    if (!user || !currentChatId) return;
    await sendAIMessage(user.uid, currentChatId, text, extra);
  },
  // In your useStore
  createTodayChat: async () => {
    if (get().loadingChat) return;

    set({ loadingChat: true });
    const { user } = get();
    if (!user) {
      console.error("No user found when creating today's chat");
      return;
    }

    const todayStr = getTodayDateString();
    console.log("🔄 Creating/ensuring chat for today:", todayStr);

    try {
      const newChatId = await getOrCreateDailyChat(user.uid, todayStr);

      const { chats } = get();
      const existingChatIndex = chats.findIndex((c) => c.date === todayStr);

      let updatedChats;
      if (existingChatIndex >= 0) {
        updatedChats = [...chats];
        updatedChats[existingChatIndex] = {
          date: todayStr,
          chatId: newChatId,
          status: "pending", // Start as pending, will update when messages are sent
        };
      } else {
        updatedChats = [
          ...chats,
          { date: todayStr, chatId: newChatId, status: "pending" },
        ];
      }

      set({
        chats: updatedChats,
        currentChatId: newChatId,
        currentDate: todayStr,
      });

      console.log("✅ Today's chat ready:", newChatId);
      return newChatId;
    } catch (error) {
      console.error("❌ Error creating today's chat:", error);
      throw error;
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
      return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  handleDateChange: async (newDate) => {
    const { user, currentChatId } = get();
    if (!user) return;

    console.log("📅 Date changed to:", newDate);

    // Update current date
    set({ currentDate: newDate });

    // Create new chat for the new day
    const newChatId = await getOrCreateDailyChat(user.uid, newDate);

    // Always switch to today's chat when date changes
    set({ currentChatId: newChatId });

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
}));
