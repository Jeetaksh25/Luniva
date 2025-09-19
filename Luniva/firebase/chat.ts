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
  limitToLast,
  startAfter,
  limit,
  deleteDoc,
  getDocFromCache,  
} from "firebase/firestore";
import { db } from "./config";
import { updateUserStreak } from "./user";
import { getTodayDateString,isToday, isPastDate, isFutureDate } from "@/utils/dateUtils";

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

    // Update chat status to "done" only if we have both user and AI messages
    const messagesCol = collection(db, "users", uid, "chats", chatId, "messages");
    const messagesSnap = await getDocs(messagesCol);
    
    let hasUserMessage = false;
    let hasAIMessage = false;
    
    messagesSnap.forEach((doc) => {
      const message = doc.data();
      if (message.role === "user" && message.text && message.text.trim().length > 0) {
        hasUserMessage = true;
      }
      if (message.role === "ai" && message.text && message.text.trim().length > 0) {
        hasAIMessage = true;
      }
    });

    // Only mark as "done" if we have a complete conversation
    const status = (hasUserMessage && hasAIMessage) ? "done" : "pending";

    await updateDoc(doc(db, "users", uid, "chats", chatId), {
      updatedAt: serverTimestamp(),
      lastMessage: text,
      status: status,
    });

    const chatDate = chatId;
    if (status === "done") {
      await updateUserStreak(uid, chatDate);
    }
    
    console.log("AI message saved successfully, status:", status);
  } catch (error) {
    console.error("Error saving AI message:", error);
    throw error;
  }
}

// Fix the watchMessages function to handle Firestore timestamps
export function watchMessages(
  uid: string,
  chatId: string,
  callback: (messages: any[]) => void
) {
  const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");
  const q = query(msgsCol, orderBy("createdAt", "asc"));

  console.log("Setting up message listener for:", uid, chatId);

  let lastIds = "";

  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();

        return { id: d.id, ...data, createdAt };
      });

      // Only call if the set of IDs changed
      const ids = msgs.map((m) => m.id).join(",");
      if (ids !== lastIds) {
        lastIds = ids;
        callback(msgs);
      }
    },
    (error) => {
      console.error("Error in message listener:", error);
    }
  );
}

export async function loadOlderMessages(uid: string, chatId: string, firstMessage: any) {
  if (!firstMessage?.createdAt) return [];

  const msgsCol = collection(db, "users", uid, "chats", chatId, "messages");

  // Use Firestore Timestamp if available
  const startAfterValue =
    firstMessage.createdAt instanceof Date
      ? Timestamp.fromDate(firstMessage.createdAt)
      : firstMessage.createdAt; // if already Timestamp

  const q = query(
    msgsCol,
    orderBy("createdAt", "desc"),
    startAfter(startAfterValue),
    limit(10)
  );

  const snap = await getDocs(q);
  const older = snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toDate
      ? data.createdAt.toDate()
      : new Date(data.createdAt?.seconds * 1000) || new Date();

    return { id: d.id, ...data, createdAt };
  });

  return older.reverse(); // oldest → newest
}
export async function getChatsForMonth(
  uid: string,
  month: number,
  year: number
) {
  try {
    // Create date range for the month
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
  } catch (error) {
    console.error("Error getting chats for month:", error);
    return {};
  }
}

export async function checkChatHasMessages(uid: string, chatId: string): Promise<boolean> {
  try {
    const messagesCol = collection(db, "users", uid, "chats", chatId, "messages");
    const messagesSnap = await getDocs(messagesCol);
    
    // Check if there are any user or AI messages (not just empty collections)
    let hasRealMessages = false;
    messagesSnap.forEach((doc) => {
      const message = doc.data();
      // Check if message has meaningful content (not empty or system messages)
      if (message.text && message.text.trim().length > 0) {
        hasRealMessages = true;
      }
    });
    
    return hasRealMessages;
  } catch (error) {
    console.error("Error checking chat messages:", error);
    // If there's an error (like collection doesn't exist), assume no messages
    return false;
  }
}

export async function getAllUserChats(uid: string): Promise<Record<string, DocumentData>> {
  try {
    const chatsCol = collection(db, "users", uid, "chats");
    const snap = await getDocs(chatsCol);
    
    const result: Record<string, DocumentData> = {};
    snap.forEach((doc) => {
      // Only include date-based chats (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(doc.id)) {
        result[doc.id] = doc.data();
      }
    });
    
    return result;
  } catch (error) {
    console.error("Error getting all user chats:", error);
    return {};
  }
}