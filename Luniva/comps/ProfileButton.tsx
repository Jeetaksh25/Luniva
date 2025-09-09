import { Image, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useModeColor } from "../theme/modeColor";
import React, { FC } from "react";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

interface ProfileButtonProps {
  user: any;
  onPress: any;
}

const ProfileButton: FC<ProfileButtonProps> = ({ user, onPress }) => {
  console.log("User photo data:", user.photoBase64 ? "Exists" : "Null");
  const themeColors = useModeColor();
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[
          styles.userContainer,
          { backgroundColor: darkenColor(themeColors.background,20) },
        ]}
      >
        {user.photoBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${user.photoBase64}` }}
            style={styles.avatar}
            onError={(e) =>
              console.log("Image loading error:", e.nativeEvent.error)
            }
          />
        ) : (
          <FontAwesome
            name="user-circle-o"
            size={30}
            color={themeColors.text}
          />
        )}

        <Text style={[styles.username, { color: themeColors.text }]}>
          {user.displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileButton;

const styles = StyleSheet.create({
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "space-between",
    width: "95%",
    height: "auto",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 100,
    borderColor: theme.colors.secondaryColor,
    borderWidth: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 10,
    borderWidth: 2,
    borderColor: theme.colors.primaryColor,
  },
  username: {
    fontSize: theme.fontSize.md,
    fontWeight: "bold",
    textAlign: "center",
    width: "80%",
  },
});
