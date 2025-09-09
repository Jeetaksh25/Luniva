export const getChatTrend = (chats: any[], todayStr: string) => {
  const offsets = [-6, -5, -4, -3, -2, -1, 0];
  return offsets.map((offset) => {
    const date = new Date(todayStr);
    date.setDate(date.getDate() + offset);
    const dateStr = date.toISOString().split("T")[0];

    const chat = chats.find((c) => c.date === dateStr);
    if (!chat) return 20; // neutral / no chat
    if (chat.status === "done") return 10; // up
    return 30; // down / missed
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
