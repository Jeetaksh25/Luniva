export function getStreakPercentage(dailyStreak: number, baseStreak = 30) {
    if (dailyStreak <= 0) return { percentage: 0, milestone: baseStreak };
  
    // Find the next multiple of baseStreak that is >= dailyStreak
    const milestone = Math.ceil(dailyStreak / baseStreak) * baseStreak;
  
    // Percentage relative to current milestone
    const percentage = Math.min(Math.round((dailyStreak / milestone) * 100), 100);
  
    return { percentage, milestone };
  }