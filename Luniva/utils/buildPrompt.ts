import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { transformUserMessage } from "./transformPrompt";
import { db } from "../firebase/config";

export async function buildPrompt(user: any, message: string, chatId: string) {
  // Pull user style + context
  const { styleBlock, needsLongResponse } = transformUserMessage(message, user);

  // 🔹 Load recent history (last 6 turns to give AI some context)
  const msgsCol = collection(db, "users", user.uid, "chats", chatId, "messages");
  const q = query(msgsCol, orderBy("createdAt", "desc"), limit(10));
  const snap = await getDocs(q);

  const recentMessages = snap.docs
    .reverse()
    .map((doc) => {
      const d = doc.data();
      return `${d.role === "user" ? "User" : "AI"}: "${d.text}"`;
    })
    .join("\n");

  return `
${styleBlock}

Recent conversation (last few turns):
${recentMessages}

Now the user says: "${message}"
${needsLongResponse
  ? "👉 Provide a **long, structured, calming reply**."
  : "👉 Provide a **short, caring, human-like reply**, starting with a single emoji."}
`;
}
