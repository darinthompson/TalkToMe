import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Achievement } from '@/utils/dailyChallenges';

type AchievementCardProps = {
  achievement: Achievement;
  onPress?: () => void;
};

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onPress }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#ECFDF5';
      case 'rare': return '#EFF6FF';
      case 'epic': return '#F3E8FF';
      case 'legendary': return '#FFFBEB';
      default: return '#F9FAFB';
    }
  };

  const progressPercentage = achievement.target > 0 
    ? Math.round((achievement.progress / achievement.target) * 100) 
    : 0;

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: getRarityBg(achievement.rarity),
          opacity: achievement.unlocked ? 1 : 0.7,
          borderColor: achievement.unlocked ? getRarityColor(achievement.rarity) : '#E5E7EB'
        }
      ]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.rarityBadge}>
          <Text style={[styles.rarityText, { color: getRarityColor(achievement.rarity) }]}>
            {achievement.rarity.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: achievement.unlocked ? '#111827' : '#6B7280' }]}>
        {achievement.title}
      </Text>
      
      <Text style={[styles.description, { color: achievement.unlocked ? '#374151' : '#9CA3AF' }]}>
        {achievement.description}
      </Text>

      {!achievement.unlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: getRarityColor(achievement.rarity)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.target}
          </Text>
        </View>
      )}

      {achievement.unlocked && achievement.unlockedAt && (
        <Text style={styles.unlockedDate}>
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

type AchievementGridProps = {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
};

const AchievementGrid: React.FC<AchievementGridProps> = ({ achievements, onAchievementPress }) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {unlockedCount}/{achievements.length} unlocked
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {achievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onPress={() => onAchievementPress?.(achievement)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default AchievementGrid;
export { AchievementCard };