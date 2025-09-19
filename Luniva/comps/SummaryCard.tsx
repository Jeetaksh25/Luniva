import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  ActivityIndicator,
  Platform,
  Pressable,
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
import { theme } from "@/theme/theme";
import { useModeColor } from "@/theme/modeColor";
import { darkenColor } from "@/functions/darkenColor";
import { LinearGradient } from "expo-linear-gradient";
import CustomButton from "./CustomButton";
import * as Haptics from "expo-haptics";

const API_KEY_GEMINI = Constants.expoConfig?.extra?.eas?.API_KEY_GEMINI;
const SUMMARY_STORAGE_KEY = "daily_summary";
const adUnitId = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-5138208417933601/1928953209";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY_GEMINI}`;

export default function SummaryCard({ chats }: { chats: any[] }) {
  const themeColors = useModeColor();

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

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const stored = await AsyncStorage.getItem(SUMMARY_STORAGE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        const today = new Date();
        const storedDate = new Date(parsed.date);

        // check if summary is from today
        const isToday =
          storedDate.getDate() === today.getDate() &&
          storedDate.getMonth() === today.getMonth() &&
          storedDate.getFullYear() === today.getFullYear();

        if (!isToday) return; // old summary, ignore

        // check for new chats since last summary
        const latestChat = chats
          .map((c) => new Date(c.date))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        if (
          latestChat &&
          new Date(latestChat) > new Date(parsed.lastChatTime)
        ) {
          // new chats came after summary → reset
          return;
        }

        // restore summary
        setSummary(parsed.text);
        setUnlocked(true);
      } catch (err) {
        console.error("Error loading saved summary", err);
      }
    };

    loadSummary();
  }, [chats]);

  // Number of ads to chain based on selection
  const getAdCount = (days: 7 | 30, detail: "normal" | "detailed") => {
    if (days === 7 && detail === "normal") return 3;
    if (days === 7 && detail === "detailed") return 6;
    if (days === 30 && detail === "normal") return 6;
    if (days === 30 && detail === "detailed") return 12;
    return 3;
  };

  const showNextAd = useCallback(
    (summaryDays: 7 | 30, summaryDetail: "normal" | "detailed") => {
      if (adsLeftRef.current <= 0) {
        // All ads completed
        setUnlocked(true);
        setUnlocked(true);
        generateAISummary(summaryDays, summaryDetail);
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
          showNextAd(summaryDays, summaryDetail);
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
    },
    [days, detail]
  );

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
    showNextAd(days, detail);
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

      // ⬇️ Separate prompts to make it strict
      let prompt = "";
      if (summaryDetail === "normal") {
        prompt = `Summarize the following chat conversation from the last ${summaryDays} days. 
  Keep it very short (2–3 sentences, maximum 100 words). 
  Highlight only the most important emotional insights. 
  Do not include extra detail or multiple paragraphs.
  
  Conversation:
  ${chatText}`;
      } else {
        prompt = `Provide a very detailed, professional analysis of the following chat conversation from the last ${summaryDays} days. 
  Write at least 600 words across multiple paragraphs. 
  Include emotional patterns, coping strategies, recommendations, and examples from the chats. 
  Make it empathetic, actionable, and professional.
  
  Conversation:
  ${chatText}`;
      }

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

      setSummary(aiText);

      await AsyncStorage.setItem(
        SUMMARY_STORAGE_KEY,
        JSON.stringify({
          date: today,
          text: aiText,
          days: summaryDays,
          detail: summaryDetail,
          lastChatTime: validChats.length
            ? validChats[validChats.length - 1].date
            : today,
        })
      );
    } catch (err) {
      console.error("AI Summary Error:", err);
      Alert.alert("Error", "Could not generate summary. Try again later.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const resetSummary = async () => {
    await AsyncStorage.removeItem(SUMMARY_STORAGE_KEY);
    setSummary(null);
    setUnlocked(false);
  };

  return (
    <LinearGradient
      colors={["#FF6F61", "#6A4C93"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        padding: theme.padding.md,
        borderRadius: theme.borderRadius.lg,
        elevation: 2,
        alignItems: "center",
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <View
        style={{
          padding: theme.padding.md,
          borderRadius: theme.borderRadius.md,
          elevation: 2,
          backgroundColor: darkenColor(themeColors.background, 10),
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
            color: themeColors.primaryText,
          }}
        >
          AI Chat Summary
        </Text>

        {!unlocked && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4, color: themeColors.primaryText }}>
              Choose time period:
            </Text>

            <View style={{ flexDirection: "row" }}>
              {[7, 30].map((val, idx, arr) => {
                const selected = days === val;
                const isFirst = idx === 0;
                const isLast = idx === arr.length - 1;

                return (
                  <Pressable
                    key={val}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!loadingAd) setDays(val as 7 | 30);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: selected
                        ? theme.colors.primaryColor
                        : darkenColor(themeColors.background, 0),
                      paddingVertical: theme.padding.md,
                      alignItems: "center",

                      borderTopLeftRadius: isFirst ? theme.borderRadius.md : 0,
                      borderBottomLeftRadius: isFirst
                        ? theme.borderRadius.md
                        : 0,
                      borderTopRightRadius: isLast ? theme.borderRadius.md : 0,
                      borderBottomRightRadius: isLast
                        ? theme.borderRadius.md
                        : 0,

                      marginLeft: isFirst ? 0 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#fff" : themeColors.secondaryText,
                        fontWeight: "600",
                      }}
                    >
                      {val} Days
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={{
                marginTop: 8,
                marginBottom: 4,
                color: themeColors.primaryText,
              }}
            >
              Choose summary type:
            </Text>

            <View style={{ flexDirection: "row" }}>
              {["normal", "detailed"].map((val, idx, arr) => {
                const selected = detail === val;
                const isFirst = idx === 0;
                const isLast = idx === arr.length - 1;

                return (
                  <Pressable
                    key={val}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!loadingAd) setDetail(val as "normal" | "detailed");
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: selected
                        ? theme.colors.primaryColor
                        : darkenColor(themeColors.background, 0),
                      paddingVertical: theme.padding.md,
                      alignItems: "center",

                      borderTopLeftRadius: isFirst ? theme.borderRadius.md : 0,
                      borderBottomLeftRadius: isFirst
                        ? theme.borderRadius.md
                        : 0,
                      borderTopRightRadius: isLast ? theme.borderRadius.md : 0,
                      borderBottomRightRadius: isLast
                        ? theme.borderRadius.md
                        : 0,

                      marginLeft: isFirst ? 0 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#fff" : themeColors.primaryText,
                        fontWeight: "600",
                      }}
                    >
                      {val === "normal" ? "Normal" : "Detailed"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {unlocked ? (
          loadingSummary ? (
            <ActivityIndicator size="small" color={themeColors.primaryText} />
          ) : (
            <>
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  color: themeColors.primaryText,
                }}
              >
                {summary}
              </Text>
              <CustomButton
                title="Generate New Summary"
                handlePress={resetSummary}
              />
            </>
          )
        ) : (
          <>
            <Text
              style={{
                fontSize: 14,
                marginBottom: 12,
                color: themeColors.primaryText,
              }}
            >
              Watch {getAdCount(days, detail)} ads ({days} days • {detail}) to
              unlock today's summary.
              {adsLeft > 0 && ` (${adsLeft} ads remaining)`}
            </Text>
            {loadingAd ? (
              <View style={{ alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color={themeColors.primaryText}
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: themeColors.primaryText,
                  }}
                >
                  Watching ad {currentAdNumber} of {totalAdsRef.current}
                </Text>
              </View>
            ) : (
              <CustomButton
                title={`Unlock with ${getAdCount(days, detail)} Ads`}
                handlePress={handleUnlock}
                loadingText="Loading Ads"
                isLoading={loadingAd}
              />
            )}
          </>
        )}
      </View>
    </LinearGradient>
  );
}
