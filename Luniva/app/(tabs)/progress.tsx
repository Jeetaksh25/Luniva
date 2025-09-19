import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  findNodeHandle,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useAppStore";
import { useModeColor } from "@/theme/modeColor";
import { theme } from "@/theme/theme";
import StatsBubble from "@/comps/StatsBubble";
import { getChatTrend, renderZigZag2 } from "@/utils/chatTrend";
import { Svg, Path, Circle } from "react-native-svg";
import { getStreakPercentage } from "@/utils/StreakPercentage";
import { LinearGradient } from "expo-linear-gradient";
import SummaryCard from "@/comps/SummaryCard";
import CustomButton from "@/comps/CustomButton";

const windowHeight = Dimensions.get("window").height;

const Progress = () => {
  const themeColors = useModeColor();
  const userStats = useStore((state) => state.userStats);
  const chats = useStore((state) => state.chats);
  const user = useStore((state) => state.user);

  const axisLabelWidth = 30; // space reserved for Y-axis labels
  const screenWidth = Dimensions.get("window").width - axisLabelWidth - 40;

  // 30-day trend
  const todayStr = new Date().toISOString().split("T")[0];
  const monthOffsets = Array.from({ length: 30 }, (_, i) => i - 29); // -29..0
  const trend = monthOffsets.map((offset) => {
    const [year, month, day] = todayStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const chat = chats.find((c: any) => c.date === dateStr);

    if (!chat) return 10;
    if (chat.status === "done") return 30;
    return 10;
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  const endDate = new Date();

  const zigzagPath = renderZigZag2(trend, screenWidth);

  const progress = useMemo(() => {
    if (!user) return { percentage: 0, milestone: 0 };
    return getStreakPercentage(user.dailyStreak || 0);
  }, [user]);

  const scrollRef = useRef<ScrollView>(null);
  const summaryRef = useRef<View>(null);

  const handleScrollToSummary = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: themeColors.background }]}
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        <Text style={[styles.PageTitle, { color: themeColors.text }]}>
          Your Journey
        </Text>

        <View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Milestone Tracker
          </Text>
          <LinearGradient
            colors={["#FF6F61", "#6A4C93"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.card}
          >
            <View style={styles.pieRow}>
              <View style={styles.pieDescription}>
                <Text
                  style={[
                    styles.pieTitle,
                    { color: "white", fontWeight: "bold" },
                  ]}
                >
                  Streak Milestone
                </Text>
                <Text style={[styles.pieDetail, { color: "white" }]}>
                  Track how consistent you've been.
                </Text>
                <Text style={[styles.pieDetail, { color: "white" }]}>
                  Current Streak:{" "}
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.warningColor,
                      fontSize: theme.fontSize.md,
                    }}
                  >
                    {user.dailyStreak}
                  </Text>
                </Text>

                <Text
                  style={[
                    {
                      color: "white",
                      fontSize: 8,
                      position: "absolute",
                      bottom: -40,
                    },
                  ]}
                >
                  This updates as your streak progress increases beyond the
                  current milestone.
                </Text>
              </View>

              <View style={styles.pieContainer}>
                <Svg height="150" width="130" viewBox="0 0 100 100">
                  <Circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#cccccc30"
                    strokeWidth="10"
                    fill="none"
                  />
                  <Circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={theme.colors.successColor}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray="282.6"
                    strokeDashoffset={282.6 * (1 - progress.percentage / 100)}
                    strokeLinecap="round"
                    rotation="-85"
                    origin="50,50"
                  />
                </Svg>

                <View style={styles.pieCenter}>
                  {progress.milestone > 0 ? (
                    <>
                      <Text style={[styles.pieText, { color: "white" }]}>
                        {progress.percentage}%
                      </Text>
                      <Text style={[styles.pieSubText, { color: "white" }]}>
                        {progress.milestone} days
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.pieText, { color: "white" }]}>
                        0%
                      </Text>
                      <Text style={[styles.pieSubText, { color: "white" }]}>
                        0 days
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            30-Day Pulse
          </Text>
          <LinearGradient
            colors={["#FF6F61", "#6A4C93"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.card}
          >
            <View
              style={{
                height: 100,
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              {/* Y-axis label */}
              <View
                style={{
                  width: axisLabelWidth,
                  position: "absolute",
                  left: 0,
                }}
              >
                <Text
                  style={[
                    styles.graphLabel,
                    {
                      color: "white",
                      position: "absolute",
                      top: -80,
                      left: 0,
                    },
                  ]}
                >
                  High
                </Text>
                <Text
                  style={[
                    styles.graphLabel,
                    {
                      color: "white",
                      position: "absolute",
                      bottom: 10,
                      left: 0,
                    },
                  ]}
                >
                  Low
                </Text>
              </View>

              <View style={{ flex: 1, overflow: "visible" }}>
                <Svg height="80" width={screenWidth}>
                  <Path
                    d={zigzagPath}
                    stroke={theme.colors.infoColor}
                    strokeWidth="3"
                    fill="none"
                  />
                </Svg>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
                width: "100%",
              }}
            >
              <Text style={[styles.graphLabel, { color: "white" }]}>
                {startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text style={[styles.graphLabel, { color: "white" }]}>
                {endDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                (Today)
              </Text>
            </View>

            <Text style={styles.graphHint}>
              <Text style={{ color: "white" }}> High = Done</Text>,
              <Text style={{ color: "white" }}> Low = Missed</Text>{" "}
            </Text>
          </LinearGradient>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Journey Recap
          </Text>
          <SummaryCard chats={chats} />
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Highlights
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Current Streak"
                value={`${user.dailyStreak || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Highest Streak"
                value={`${userStats?.highestStreak || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Total Days Chatted"
                value={`${userStats?.totalDaysChatted || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Total Messages"
                value={`${userStats?.totalMessages || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Avg Msgs/Chat"
                value={`${userStats?.avgMessagesPerChat || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Consistency"
                value={`${userStats?.consistency || 0}%`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Avg Streak"
                value={`${userStats?.avgStreak || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Peak Msgs/Day"
                value={`${userStats?.peakMessages || 0}`}
              />
            </View>
            <View style={styles.statsItem}>
              <StatsBubble
                label="Chats This Month"
                value={`${userStats?.chattingDaysThisMonth || 0}`}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Progress;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 30,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  PageTitle: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "space-between",
  },

  statsItem: {
    width: "30%",
    padding: 6,
    alignItems: "center",
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pieContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  pieCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  pieText: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 24,
  },
  graphHint: {
    fontSize: theme.fontSize.xs,
    marginTop: 10,
    color: "white",
  },
  pieSubText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: -2,
  },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  pieDescription: {
    flex: 1,
    paddingRight: 15,
    gap: 8,
  },

  pieTitle: {
    fontSize: 16,
    fontWeight: "700",
    position: "absolute",
    top: -40,
    color: theme.colors.secondaryColor,
  },

  pieDetail: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  graphLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: "600",
  },
  scrollBtn: {
    marginTop: 15,
    padding: 10,
    backgroundColor: theme.colors.primaryColor,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
});
