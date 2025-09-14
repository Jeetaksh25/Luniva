import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { transformUserMessage } from "./transformPrompt";
import { db } from "../firebase/config";

export async function buildPrompt(user: any, message: string, chatId: string) {
  const { styleBlock, needsLongResponse } = transformUserMessage(message, user);

  // Fetch last 5 messages
  const msgsCol = collection(db, "users", user.uid, "chats", chatId, "messages");
  const q = query(msgsCol, orderBy("createdAt", "desc"), limit(8));
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

Recent convo (last few msgs):
${recentMessages}

Now user says: "${message}"

${
  needsLongResponse
    ? "👉 Reply calm, structured, short but complete. Use first emoji wisely based on emotion."
    : "👉 Reply short, playful, warm. Start with 1 context-aware emoji, then natural text. Use emoji intelligently."
}
`;
}