import { toDateStringLocal } from "./dateUtils";

export const getChatTrend = (chats: any[], todayStr: string) => {
  const offsets = [-6, -5, -4, -3, -2, -1, 0];

  return offsets.map((offset) => {
    // Parse todayStr as local date
    const [year, month, day] = todayStr.split("-").map(Number);
    const baseDate = new Date(year, month - 1, day);
    baseDate.setDate(baseDate.getDate() + offset);

    const dateStr = toDateStringLocal(baseDate);

    const chat = chats.find((c) => c.date === dateStr);

    if (!chat) return 20;
    if (chat.status === "done") return 10;
    return 30;
  });
};

export const renderZigZag = (trend: number[], width: number) => {
  const step = width / (trend.length - 1);
  let path = `M0 ${trend[0]}`;
  trend.forEach((y, i) => {
    if (i > 0) path += ` L${i * step} ${y}`;
  });
  return path;
};

export const renderZigZag2 = (trend: number[], width: number) => {
  const step = width / (trend.length - 1);
  const maxHeight = 70;
  return trend
    .map((val, i) => {
      const scaledY = maxHeight - val * 2;
      return `${i === 0 ? "M" : "L"} ${i * step} ${scaledY}`;
    })
    .join(" ");
};
