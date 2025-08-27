import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

const TabsLayout = () => {
  return (
    <>
      <StatusBar backgroundColor="#161622" style="light" />
      <Stack>
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default TabsLayout;
