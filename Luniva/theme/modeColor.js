import { useColorScheme } from "react-native";
import { theme } from "../theme/theme";


export function useModeColor() {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;
}
