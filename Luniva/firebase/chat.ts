import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  addDoc,
  updateDoc,
  where,
  getDocs,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";

// Create a new chat (no model or archived fields)
export async function createChat(
  uid: string,
  title = "New chat",
  useDateAsId?: string
) {
  const chatsCol = collection(db, "users", uid, "chats");

  if (useDateAsId) {
    const chatRef = doc(chatsCol, useDateAsId);
    await setDoc(chatRef, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
    return chatRef.id;
  } else {
    const chatRef = await addDoc(chatsCol, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
    return chatRef.id;
  }
}

export async function getOrCreateDailyChat(uid: string, date: string) {
  // date format: YYYY-MM-DD
  const chatRef = doc(db, "users", uid, "chats", date);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      title: date,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
  }

  return chatRef.id;
}

// Send user message
// In firebase/chat.js - Add error handling
export async function sendUserMessage(uid: string, chatId: string, text: string) {
  try {
    console.log("Saving message:", { role: "user", text });

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
    
    console.log("Message saved successfully");
  } catch (error) {
    console.error("Error saving user message:", error);
    throw error;
  }
}

export async function sendAIMessage(uid: string, chatId: string, text: string, extra = {}) {
  try {
    console.log("Saving AI response:", { role: "ai", text, ...extra });

    const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
    await addDoc(msgsCol, {
      role: "ai",
      text,
      createdAt: serverTimestamp(),
      ...extra,
    });

    await updateDoc(doc(db, "users", uid, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: text,
    });
    
    console.log("AI message saved successfully");
  } catch (error) {
    console.error("Error saving AI message:", error);
    throw error;
  }
}

// Fix the watchMessages function to handle Firestore timestamps
export function watchMessages(uid: string, chatId: string, callback: (messages: any[]) => void) {
  const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
  const q = query(msgsCol, orderBy("createdAt", "asc"));
  
  console.log("Setting up message listener for:", uid, chatId);
  
  return onSnapshot(q, 
    (snap) => {
      console.log("Messages snapshot received:", snap.docs.length, "messages");
      const msgs = snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt?.seconds * 1000) || new Date();

        return {
          id: d.id,
          ...data,
          createdAt,
        };
      });
      callback(msgs);
    },
    (error) => {
      console.error("Error in message listener:", error);
    }
  );
}

export async function getChatsForMonth(
  uid: string,
  month: number,
  year: number
) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const chatsCol = collection(db, "users", uid, "chats");
  const q = query(
    chatsCol,
    where("updatedAt", ">=", Timestamp.fromDate(start)),
    where("updatedAt", "<=", Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);

  const result: Record<string, DocumentData> = {};

  snap.forEach((doc) => {
    result[doc.id] = doc.data();
  });

  return result;
}
