import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
  TextInput,
} from "react-native";
import React, { FC } from "react";
import colors from "tailwindcss/colors";
import { GestureDetectorBridge } from "react-native-screens";
import { theme } from "../theme/theme";

import * as Haptics from "expo-haptics";
import { useColorScheme } from "react-native";

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
          secureTextEntry={title === "Password"}
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
      {icon && icon}
    </View>
  );
};

export default CustomInput;
