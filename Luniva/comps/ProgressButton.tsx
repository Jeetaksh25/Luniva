import { Image, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { modeColor } from "../theme/modeColor";
import React, { FC } from "react";
import { theme } from "../theme/theme";
import { darkenColor } from "@/functions/darkenColor";

interface ProgressButtonProps {
    onPress: () => void
}

const ProgressButton: FC<ProgressButtonProps> = ({
    onPress
}) => {
    return (
        <View>
            <TouchableOpacity>
                <Text>
                    Progress
                </Text>
            </TouchableOpacity>
        </View>
    )
}