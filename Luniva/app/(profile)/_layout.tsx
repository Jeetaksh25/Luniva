import { Stack } from "expo-router";
import colors from "tailwindcss/colors";
import { darkenColor } from "@/functions/darkenColor";
import {modeColor} from "@/theme/modeColor"
import {theme} from "@/theme/theme"

const ProfileLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: darkenColor(modeColor().background, 10),
        },
        headerTitleStyle: {
          fontSize: 16,
          color: modeColor().text,
        },
        headerTintColor: modeColor().text,
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
