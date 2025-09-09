import { Stack } from "expo-router";
const Tabslayout = () => {
  return (
    <Stack>
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Tabslayout;
