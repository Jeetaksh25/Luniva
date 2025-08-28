import {
    collection,
    doc,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
  } from "firebase/firestore";
  import { db } from "./config";
  
  // Create a new chat (no model or archived fields)
  export async function createChat(uid, title = "New chat") {
    const chatsCol = collection(db, "users", uid, "chats");
    const chatRef = await addDoc(chatsCol, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
    return chatRef.id;
  }
  
  // Send user message
  export async function sendUserMessage(uid, chatId, text) {
    const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
    await addDoc(msgsCol, {
      role: "user",
      text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "users", uid, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: text,
    });
  }
  
  // Send AI message
  export async function sendAIMessage(uid, chatId, text, extra = {}) {
    const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
    await addDoc(msgsCol, {
      role: "ai",
      text,
      createdAt: serverTimestamp(),
      ...extra, // can include tone or tokens if added later
    });
    await updateDoc(doc(db, "users", uid, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: text,
    });
  }
  
  // Real-time message listener
  export function watchMessages(uid, chatId, callback) {
    const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
    const q = query(msgsCol, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }
  