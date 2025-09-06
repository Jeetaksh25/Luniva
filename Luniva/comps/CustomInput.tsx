import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleProp,
  TextStyle,
  ViewStyle,
  useColorScheme,
} from "react-native";
import React, { FC, useState } from "react";
import { theme } from "../theme/theme";
import * as Haptics from "expo-haptics";
import AntDesign from "@expo/vector-icons/AntDesign";

interface CustomInputProps {
  title: string;
  icon?: React.ReactNode;
  handleOnChangeText?: (text: string) => void;
  containerStyles?: StyleProp<ViewStyle>;
  textStyles?: StyleProp<TextStyle>;
}

const CustomInput: FC<CustomInputProps> = ({
  title,
  icon,
  handleOnChangeText,
  containerStyles,
  textStyles,
}) => {
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = title === "Password";

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: theme.padding.xs,
          paddingVertical: theme.padding.xs,
          paddingRight: theme.padding.lg,
          borderRadius: theme.borderRadius.md,
          backgroundColor: themeColors.background,
          borderColor: theme.colors.secondaryColor,
          borderWidth: 1,
        },
        containerStyles,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <TextInput
          placeholder={title}
          keyboardType={title === "Email" ? "email-address" : "default"}
          secureTextEntry={isPasswordField && !showPassword}
          onChangeText={handleOnChangeText}
          style={[
            {
              flex: 1,
              marginLeft: icon ? theme.margin.md : 0,
              fontSize: theme.fontSize.md,
              color: themeColors.primaryText,
            },
            textStyles,
          ]}
          placeholderTextColor={theme.colors.secondaryColor}
          onFocus={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </View>

      {/* Show/Hide Password Eye */}
      {isPasswordField && (
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ marginLeft: 8 }}
        >
          <AntDesign
            name={showPassword ? "eye" : "eyeo"}
            size={theme.fontSize["2xl"]}
            color={theme.colors.secondaryColor}
          />
        </TouchableOpacity>
      )}

      {icon && icon}
    </View>
  );
};

export default CustomInput;
