import {
  View,
  Text,
  TextInput,
  Button,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/theme/theme";
import { Mail, KeyRound } from "lucide-react";
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import * as Haptics from "expo-haptics";
import CustomInput from "@/comps/CustomInput";
import CustomButton from "@/comps/CustomButton";

import { useStore } from "@/store/useAppStore";

import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { darkenColor } from "@/functions/darkenColor";
import { useModeColor } from "@/theme/modeColor";
import { ToastAndroid } from "react-native";



export default function SignUp() {
  const themeColors = useModeColor();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [gender, setGender] = useState("male");
  const [dob, setDob] = useState(new Date().toISOString().split("T")[0]);

  const { signup, loading, user } = useStore();

  useEffect(() => {
    if (user) {
      router.replace("/chat");
    }
  }, [user]);

  const handleSignUP = async () => {
    try {

      await signup(email.trim(), password.trim(), username.trim(), dob, gender);

      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      ToastAndroid.show("Signup successful 🎉", ToastAndroid.SHORT);
    } catch (error: any) {
      console.log("Signup error:", error);

      // Error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      ToastAndroid.show(
        error?.message || "Signup failed ❌",
        ToastAndroid.LONG
      );
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar style="light" />
        <View style={styles.innerContainer}>
          <Text style={[styles.text, { color: themeColors.primaryText }]}>
            Create Account
          </Text>

          <View
            style={{
              width: "100%",
              gap: theme.gap.lg,
              marginTop: theme.margin["2xl"],
            }}
          >
            <CustomInput
              title="Username"
              icon={
                <AntDesign
                  name="user"
                  size={theme.fontSize.xl}
                  color={theme.colors.secondaryColor}
                />
              }
              handleOnChangeText={setUsername}
              containerStyles={{
                backgroundColor: darkenColor(themeColors.background, 10),
              }}
            />
            <CustomInput
              title="Email"
              icon={
                <Entypo
                  name="email"
                  size={theme.fontSize.xl}
                  color={theme.colors.secondaryColor}
                />
              }
              handleOnChangeText={setEmail}
              containerStyles={{
                backgroundColor: darkenColor(themeColors.background, 10),
              }}
            />
            <CustomInput
              title="Password"
              handleOnChangeText={setPassword}
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
                paddingVertical: theme.padding.lg,
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
                        const isoDate = selectedDate
                          .toISOString()
                          .split("T")[0];
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
                  style={{ color: theme.colors.secondaryColor }}
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

          <CustomButton
            title="Sign Up"
            handlePress={handleSignUP}
            containerStyles={{ width: "100%", marginTop: theme.margin.lg }}
            isLoading={loading}
            loadingText="Signing Up..."
          />

          <View
            style={{
              alignItems: "center",
              gap: theme.gap.lg,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: themeColors.secondaryText, fontWeight: "bold" }}
            >
              Already have an account?{" "}
              <Text
                style={{ color: themeColors.primaryText, fontWeight: "bold" }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/signin");
                }}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.padding.lg,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    gap: theme.gap["xl"],
  },
  text: {
    fontSize: theme.fontSize["4xl"],
    fontWeight: "600",
  },
});
