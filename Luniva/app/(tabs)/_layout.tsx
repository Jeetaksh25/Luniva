import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

const TabsLayout = () => {
  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default TabsLayout;
