import { useState, FC } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";
import * as Haptics from "expo-haptics";

interface MessageInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  onChangeText?: (text: string) => void;
  disable?: boolean;
}

const MessageInput: FC<MessageInputProps> = ({
  placeholder = "Type a message",
  onSend,
  disable = false,
}) => {
  const [message, setMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const colorScheme = useColorScheme();
  const themeColors =
    colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

  return (
    <View
      style={[
        styles.inputContainer,
        { backgroundColor: darkenColor(themeColors.background, 10) },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            color: themeColors.text,
            borderColor: theme.colors.secondaryColor,
            height: Math.min(160, inputHeight),
          },
        ]}
        editable={!disable}
        placeholder={placeholder}
        placeholderTextColor={themeColors.text + "99"}
        multiline
        scrollEnabled
        textAlignVertical="top"
        value={message}
        onChangeText={setMessage}
        onContentSizeChange={(e) =>
          setInputHeight(e.nativeEvent.contentSize.height)
        }
        onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        onBlur={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: theme.colors.primaryColor },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const trimmedMessage = message.trim();
          if (onSend) onSend(message);
          setMessage("");
          setInputHeight(45);
        }}
      >
        <Ionicons name="send" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default MessageInput;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: "95%",
    alignSelf: "center",
    borderRadius: 30,
    marginBottom: Platform.OS === "ios" ? 15 : 10,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 50,
    padding: 10,
  },
});
