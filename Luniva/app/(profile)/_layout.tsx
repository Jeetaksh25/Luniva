import { Stack } from "expo-router";

const ProfileLayout = () => {

  return (
    <>
      <Stack>
        <Stack.Screen name="id" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default ProfileLayout;
