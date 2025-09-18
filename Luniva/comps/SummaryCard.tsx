// SummaryCard.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from "react-native-google-mobile-ads";
import Constants from "expo-constants";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useStore } from "@/store/useAppStore";

const API_KEY_GEMINI = Constants.expoConfig?.extra?.eas?.API_KEY_GEMINI;

// Use unique keys so summaries are per day
const SUMMARY_STORAGE_KEY = "daily_summary";

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-5138208417933601/1928953209";

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

type Props = {
  chats: any[];
};

const API_KEY = API_KEY_GEMINI;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export default function SummaryCard({ chats }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [loadingAd, setLoadingAd] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);

  const { user } = useStore();

  // user selection
  const [days, setDays] = useState<7 | 30>(7);
  const [detail, setDetail] = useState<"normal" | "detailed">("normal");

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    setRewardedAd(ad);

    const unsubLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
      }
    );

    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        setUnlocked(true);
        await generateAISummary();
      }
    );

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      ad.load();
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      console.error("Ad error:", err);
      Alert.alert("Error", "Failed to load ad. Try again later.");
      setLoadingAd(false);
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
  }, []);

  const generateAISummary = async () => {
    setLoadingSummary(true);
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - days);

      // Filter chats within range and with valid chatId
      const validChats = chats.filter((c) => {
        const chatDate = new Date(c.date);
        return c.chatId && chatDate >= startDate && chatDate <= today;
      });

      // Fetch messages for each chat
      const chatTexts = await Promise.all(
        validChats.map(async (c) => {
          const msgsCol = collection(
            db,
            "users",
            user.uid,
            "chats",
            c.chatId,
            "messages"
          );

          const q = query(msgsCol, orderBy("createdAt", "asc"));
          const snap = await getDocs(q);
          return snap.docs
            .map((doc) => {
              const d = doc.data();
              return `${d.role === "user" ? "User" : "AI"}: "${d.text}"`;
            })
            .join("\n");
        })
      );

      const chatText = chatTexts.join("\n");

      if (!chatText) {
        setSummary("No chat history found.");
        await AsyncStorage.setItem(
          SUMMARY_STORAGE_KEY,
          JSON.stringify({
            date: today,
            text: "No chat history found.",
            days,
            detail,
          })
        );
        return;
      }

      const prompt = `You are an expert mental health assistant. Summarize the following chat conversation for the last ${days} days to promote well-being. Write in a professional, empathetic tone. The summary should ${
        detail === "normal"
          ? "2-3 sentences with key emotional insights"
          : "a detailed multi-paragraph analysis with emotional trends, coping suggestions, and recommendations"
      }:\n\n${chatText}`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "AI API Error");

      const aiText =
        data.summary ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No summary generated.";

      setSummary(aiText);
      await AsyncStorage.setItem(
        SUMMARY_STORAGE_KEY,
        JSON.stringify({ date: today, text: aiText, days, detail })
      );

      console.log("AI Summary:", aiText);
    } catch (err) {
      console.error("AI Summary Error:", err);
      Alert.alert("Error", "Could not generate summary. Try again later.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleUnlock = () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Ads are not supported on web.");
      return;
    }

    if (!rewardedAd) {
      Alert.alert("Please wait", "Ad is initializing...");
      return;
    }

    if (!loaded) {
      Alert.alert("Please wait", "Ad is still loading...");
      return;
    }

    setLoadingAd(true);

    rewardedAd.show();

    setLoaded(false);
  };

  return (
    <View
      style={{
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#f5f5f5",
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
        AI Chat Summary
      </Text>

      {/* Selection UI */}
      {!unlocked && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 4 }}>Choose time period:</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="7 Days" onPress={() => setDays(7)} />
            <Button title="30 Days" onPress={() => setDays(30)} />
          </View>
          <Text style={{ marginTop: 8, marginBottom: 4 }}>
            Choose summary type:
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Normal" onPress={() => setDetail("normal")} />
            <Button title="Detailed" onPress={() => setDetail("detailed")} />
          </View>
        </View>
      )}

      {unlocked ? (
        loadingSummary ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={{ fontSize: 14, color: "#333" }}>{summary}</Text>
        )
      ) : (
        <>
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
            Watch an ad ({days} days • {detail}) to unlock today’s summary.
          </Text>
          {loadingAd ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Button title="Unlock with Ad" onPress={handleUnlock} />
          )}
        </>
      )}
    </View>
  );
}
