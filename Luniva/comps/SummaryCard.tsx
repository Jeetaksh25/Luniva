import React, { useEffect, useState, useCallback, useRef } from "react";
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
const SUMMARY_STORAGE_KEY = "daily_summary";
const adUnitId = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-5138208417933601/1928953209";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY_GEMINI}`;

export default function SummaryCard({ chats }: { chats: any[] }) {
  const [loadingAd, setLoadingAd] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const { user } = useStore();
  const [days, setDays] = useState<7 | 30>(7);
  const [detail, setDetail] = useState<"normal" | "detailed">("normal");

  const [adsLeft, setAdsLeft] = useState(0);
  const [currentAdNumber, setCurrentAdNumber] = useState(0);
  const totalAdsRef = useRef(0);
  const adsLeftRef = useRef(0);
  const isAdChainRunning = useRef(false);

  // Number of ads to chain based on selection
  const getAdCount = (days: 7 | 30, detail: "normal" | "detailed") => {
    if (days === 7 && detail === "normal") return 3; // ~15s
    if (days === 7 && detail === "detailed") return 2; // ~30s
    if (days === 30 && detail === "normal") return 6; // ~30s
    if (days === 30 && detail === "detailed") return 12; // ~60s
    return 3;
  };

  const showNextAd = useCallback(() => {
    if (adsLeftRef.current <= 0) {
      // All ads completed
      setUnlocked(true);
      setUnlocked(true);
      generateAISummary(days, detail);
      setLoadingAd(false);
      isAdChainRunning.current = false;
      return;
    }

    // Create a new ad instance
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log("Ad loaded, showing now");
        ad.show();
      }
    );

    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        console.log("Ad reward earned");
        // Remove listeners for this ad
        unsubLoaded();
        unsubEarned();
        unsubError();

        // Update state and show next ad
        adsLeftRef.current = adsLeftRef.current - 1;
        setAdsLeft(adsLeftRef.current);
        setCurrentAdNumber((prev) => prev + 1);
        showNextAd();
      }
    );

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      console.error("Ad error:", err);
      // Remove listeners
      unsubLoaded();
      unsubEarned();
      unsubError();

      Alert.alert("Error", "Failed to load ad. Try again later.");
      setLoadingAd(false);
      setAdsLeft(0);
      isAdChainRunning.current = false;
    });

    // Load the ad
    ad.load();
  }, []);

  const handleUnlock = () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Ads are not supported on web.");
      return;
    }

    if (isAdChainRunning.current) return;

    const count = getAdCount(days, detail);
    totalAdsRef.current = count;
    adsLeftRef.current = count;
    setAdsLeft(count);
    setCurrentAdNumber(1);
    setLoadingAd(true);
    isAdChainRunning.current = true;

    // Start the ad chain
    showNextAd();
  };

  const generateAISummary = async (
    summaryDays: 7 | 30,
    summaryDetail: "normal" | "detailed"
  ) => {
    setLoadingSummary(true);
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - summaryDays);

      const validChats = chats.filter((c) => {
        const chatDate = new Date(c.date);
        return c.chatId && chatDate >= startDate && chatDate <= today;
      });

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
            days: summaryDays,
            detail: summaryDetail,
          })
        );
        return;
      }

      const prompt = `You are an expert mental health assistant. Summarize the following chat conversation for the last ${summaryDays} days to promote well-being. Write in a professional, empathetic tone.

      ${
        summaryDetail === "normal"
          ? "Write a short summary in 2-3 sentences highlighting key emotional insights."
          : "Write a very very detailed, multi-paragraph analysis. Include emotional trends, coping strategies, recommendations, examples from the conversation, and actionable guidance. Each paragraph should be at least 4-5 sentences. Ensure the output is at least 600 words."
      }
      
      Conversation:
      ${chatText}`;

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
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.summary ||
        "No summary generated.";

      console.log("AI API Response:", JSON.stringify(data, null, 2));

      setSummary(aiText);

      await AsyncStorage.setItem(
        SUMMARY_STORAGE_KEY,
        JSON.stringify({
          date: today,
          text: aiText,
          days: summaryDays,
          detail: summaryDetail,
        })
      );
    } catch (err) {
      console.error("AI Summary Error:", err);
      Alert.alert("Error", "Could not generate summary. Try again later.");
    } finally {
      setLoadingSummary(false);
    }
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

      {!unlocked && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 4 }}>Choose time period:</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              title="7 Days"
              onPress={() => setDays(7)}
              disabled={loadingAd}
            />
            <Button
              title="30 Days"
              onPress={() => setDays(30)}
              disabled={loadingAd}
            />
          </View>
          <Text style={{ marginTop: 8, marginBottom: 4 }}>
            Choose summary type:
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              title="Normal"
              onPress={() => setDetail("normal")}
              disabled={loadingAd}
            />
            <Button
              title="Detailed"
              onPress={() => setDetail("detailed")}
              disabled={loadingAd}
            />
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
            Watch {getAdCount(days, detail)} ads ({days} days • {detail}) to
            unlock today's summary.
            {adsLeft > 0 && ` (${adsLeft} ads remaining)`}
          </Text>
          {loadingAd ? (
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator size="small" color="#000" />
              <Text style={{ marginTop: 8, fontSize: 12 }}>
                Watching ad {currentAdNumber} of {totalAdsRef.current}
              </Text>
            </View>
          ) : (
            <Button
              title={`Unlock with ${getAdCount(days, detail)} Ads`}
              onPress={handleUnlock}
            />
          )}
        </>
      )}
    </View>
  );
}
