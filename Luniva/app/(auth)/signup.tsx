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

export default function SignUp() {
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;
  const router = useRouter();

  const handleSignUP = () => {
    router.replace("/chat");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            />
            <CustomInput
              title="Password"
              icon={
                <FontAwesome5
                  name="key"
                  size={theme.fontSize.xl}
                  color={theme.colors.secondaryColor}
                />
              }
            />
          </View>

          <CustomButton
            title="Sign Up"
            handlePress={handleSignUP}
            containerStyles={{ width: "100%", marginTop: theme.margin.lg }}
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
