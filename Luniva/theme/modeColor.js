import {useColorScheme} from 'react-native';
import { theme } from "../theme/theme";

export function modeColor(){
    const colorScheme = useColorScheme();
    const themeColors =
      colorScheme === "dark" ? theme.darkTheme : theme.lightTheme;

    return themeColors;
}