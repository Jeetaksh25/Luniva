import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

const UserProfile = () => {
    const { id } = useLocalSearchParams();

    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>User Profile</Text>
            <Text style={{ fontSize: 18, marginTop: 10 }}>User ID: {id}</Text>
        </SafeAreaView>
    );
}

export default UserProfile;