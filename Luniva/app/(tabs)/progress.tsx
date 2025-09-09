import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  BackHandler,
  Image,
  ScrollView,
} from "react-native";
import MessageInput from "@/comps/MessageInput";
import { useColorScheme } from "react-native";
import { theme } from "@/theme/theme";
import Feather from "@expo/vector-icons/Feather";
import ChatBubble from "@/comps/ChatBubble";
import SidebarCalendar from "@/comps/SidebarCalendar";
import { useStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";
import { useDateChange } from "@/utils/useDateChange";
import { getTodayDateString } from "@/utils/dateUtils";
import { transformUserMessage } from "@/utils/transformPrompt";
import * as Haptics from "expo-haptics";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useModeColor } from "@/theme/modeColor";

import { SafeAreaView } from "react-native-safe-area-context";
import StatsBubble from "@/comps/StatsBubble";

const Progress = () => {
  const themeColors = useModeColor();
  return (
    <SafeAreaView>
      <ScrollView>
        <Text>Progres</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Progress;

const styles = StyleSheet.create({});
