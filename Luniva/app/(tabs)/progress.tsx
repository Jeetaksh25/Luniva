import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/store/useAppStore";
import { useModeColor } from "@/theme/modeColor";
import { theme } from "@/theme/theme";
import StatsBubble from "@/comps/StatsBubble";
import { getChatTrend, renderZigZag2 } from "@/utils/chatTrend";
import { Svg, Path, Circle } from "react-native-svg";
import { getStreakPercentage } from "@/utils/StreakPercentage";
import { LinearGradient } from "expo-linear-gradient";

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
    return getStreakPercentage(user.dailyStreak);
  }, [userStats]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.PageTitle, { color: themeColors.text }]}>
          Your Progress Report
        </Text>

        <View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Progress Overview
          </Text>
          <View
            style={[styles.card, { backgroundColor: themeColors.background }]}
          >
            <View style={styles.pieRow}>
              <View style={styles.pieDescription}>
                <Text
                  style={[
                    styles.pieTitle,
                    { color: theme.colors.secondaryColor },
                  ]}
                >
                  Streak Progress
                </Text>
                <Text style={[styles.pieDetail, { color: themeColors.text }]}>
                  Track how consistent you've been.
                </Text>
                <Text style={[styles.pieDetail, { color: themeColors.text }]}>
                  Current Streak: <Text style={{ fontWeight: "bold", color: theme.colors.warningColor, fontSize: theme.fontSize.md }}>{user.dailyStreak}</Text>
                </Text>

                <Text
                  style={[
                    {
                      color: theme.colors.infoColor,
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
                      <Text
                        style={[styles.pieText, { color: themeColors.text }]}
                      >
                        {progress.percentage}%
                      </Text>
                      <Text
                        style={[styles.pieSubText, { color: themeColors.text }]}
                      >
                        {progress.milestone} days
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={[styles.pieText, { color: themeColors.text }]}
                      >
                        0%
                      </Text>
                      <Text
                        style={[styles.pieSubText, { color: themeColors.text }]}
                      >
                        0 days
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Last 30 Days Activity
          </Text>
          <View
            style={[styles.card, { backgroundColor: themeColors.background }]}
          >
            <View
              style={{
                height: 120,
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              {/* Y-axis label */}
              <View
                style={{ width: axisLabelWidth, position: "absolute", left: 0 }}
              >
                <Text
                  style={[
                    styles.graphLabel,
                    {
                      color: theme.colors.successColor,
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
                      color: theme.colors.errorColor,
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
                    stroke={theme.colors.successColor}
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
              <Text style={[styles.graphLabel, { color: themeColors.text }]}>
                {startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text style={[styles.graphLabel, { color: themeColors.text }]}>
                {endDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                (Today)
              </Text>
            </View>

            <Text style={styles.graphHint}>
              <Text style={{ color: theme.colors.successColor }}>
                {" "}
                High = Done
              </Text>
              ,
              <Text style={{ color: theme.colors.errorColor }}>
                {" "}
                Low = Missed
              </Text>{" "}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatsBubble
            label="Streak"
            value={`${userStats?.currentStreak || 0}`}
          />
          <StatsBubble
            label="Highest"
            value={`${userStats?.highestStreak || 0}`}
          />
          <StatsBubble
            label="Days"
            value={`${userStats?.totalDaysChatted || 0}`}
          />
        </View>
        <View style={styles.statsRow}>
          <StatsBubble
            label="Messages"
            value={`${userStats?.totalMessages || 0}`}
          />
          <StatsBubble
            label="Avg/Day"
            value={`${userStats?.avgMessagesPerChat || 0}`}
          />
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
    justifyContent: "space-around",
    marginBottom: 20,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: 10,
    alignItems: "center",
    borderColor: theme.colors.primaryColor,
    borderWidth: 3,
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
    color: theme.colors.infoColor,
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
});
