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
import { createChat, sendUserMessage, sendAIMessage, watchMessages } from "../firebase/chat";

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
      await signInWithEmailAndPassword(auth, email, password);
      set({ user: auth.currentUser });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, chats: [], messages: [], currentChatId: null });
  },

  // --- CHATS ---
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
    const { user, currentChatId } = get();
    if (!user || !currentChatId) return;
    await sendUserMessage(user.uid, currentChatId, text);
  },

  sendAIResponse: async (text, extra) => {
    const { user, currentChatId } = get();
    if (!user || !currentChatId) return;
    await sendAIMessage(user.uid, currentChatId, text, extra);
  },
}));
