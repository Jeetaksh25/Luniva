import { Stack } from "expo-router";
import colors from "tailwindcss/colors";
import { darkenColor } from "@/functions/darkenColor";
import { useModeColor } from "@/theme/modeColor";
import {theme} from "@/theme/theme"

const ProfileLayout = () => {
  const themeColors = useModeColor();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: darkenColor(themeColors.background, 10),
        },
        headerTitleStyle: {
          fontSize: 16,
          color: themeColors.text,
        },
        headerTintColor: themeColors.text,
      }}
    >
      <Stack.Screen
        name="profile"
        options={{ title: "My Profile" }}
      />
      <Stack.Screen
        name="editprofile"
        options={{ title: "Edit Profile" }}
      />
    </Stack>
  );
};

export default ProfileLayout;
