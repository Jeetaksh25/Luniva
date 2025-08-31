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
} from "../firebase/chat";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

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

  initAuth: () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            await ensureUserDoc(user);
            
            // Set up real-time listener for user data updates
            const userRef = doc(db, "users", user.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
              if (doc.exists()) {
                const userData = doc.data();
                console.log("🔥 User data updated - streak:", userData.dailyStreak);
                set({ user: { ...user, ...userData } });
              }
            });
            
            // Store the unsubscribe function for cleanup
            set({ user, loadingAuth: false, unsubscribeUser });
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
      unsubscribeUser: null 
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

    const todayStr = new Date().toISOString().split("T")[0];
    const currentChat = chats.find((chat) => chat.chatId === currentChatId);

    if (currentChat?.date !== todayStr) {
      console.error("Cannot send messages to past chats");
      return;
    }

    try {
      // Save user message first
      await sendUserMessage(user.uid, currentChatId, text);

      // Use Gemini API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text }],
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
    }
  },

  loadDailyChats: async (month, year) => {
    const { user } = get();
    if (!user) return;

    const today = new Date();
    const currentMonth = month ?? today.getMonth();
    const currentYear = year ?? today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Fetch all chats for the month at once
    const monthlyChats = await getChatsForMonth(
      user.uid,
      currentMonth,
      currentYear
    );

    const dailyChats = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      let chatId = monthlyChats[dateStr] ? dateStr : null;
      let status = "upcoming";

      // Only create today's chat if missing
      if (
        currentYear === today.getFullYear() &&
        currentMonth === today.getMonth() &&
        day === today.getDate() &&
        !chatId
      ) {
        chatId = await getOrCreateDailyChat(user.uid, dateStr);
      }

      if (chatId) {
        const lastMessage = monthlyChats[dateStr]?.lastMessage || "";
        if (lastMessage.trim()) status = "done";
        else if (new Date(dateStr) < today) status = "missed";
      }

      dailyChats.push({ date: dateStr, chatId, status });
    }

    set({ chats: dailyChats });
  },

  openDailyChat: async (date) => {
    const { user } = get();
    if (!user) return;
    const chatId = await getOrCreateDailyChat(user.uid, date);
    set({ currentChatId: chatId });

    return watchMessages(user.uid, chatId, (messages) => set({ messages }));
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
    if (get().loadingChat) return; // Prevent multiple calls

    set({ loadingChat: true });
    const { user, chats } = get();
    if (!user) {
      console.error("No user found when creating today's chat");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    let todayChat = chats.find((c) => c.date === todayStr);

    if (!todayChat) {
      console.log("Creating new chat for today:", todayStr);
      try {
        const newChatId = await createChat(user.uid, todayStr, todayStr);
        todayChat = { date: todayStr, chatId: newChatId, status: "pending" };
        set({
          chats: [...chats, todayChat],
          currentChatId: newChatId, // IMPORTANT: Set the currentChatId here
        });
        console.log("Chat created with ID:", newChatId);
        return newChatId;
      } catch (error) {
        console.error("Error creating chat:", error);
        throw error;
      } finally {
        set({ loadingChat: false });
      }
    } else {
      console.log("Using existing chat:", todayChat.chatId);
      set({ currentChatId: todayChat.chatId });
      return todayChat.chatId;
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
}));
