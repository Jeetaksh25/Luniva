import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useAppStore";
import * as ImagePicker from "expo-image-picker";
import { useColorScheme } from "react-native";
import { theme } from "@/theme/theme";
import InfoTab from "@/comps/InfoTab";
import CustomButton from "@/comps/CustomButton";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";

const UserProfile = () => {
  const { user, updateProfilePhoto, logout } = useStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.replace("/");
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: themeColors.text }}>No user logged in</Text>
      </SafeAreaView>
    );
  }

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        const image = result.assets[0];
        if (image.base64) {
          setSelectedImage(image.base64);
        }
      }
    } catch (error) {
      console.error("❌ Error picking image:", error);
    }
  };

  const handleChangeProfilePic = async () => {
    if (!selectedImage) return;
    setUploading(true);
    try {
      await updateProfilePhoto(selectedImage);
      setSelectedImage(null);
    } catch (error) {
      console.error("❌ Error updating profile pic:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleImagePick}>
            <View>
              {uploading ? (
                <ActivityIndicator
                  size="large"
                  color={theme.colors.primaryColor}
                  style={styles.avatar}
                />
              ) : selectedImage || user.photoBase64 ? (
                <Image
                  source={{
                    uri: `data:image/jpeg;base64,${selectedImage || user.photoBase64}`,
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.placeholder]}>
                  <Text style={{ color: theme.colors.infoColor, fontSize: 28 }}>
                    +
                  </Text>
                </View>
              )}

              {/* Pencil icon overlay */}
              <View style={styles.pencilIcon}>
                <AntDesign name="edit" size={20} color="#fff" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Change button */}
        {selectedImage && (
          <View style={styles.changeButton}>
            <CustomButton
              title="Change Profile Picture"
              handlePress={handleChangeProfilePic}
            />
          </View>
        )}

        {/* Stats / Info Section */}
        <View style={styles.infoContainer}>
          <InfoTab label="Display Name" value={user.displayName || "No Name"} />
          <InfoTab label="Username" value={user.username || "No username"} />
          <InfoTab label="Email" value={user.email || "No Email"} />
          <InfoTab label="Membership" value="Free Tier" />
          <InfoTab
            label="Last Login"
            value={
              user.lastLogin
                ? user.lastLogin.toDate
                  ? user.lastLogin.toDate().toDateString()
                  : new Date(user.lastLogin).toDateString()
                : "N/A"
            }
          />
          <InfoTab label="Gender" value={user.gender || "Not set"} />
          <InfoTab label="Date of Birth" value={user.dob || "Not set"} />
        </View>

        <View style={styles.actions}>
          <CustomButton
            title="Edit Profile"
            handlePress={() => router.push("/editprofile")}
          />
          <CustomButton
            title="Logout"
            handlePress={handleLogout}
            icon={
              <AntDesign name="logout" size={24} color={themeColors.text} />
            }
            containerStyles={{ backgroundColor: theme.colors.errorColor }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  container: { flex: 1, },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    marginBottom: 14,
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primaryColor,
    marginBottom: 12,
  },
  placeholder: {
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  pencilIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primaryColor,
    padding: 6,
    borderRadius: 20,
  },
  infoContainer: { marginHorizontal: 20, gap: 8, overflow: "scroll" },
  actions: { marginTop: 20, marginHorizontal: 40, gap: 50 },
  changeButton: { marginHorizontal: 40, marginBottom: 20 },
});
