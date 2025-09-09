import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Platform,
} from "react-native";
import { useStore } from "@/store/useAppStore";
import { useColorScheme } from "react-native";
import { theme } from "@/theme/theme";
import CustomInput from "@/comps/CustomInput";
import CustomButton from "@/comps/CustomButton";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import { darkenColor } from "@/functions/darkenColor";
import { useModeColor } from "@/theme/modeColor";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

const EditProfile = () => {
  const { user, updateProfilePhoto } = useStore();
  const themeColors = useModeColor();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gender, setGender] = useState(user?.gender || "");
  const [dob, setDob] = useState(user?.dob || "");

  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setUsername(user?.username || "");
  }, [user]);

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

  const handleSaveChanges = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update profile photo if changed
      if (selectedImage) {
        await updateProfilePhoto(selectedImage);
      }

      // Update other fields in Firebase
      const userRef = user.uid;
      const updates: any = {};
      if (displayName !== user.displayName) updates.displayName = displayName;
      if (username !== user.username) updates.username = username;
      if (gender !== user.gender) updates.gender = gender;
      if (dob !== user.dob) updates.dob = dob;

      // Apply updates to Firestore
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/firebase/config");
      if (Object.keys(updates).length > 0) {
        const userDoc = doc(db, "users", userRef);
        await updateDoc(userDoc, updates);
      }

      // Go back to profile page
      router.replace("/profile");
    } catch (error) {
      console.error("❌ Error saving profile changes:", error);
    } finally {
      setSaving(false);
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dob ? new Date(dob) : new Date(),
        mode: "date",
        display: "calendar",
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            const isoDate = selectedDate.toISOString().split("T")[0];
            setDob(isoDate);
          }
        },
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleImagePick}>
            {uploading ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.primaryColor}
                style={styles.avatar}
              />
            ) : selectedImage || user?.photoBase64 ? (
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${selectedImage || user?.photoBase64}`,
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

            <View style={styles.pencilIcon}>
              <AntDesign name="edit" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text
            style={{
              color: themeColors.text,
              marginTop: 10,
              fontSize: theme.fontSize.md,
            }}
          >
            Profile Picture
          </Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            title="Display Name"
            handleOnChangeText={setDisplayName}
            containerStyles={{
              backgroundColor: darkenColor(themeColors.background, 10),
            }}
          />
          <CustomInput
            title="Username"
            handleOnChangeText={setUsername}
            containerStyles={{
              backgroundColor: darkenColor(themeColors.background, 10),
            }}
          />
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.secondaryColor,
              borderRadius: theme.borderRadius.md,
              backgroundColor: darkenColor(themeColors.background, 10),
            }}
          >
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={{ color: theme.colors.secondaryColor }}
            >
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>

          {/* DOB Date Picker */}
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.secondaryColor,
              borderRadius: theme.borderRadius.md,
              backgroundColor: darkenColor(themeColors.background, 10),
              padding: theme.padding.md,
              paddingVertical: theme.padding.lg
            }}
          >
            {Platform.OS === "ios" ? (
              <>
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date()}
                  mode="date"
                  display="spinner"
                  title="Select Date of Birth"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const isoDate = selectedDate.toISOString().split("T")[0];
                      setDob(isoDate);
                    }
                  }}
                />
                {dob ? (
                  <Text style={{ color: theme.colors.secondaryColor }}>
                    Selected: {dob}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text
                style={{ color: theme.colors.secondaryColor}}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openDatePicker();
                }}
              >
                {dob ? `Selected: ${dob}` : "Select Date of Birth"}
              </Text>
            )}
          </View>
        </View>

        <View style={{ marginHorizontal: 40, marginTop: 24 }}>
          <CustomButton
            title={"Save Changes"}
            handlePress={handleSaveChanges}
            loadingText="Saving..."
            isLoading={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    marginVertical: 24,
    flexDirection: "column",
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
  form: { marginHorizontal: 20, marginTop: 20, gap: 20 },
});
