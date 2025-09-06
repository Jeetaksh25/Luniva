import { Image, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { modeColor } from "../theme/modeColor";
import React, { FC } from "react";
import { theme } from "../theme/theme";


interface ProfileButtonProps {
  user: any;
  onPress: any;
}

const ProfileButton: FC<ProfileButtonProps> = ({ user, onPress }) => {
  console.log("User photo data:", user.photoBase64 ? "Exists" : "Null");
  
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[
          styles.userContainer,
          { backgroundColor: modeColor().background },
        ]}
      >
        {user.photoBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${user.photoBase64}` }}
            style={styles.avatar}
            onError={(e) => console.log("Image loading error:", e.nativeEvent.error)}
          />
        ) : (
          <FontAwesome
            name="user-circle-o"
            size={30}
            color={modeColor().text}
          />
        )}

        <Text style={[styles.username, { color: modeColor().text }]}>
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
    justifyContent: "space-between",
    width: "100%",
    height: "auto",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: "80%",
  },
});
