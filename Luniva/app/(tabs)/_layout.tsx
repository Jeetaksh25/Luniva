import { Stack } from "expo-router";

const TabsLayout = () => {

  return (
    <>
      <Stack>
        <Stack.Screen name="chat" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default TabsLayout;
