import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, Modal, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import API_BASE from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { AppointmentStore, Appointment } from '@/utils/appointments';
import { DailyChallengeStore, DailyTask, DailyChallengeData, Achievement } from '@/utils/dailyChallenges';
import AchievementNotification from '@/components/AchievementNotification';

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(2);
  const [hasAppointments, setHasAppointments] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', start: '', end: '', location: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [challengeData, setChallengeData] = useState<DailyChallengeData | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [shownAchievementIds, setShownAchievementIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const apptStore = useMemo(() => new AppointmentStore(), []);
  const challengeStore = useMemo(() => new DailyChallengeStore(), []);

  const week = useMemo(() => {
    // Generate a simple week row centered on today
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 2);
    return new Array(7).fill(0).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
        day: d.getDate(),
      };
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const id = Platform.OS === 'web' ? localStorage.getItem('user_id') : await AsyncStorage.getItem('user_id');
        setUserId(id);
        // quick optimistic update: if there is a local last mood, prefill score
        if (id) {
          const key = `last_mood_${id}`;
          let lastMood: string | null = null;
          try {
            lastMood = Platform.OS === 'web' ? localStorage.getItem(key) : await AsyncStorage.getItem(key);
          } catch {}
          if (lastMood) {
            const MOOD_MAP: Record<string, number> = {
              happy: 90, joyful: 92, good: 80, calm: 82, content: 78, neutral: 60, okay: 60, sad: 35,
              upset: 30, angry: 25, stressed: 30, anxious: 35, tired: 40, frustrated: 30, depressed: 20,
              excited: 88, optimistic: 85, grateful: 86,
            };
            const score = MOOD_MAP[String(lastMood).toLowerCase().trim()] ?? 50;
            // show immediate feedback; network recompute will override shortly
            setMoodScore(score);
          }
        }
      } catch {}
    };
    load();
  }, []);

  const computeMoodScore = useCallback(async (uid: string, signal?: AbortSignal) => {
    const MOOD_MAP: Record<string, number> = {
      happy: 90,
      joyful: 92,
      good: 80,
      calm: 82,
      content: 78,
      neutral: 60,
      okay: 60,
      sad: 35,
      upset: 30,
      angry: 25,
      stressed: 30,
      anxious: 35,
      tired: 40,
      frustrated: 30,
      depressed: 20,
      excited: 88,
      optimistic: 85,
      grateful: 86,
    };
    try {
      const res = await fetch(`${API_BASE}/api/journal/fetch-mood-history/${uid}`, { signal });
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json.data ?? [];
      if (!arr.length) { setMoodScore(null); return; }
      const last = arr.slice(-5);
      const scores = last.map((e: any) => {
        const key = String(e.user_mood || '').toLowerCase().trim();
        return MOOD_MAP[key] ?? 50;
      });
      const avg = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      setMoodScore(avg);
    } catch {}
  }, [API_BASE]);

  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    computeMoodScore(userId, ctrl.signal);
    return () => ctrl.abort();
  }, [userId, computeMoodScore]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      const ctrl = new AbortController();
      computeMoodScore(userId, ctrl.signal);
      
      loadChallenges(false);
      
      return () => ctrl.abort();
    }, [userId, computeMoodScore])
  );

  const loadChallenges = async (shouldCheckAchievements: boolean = true) => {
    if (!userId) return;
    try {
      const data = await challengeStore.getTodaysChallenges(userId);
      setChallengeData(data);
      
      // Only check for achievements if explicitly requested (e.g., after task completion)
      if (shouldCheckAchievements) {
        // Check for newly unlocked achievements that haven't been shown yet
        const newlyUnlocked = await challengeStore.getNewlyUnlockedAchievements(userId);
        const unshownAchievements = newlyUnlocked.filter((achievement: Achievement) => 
          !shownAchievementIds.has(achievement.id)
        );
        
        if (unshownAchievements.length > 0) {
          // Mark these achievements as shown
          const newShownIds = new Set(shownAchievementIds);
          unshownAchievements.forEach((achievement: Achievement) => newShownIds.add(achievement.id));
          
          setShownAchievementIds(newShownIds);
          
          // Persist to storage
          const today = new Date().toISOString().slice(0, 10);
          const shownKey = `shown_achievements_${userId}_${today}`;
          const shownArray = Array.from(newShownIds);
          
          try {
            if (Platform.OS === 'web') {
              localStorage.setItem(shownKey, JSON.stringify(shownArray));
            } else {
              await AsyncStorage.setItem(shownKey, JSON.stringify(shownArray));
            }
          } catch (storageError) {
            console.log('Failed to persist shown achievements:', storageError);
          }
          
          setNewAchievements(unshownAchievements);
        }
      }
    } catch (error) {
      console.log('Failed to load challenges:', error);
    }
  };

  useEffect(() => {
    const initializeAchievementTracking = async () => {
      if (!userId) return;
      
      try {
        const today = new Date().toISOString().slice(0, 10);
        
        // Load shown achievements from storage
        const shownKey = `shown_achievements_${userId}_${today}`;
        let shownAchievements: string[] = [];
        
        if (Platform.OS === 'web') {
          const stored = localStorage.getItem(shownKey);
          shownAchievements = stored ? JSON.parse(stored) : [];
        } else {
          const stored = await AsyncStorage.getItem(shownKey);
          shownAchievements = stored ? JSON.parse(stored) : [];
        }
        
        setShownAchievementIds(new Set(shownAchievements));
        
        // Clean up old achievement tracking data (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().slice(0, 10);
        
        if (Platform.OS === 'web') {
          // Clean up localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`shown_achievements_${userId}_`) && key < `shown_achievements_${userId}_${cutoffDate}`) {
              localStorage.removeItem(key);
            }
          });
        } else {
          // For AsyncStorage, we'll just clean up on a weekly basis
          const lastCleanupKey = `last_cleanup_${userId}`;
          const lastCleanup = await AsyncStorage.getItem(lastCleanupKey);
          if (!lastCleanup || lastCleanup < cutoffDate) {
            await AsyncStorage.setItem(lastCleanupKey, today);
          }
        }
        
      } catch (error) {
        console.log('Failed to initialize achievement tracking:', error);
        setShownAchievementIds(new Set());
      }
      
      loadChallenges(true); // Check achievements on initial load
    };
    
    if (userId) {
      initializeAchievementTracking();
    }
  }, [userId]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    if (!userId) return;
    
    // Don't allow uncompleting tasks - they stay completed once done
    if (completed) {
      return;
    }
    
    try {
      await challengeStore.completeTask(userId, taskId);
      // Reload challenges and check for new achievements after task completion
      await loadChallenges(true);
    } catch (error) {
      console.log('Failed to complete task:', error);
    }
  };

  const addUserTask = async () => {
    if (!userId || !newTaskTitle.trim()) return;
    try {
      await challengeStore.addUserTask(userId, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowChallengeModal(false);
      await loadChallenges(false); // Don't check achievements when just adding a task
    } catch (error) {
      console.log('Failed to add task:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    
    setRefreshing(true);
    try {
      // Refresh all data
      const controller = new AbortController();
      await Promise.all([
        computeMoodScore(userId, controller.signal),
        loadChallenges(true), // Check achievements on manual refresh
        fetchApptsForSelectedDay()
      ]);
    } catch (error) {
      console.log('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userId, computeMoodScore, fetchApptsForSelectedDay]);

  // platform-aware API base
  // Appointments are stored locally (AsyncStorage on native, localStorage on web)

  // Fetch appointments for the selected day
  const fetchApptsForSelectedDay = async () => {
    if (!userId) return;
    try {
      const today = new Date();
      const base = new Date(today);
      base.setDate(today.getDate() - 2 + selectedIndex);
      const dateStr = base.toISOString().slice(0, 10);
      const list = await apptStore.listForDate(userId, dateStr);
      setAppointments(list);
      setHasAppointments(list.length > 0);
    } catch (e) {
      setAppointments([]);
      setHasAppointments(false);
    }
  };

  useEffect(() => {
    fetchApptsForSelectedDay();
  }, [userId, selectedIndex]);

  const openAdd = () => {
    // Prefill date based on selected day
    const today = new Date();
    const base = new Date(today);
    base.setDate(today.getDate() - 2 + selectedIndex);
    const dateStr = base.toISOString().slice(0, 10);
    setForm({ title: '', date: dateStr, start: '09:00', end: '09:30', location: '', notes: '' });
    setShowModal(true);
  };

  const saveAppointment = async () => {
    if (!userId) return;
    if (!form.title || !form.date || !form.start || !form.end) return;
    setSaving(true);
    try {
      const startIso = new Date(`${form.date}T${form.start}:00`).toISOString();
      const endIso = new Date(`${form.date}T${form.end}:00`).toISOString();
      await apptStore.add(userId, {
        title: form.title.trim(),
        start_time: startIso,
        end_time: endIso,
        location: form.location?.trim() || '',
        notes: form.notes?.trim() || '',
      });
      setShowModal(false);
      setForm({ title: '', date: '', start: '', end: '', location: '', notes: '' });
      await fetchApptsForSelectedDay();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100, minHeight: '100%' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#111827']} // Android
          tintColor="#111827" // iOS
          title="Pull to refresh"
          titleColor="#6B7280"
        />
      }
    >
      {/* Greeting Header */}
  <View style={styles.greetingRow}>
        <View>
          <Text style={styles.hello}>Hello{userId ? ',' : ''} {userId ? 'Friend' : ''}</Text>
          <Text style={styles.subtle}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push('/(tabs)/account')}
          accessibilityRole="button"
          accessibilityLabel="Open account"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Mood score card */}
      <View style={styles.metricCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.metricLabel}>Mood score</Text>
          <TouchableOpacity onPress={() => router.push('/history')} accessibilityRole="button" accessibilityLabel="View mood history">
            <Text style={styles.metricLink}>View history →</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.metricValue}>{moodScore ?? '—'}</Text>
        <Text style={styles.metricSubtle}>Based on last 5 entries</Text>
      </View>

      {/* Streak card */}
      {challengeData?.streakData && (
        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakEmoji}>
                {challengeData.streakData.currentStreak >= 7 ? '⚡' : 
                 challengeData.streakData.currentStreak >= 3 ? '🔥' : '🌟'}
              </Text>
              <View>
                <Text style={styles.streakNumber}>{challengeData.streakData.currentStreak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={styles.streakLink}>View all →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.streakBest}>
            Personal best: {challengeData.streakData.longestStreak} days
          </Text>
        </View>
      )}

      {/* Daily challenge card */}
      <View style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>Daily challenges</Text>
          <TouchableOpacity 
            style={styles.addChallengeBtn} 
            onPress={() => setShowChallengeModal(true)}
          >
            <Text style={styles.addChallengeBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        
        {challengeData ? (
          <>
            <Text style={styles.challengeScore}>
              {challengeData.score}% complete ({challengeData.tasks.filter(t => t.completed).length}/{challengeData.tasks.length})
            </Text>
            
            <View style={styles.taskList}>
              {challengeData.tasks.slice(0, 3).map((task) => (
                <TouchableOpacity 
                  key={task.id}
                  style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
                  onPress={() => toggleTask(task.id, task.completed)}
                  disabled={task.completed}
                >
                  <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxChecked]}>
                    {task.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    {task.type === 'recommended' && (
                      <Text style={styles.taskBadge}>Recommended</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {challengeData.tasks.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/challenges')}>
                <Text style={styles.moreTasksText}>
                  +{challengeData.tasks.length - 3} more tasks • View all →
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.challengeText}>Loading today's challenges...</Text>
        )}
      </View>

      {/* Date pills */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2, marginBottom: 2 }} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {week.map((d, i) => {
          const active = i === selectedIndex;
          return (
            <TouchableOpacity key={i} onPress={() => setSelectedIndex(i)} style={[styles.datePill, active && styles.datePillActive]}>
              <Text style={[styles.dateWeek, active && styles.dateActiveText]}>{d.label}</Text>
              <View style={[styles.dateCircle, active && styles.dateCircleActive]}><Text style={[styles.dateNum, active && styles.dateActiveText]}>{d.day}</Text></View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Appointments or empty state */}
      {/* Add appointment button */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAdd()}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* No appointments message (between calendar and Your plan) */}
      {hasAppointments ? (
        <View style={styles.apptList}>
          {appointments.map((a, idx) => (
            <View key={idx} style={styles.apptItem}>
              <Text style={styles.apptTitle}>{a.title}</Text>
              <Text style={styles.apptTime}>{new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(a.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {!!a.location && <Text style={styles.apptMeta}>{a.location}</Text>}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyAppointments}>
          <Text style={styles.emptyText}>You have no appointments.</Text>
        </View>
      )}

      {/* Your plan */}
      <Text style={styles.sectionTitle}>Your plan</Text>
      <View style={styles.planRow}>
        <View style={[styles.planCard, { backgroundColor: '#FEE5A1' }]}>
          <Text style={styles.planBadge}>Medium</Text>
          <Text style={styles.planTitle}>Mood Reflection</Text>
          <Text style={styles.planMeta}>Today • 9:00–9:15 AM</Text>
          <TouchableOpacity onPress={() => router.push('/journal-entry')}>
            <Text style={styles.planLink}>Start now →</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.planCard, { backgroundColor: '#CDE6FF' }]}>
          <Text style={styles.planBadge}>Light</Text>
          <Text style={styles.planTitle}>Breathing Break</Text>
          <Text style={styles.planMeta}>6:00–6:10 PM</Text>
          <TouchableOpacity onPress={() => router.push('/chat')}>
            <Text style={styles.planLink}>Guided chat →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    {/* Add Appointment Modal */}
    <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowModal(false);
        }}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>New appointment</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  value={form.title}
                  onChangeText={(v) => setForm({ ...form, title: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date (YYYY-MM-DD)"
                  value={form.date}
                  onChangeText={(v) => setForm({ ...form, date: v })}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Start (HH:MM)"
                    value={form.start}
                    onChangeText={(v) => setForm({ ...form, start: v })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="End (HH:MM)"
                    value={form.end}
                    onChangeText={(v) => setForm({ ...form, end: v })}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Location (optional)"
                  value={form.location}
                  onChangeText={(v) => setForm({ ...form, location: v })}
                />
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  placeholder="Notes (optional)"
                  multiline
                  value={form.notes}
                  onChangeText={(v) => setForm({ ...form, notes: v })}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} 
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowModal(false);
                    }} 
                    disabled={saving}
                  >
                    <Text style={[styles.modalBtnText, { color: '#111827' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, { 
                      backgroundColor: saving ? '#9CA3AF' : '#10B981'
                    }]} 
                    onPress={saveAppointment} 
                    disabled={saving}
                  >
                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>{saving ? 'Saving…' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Add Challenge Task Modal */}
    <Modal visible={showChallengeModal} transparent animationType="slide" onRequestClose={() => setShowChallengeModal(false)}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowChallengeModal(false);
          setNewTaskTitle('');
        }}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Add personal task</Text>
                <Text style={styles.modalSubtitle}>Create your own challenge for today (expires at 11:59 PM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What would you like to accomplish?"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  multiline
                  autoFocus
                  blurOnSubmit={false}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} 
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowChallengeModal(false);
                      setNewTaskTitle('');
                    }}
                  >
                    <Text style={[styles.modalBtnText, { color: '#111827' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, { 
                      backgroundColor: newTaskTitle.trim() ? '#10B981' : '#9CA3AF'
                    }]} 
                    onPress={addUserTask}
                    disabled={!newTaskTitle.trim()}
                  >
                    <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>

    {/* Achievement notifications */}
    <AchievementNotification 
      achievements={newAchievements}
      onDismiss={() => setNewAchievements([])}
    />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F5F9',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F6F5F9',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hello: {
    fontSize: 22,
    color: '#101112',
    fontWeight: '700',
  },
  subtle: {
    color: '#6B7280',
    marginTop: 4,
  },
  avatarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  challengeCard: {
    marginTop: 12,
    backgroundColor: '#EAE2FF',
    borderRadius: 22,
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  challengeText: { color: '#374151', marginTop: 4 },
  challengeScore: { 
    color: '#374151', 
    marginTop: 4, 
    fontSize: 14,
    fontWeight: '600' 
  },
  addChallengeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addChallengeBtnText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '700',
  },
  taskList: {
    marginTop: 12,
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskBadge: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    marginTop: 2,
  },
  moreTasksText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },

  datePill: {
    marginHorizontal: 6,
    alignItems: 'center',
  },
  dateWeek: { color: '#9CA3AF', fontSize: 12 },
  dateCircle: {
    marginTop: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNum: { color: '#111827', fontWeight: '600' },
  datePillActive: {},
  dateCircleActive: { backgroundColor: '#111827', borderColor: '#111827' },
  dateActiveText: { color: '#fff' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  planRow: { flexDirection: 'row', gap: 12 },
  planCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  planBadge: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  planTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  planMeta: { color: '#374151', marginTop: 2 },
  planLink: { color: '#111827', marginTop: 10, textDecorationLine: 'underline', fontWeight: '600' },
  emptyAppointments: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  emptyText: { color: '#6B7280', fontSize: 14 },
  sectionTitle: { marginTop: 6, marginBottom: 6, fontWeight: '700', fontSize: 18, color: '#111827' },
  apptList: { gap: 8, marginBottom: 6 },
  apptItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  apptTitle: { color: '#111827', fontWeight: '700' },
  apptTime: { color: '#374151', marginTop: 2 },
  apptMeta: { color: '#6B7280', marginTop: 2 },

  addBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#111827', borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  modalContainer: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginBottom: 8, color: '#111827' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  modalBtnText: { fontWeight: '700' },
  // Mood metric styles
  metricCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  metricLabel: { color: '#6B7280', fontWeight: '600' },
  metricValue: { fontSize: 34, fontWeight: '800', color: '#111827', marginTop: 6 },
  metricSubtle: { color: '#6B7280', marginTop: 2 },
  metricLink: { color: '#111827', fontWeight: '700', textDecorationLine: 'underline' },
  
  // Streak styles
  streakCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  streakLink: {
    color: '#111827',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  streakBest: {
    fontSize: 12,
    color: '#6B7280',
  },
});
