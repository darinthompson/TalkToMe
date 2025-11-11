import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StreakData } from '@/utils/dailyChallenges';

type StreakDisplayProps = {
  streakData: StreakData;
  style?: any;
};

const StreakDisplay: React.FC<StreakDisplayProps> = ({ streakData, style }) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#F59E0B'; // Gold for 30+ days
    if (streak >= 7) return '#8B5CF6';  // Purple for 7+ days
    if (streak >= 3) return '#EF4444';  // Red for 3+ days
    return '#10B981'; // Green for starting streak
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '💎';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '🔥';
    return '🌟';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakEmoji}>{getStreakEmoji(streakData.currentStreak)}</Text>
          <Text style={[styles.streakNumber, { color: getStreakColor(streakData.currentStreak) }]}>
            {streakData.currentStreak}
          </Text>
        </View>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <Text style={styles.streakSubtext}>
          Best: {streakData.longestStreak} days
        </Text>
      </View>

      {/* Mini streak history visualization */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Activity</Text>
        <View style={styles.historyDots}>
          {streakData.streakHistory.slice(-14).map((entry, index) => (
            <View
              key={`${entry.date}-${index}`}
              style={[
                styles.historyDot,
                {
                  backgroundColor: entry.score >= 50 
                    ? getStreakColor(streakData.currentStreak) 
                    : '#E5E7EB',
                  opacity: entry.score >= 80 ? 1 : entry.score >= 50 ? 0.7 : 0.3
                }
              ]}
            />
          ))}
        </View>
        <View style={styles.historyLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getStreakColor(streakData.currentStreak) }]} />
            <Text style={styles.legendText}>Good day (50%+)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
            <Text style={styles.legendText}>Missed day</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  streakCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  historyDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  historyDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  historyLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default StreakDisplay;