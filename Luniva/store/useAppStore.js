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
import { getDoc, doc } from "firebase/firestore"; // needed for getDoc
import { db } from "../firebase/config"; // needed for Firestore reference

export const useStore = create((set, get) => ({
  user: null,
  chats: [],
  messages: [],
  loading: false,
  currentChatId: null,
  loadingAuth: true,

  initAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserDoc(user);
        set({ user });
      } else {
        set({ user: null });
      }
      set({ loadingAuth: false });
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
    await signOut(auth);
    set({ user: null, chats: [], messages: [], currentChatId: null });
  },

  // --- CHATS ---
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
  sendMessage: async (text) => {
    const { user, currentChatId, loadDailyChats } = get();
    if (!user || !currentChatId) return;
    await sendUserMessage(user.uid, currentChatId, text);
    // Refresh streak instantly
    const currentDate = new Date();
    await loadDailyChats(currentDate.getMonth(), currentDate.getFullYear());
  },

  sendAIResponse: async (text, extra) => {
    const { user, currentChatId } = get();
    if (!user || !currentChatId) return;
    await sendAIMessage(user.uid, currentChatId, text, extra);
  },
}));
