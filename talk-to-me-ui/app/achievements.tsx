import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import AchievementGrid from '@/components/AchievementGrid';
import StreakDisplay from '@/components/StreakDisplay';
import { DailyChallengeStore, Achievement, StreakData } from '@/utils/dailyChallenges';

export default function AchievementsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const challengeStore = useMemo(() => new DailyChallengeStore(), []);

  useEffect(() => {
    const load = async () => {
      try {
        const id = Platform.OS === 'web' ? localStorage.getItem('user_id') : await AsyncStorage.getItem('user_id');
        setUserId(id);
      } catch (error) {
        console.log('Failed to load user ID:', error);
      }
    };
    load();
  }, []);

  const loadAchievements = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [achievementData, streakInfo] = await Promise.all([
        challengeStore.getAchievements(userId),
        challengeStore.getStreakData(userId)
      ]);
      setAchievements(achievementData);
      setStreakData(streakInfo);
    } catch (error) {
      console.log('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId]);

  const handleAchievementPress = (achievement: Achievement) => {
    if (achievement.unlocked) {
      Alert.alert(
        `🎉 ${achievement.title}`,
        `${achievement.description}\n\nUnlocked on ${new Date(achievement.unlockedAt!).toLocaleDateString()}\n\nRarity: ${achievement.rarity.toUpperCase()}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } else {
      Alert.alert(
        achievement.title,
        `${achievement.description}\n\nProgress: ${achievement.progress}/${achievement.target}\n\nKeep going to unlock this ${achievement.rarity} achievement!`,
        [{ text: 'Got it!', style: 'default' }]
      );
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => {
      const rarityPoints = { common: 10, rare: 25, epic: 50, legendary: 100 };
      return sum + (rarityPoints[a.rarity] || 0);
    }, 0);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Stats overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{achievements.length - unlockedCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Streak display */}
        {streakData && (
          <View style={styles.streakContainer}>
            <StreakDisplay streakData={streakData} />
          </View>
        )}

        {/* Achievement grid header */}
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementHeaderTitle}>All Achievements</Text>
          <Text style={styles.achievementHeaderSubtitle}>
            {unlockedCount}/{achievements.length} unlocked • {totalPoints} points earned
          </Text>
        </View>

        {/* Achievement cards */}
        {achievements.map(achievement => (
          <TouchableOpacity
            key={achievement.id}
            style={[
              styles.achievementCard,
              {
                backgroundColor: achievement.unlocked ? getRarityBg(achievement.rarity) : '#F9FAFB',
                borderColor: achievement.unlocked ? getRarityColor(achievement.rarity) : '#E5E7EB',
              }
            ]}
            onPress={() => handleAchievementPress(achievement)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <View style={[styles.rarityBadge, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                <Text style={[styles.rarityText, { color: getRarityColor(achievement.rarity) }]}>
                  {achievement.rarity.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[styles.achievementTitle, { color: achievement.unlocked ? '#111827' : '#6B7280' }]}>
              {achievement.title}
            </Text>
            
            <Text style={[styles.achievementDescription, { color: achievement.unlocked ? '#374151' : '#9CA3AF' }]}>
              {achievement.description}
            </Text>

            {!achievement.unlocked && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.round((achievement.progress / achievement.target) * 100)}%`,
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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  streakContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  achievementHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  achievementHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  achievementHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
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
  achievementIcon: {
    fontSize: 32,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDescription: {
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