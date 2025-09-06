import { View, Text, TextInput, Button } from "react-native";
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

export default function SignIn() {
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading, user } = useStore();

  useEffect(() => {
    if (user) {
      router.replace("/chat");
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      console.log("Login error:", error);
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
            Welcome Back!
          </Text>

          <View
            style={{
              width: "100%",
              gap: theme.gap.lg,
              marginTop: theme.margin["2xl"],
            }}
          >
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
            />
            <CustomInput
              title="Password"
              handleOnChangeText={setPassword}
            />
          </View>

          <CustomButton
            title="Login"
            handlePress={handleLogin}
            containerStyles={{ width: "100%", marginTop: theme.margin.lg }}
            isLoading={loading}
            loadingText="Signing In..."
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
              Don't have an account?{" "}
              <Text
                style={{ color: themeColors.primaryText, fontWeight: "bold" }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/signup");
                }}
              >
                Sign Up
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
