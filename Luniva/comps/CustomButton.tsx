import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
  Pressable,
} from "react-native";
import React, { FC } from "react";
import colors from "tailwindcss/colors";
import { GestureDetectorBridge } from "react-native-screens";
import { theme } from "../theme/theme";

import * as Haptics from "expo-haptics";

interface CutomButtonProps {
  title: string;
  icon?: React.ReactNode;
  handlePress?: (event: GestureResponderEvent) => void;
  containerStyles?: StyleProp<ViewStyle>;
  textStyles?: StyleProp<TextStyle>;
  isLoading?: boolean;
  loadingText?: string;
}

const CustomButton: FC<CutomButtonProps> = ({
  title,
  icon,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
  loadingText,
}) => {
  const handlefunction = (event: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (handlePress) {
      handlePress(event);
    }
  };
  return (
    <TouchableOpacity
      onPress={handlefunction}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: theme.padding.md,
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.colors.primaryColor,
        },
        containerStyles,
      ]}
      activeOpacity={0.6}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Text
            style={[
              {
                color: "white",
                marginRight: 8,
                fontFamily: "Poppins-Regular",
                fontWeight: "bold",
              },
              textStyles,
            ]}
          >
            {loadingText}
          </Text>
          <ActivityIndicator size="small" color="white" animating={true} />
        </>
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text
            style={[
              {
                color: "white",
                fontSize: theme.fontSize.md,
                fontWeight: "bold",
              },
              textStyles,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
