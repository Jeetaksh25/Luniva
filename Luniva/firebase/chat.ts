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
export async function createChat(uid: string, title = "New chat") {
  const chatsCol = collection(db, "users", uid, "chats");
  const chatRef = await addDoc(chatsCol, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "",
  });
  return chatRef.id;
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
export async function sendUserMessage(
  uid: string,
  chatId: string,
  text: string
) {
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
export async function sendAIMessage(
  uid: string,
  chatId: string,
  text: string,
  extra = {}
) {
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
}

// Real-time message listener
export function watchMessages(
  uid: string,
  chatId: string,
  callback: (messages: any[]) => void
) {
  const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
  const q = query(msgsCol, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
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
