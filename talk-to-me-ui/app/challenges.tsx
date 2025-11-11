import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/ui/Card';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Input from '@/components/ui/Input';
import { DailyChallengeStore, DailyTask, DailyChallengeData } from '@/utils/dailyChallenges';

export default function ChallengesScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [challengeData, setChallengeData] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
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

  const loadChallenges = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await challengeStore.getTodaysChallenges(userId);
      setChallengeData(data);
    } catch (error) {
      console.log('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadChallenges();
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
      await loadChallenges();
    } catch (error) {
      console.log('Failed to complete task:', error);
    }
  };

  const addUserTask = async () => {
    if (!userId || !newTaskTitle.trim()) return;
    try {
      await challengeStore.addUserTask(userId, newTaskTitle.trim());
      setNewTaskTitle('');
      setShowModal(false);
      await loadChallenges();
    } catch (error) {
      console.log('Failed to add task:', error);
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getTaskTypeIcon = (task: DailyTask) => {
    return task.type === 'recommended' ? 'star' : 'person';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your challenges...</Text>
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
          <Text style={styles.title}>Today's Challenges</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {challengeData && (
          <>
            {/* Progress Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreTitle}>Daily Progress</Text>
                <Text style={[styles.scoreValue, { color: getProgressColor(challengeData.score) }]}>
                  {challengeData.score}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${challengeData.score}%`,
                      backgroundColor: getProgressColor(challengeData.score)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.scoreSubtitle}>
                {challengeData.tasks.filter(t => t.completed).length} of {challengeData.tasks.length} tasks completed
              </Text>
              
              {/* Streak info */}
              {challengeData.streakData && (
                <View style={styles.streakInfo}>
                  <Text style={styles.streakInfoText}>
                    🔥 {challengeData.streakData.currentStreak} day streak
                  </Text>
                </View>
              )}
            </View>

            {/* Task List */}
            {challengeData.tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                onPress={() => toggleTask(task.id, task.completed)}
                disabled={task.completed}
              >
                <View style={styles.taskHeader}>
                  <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxChecked]}>
                    {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <View style={styles.taskTypeIcon}>
                    <Ionicons 
                      name={getTaskTypeIcon(task)} 
                      size={14} 
                      color={task.type === 'recommended' ? '#7C3AED' : '#059669'} 
                    />
                  </View>
                </View>
                
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
                
                {task.description && (
                  <Text style={[styles.taskDescription, task.completed && styles.taskDescriptionCompleted]}>
                    {task.description}
                  </Text>
                )}
                
                <View style={styles.taskFooter}>
                  <Text style={[styles.taskBadge, { 
                    backgroundColor: task.type === 'recommended' ? '#EDE9FE' : '#ECFDF5',
                    color: task.type === 'recommended' ? '#7C3AED' : '#059669'
                  }]}>
                    {task.type === 'recommended' ? 'Recommended' : 'Personal'}
                  </Text>
                  
                  <Text style={styles.taskTime}>
                    Expires at {new Date(task.expiresAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => {
            Keyboard.dismiss();
            setShowModal(false);
            setNewTaskTitle('');
          }}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Add Personal Task</Text>
                  <Text style={styles.modalSubtitle}>
                    Create your own challenge for today. Personal tasks expire at 11:59 PM.
                  </Text>
                  
                  <Input
                    placeholder="What would you like to accomplish?"
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    multiline
                    style={styles.taskInput}
                    autoFocus
                    blurOnSubmit={false}
                  />
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]} 
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowModal(false);
                        setNewTaskTitle('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.submitButton, { 
                        backgroundColor: newTaskTitle.trim() ? '#10B981' : '#9CA3AF'
                      }]} 
                      onPress={addUserTask}
                      disabled={!newTaskTitle.trim()}
                    >
                      <Text style={styles.addButtonText}>Add Task</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 16,
    padding: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  streakInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  streakInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskTypeIcon: {
    marginLeft: 'auto',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    color: '#9CA3AF',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  taskInput: {
    minHeight: 80,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});