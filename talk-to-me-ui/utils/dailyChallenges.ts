import API_BASE from './api';

export type DailyTask = {
  id: string;
  title: string;
  description?: string;
  type: 'recommended' | 'user';
  completed: boolean;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  source?: string; // API source or 'user'
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'completion' | 'speed' | 'consistency' | 'special';
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string; // YYYY-MM-DD
  streakHistory: { date: string; score: number }[];
};

export type DailyChallengeData = {
  date: string; // YYYY-MM-DD
  tasks: DailyTask[];
  score: number;
  lastResetAt: string; // ISO
  streakData: StreakData;
  achievements: Achievement[];
  totalTasksCompleted: number;
  perfectDays: number; // Days with 100% completion
};

export class DailyChallengeStore {
  private async loadData(userId: string): Promise<DailyChallengeData | null> {
    try {
      const response = await fetch(`${API_BASE}/api/challenges/daily/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No data found - this is normal for new users
        }
        throw new Error(`Failed to fetch challenges: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert API response to our DailyChallengeData format
      return {
        date: data.date,
        tasks: data.tasks || [],
        score: data.score || 0,
        lastResetAt: data.lastResetAt,
        streakData: data.streakData,
        achievements: data.achievements || [],
        totalTasksCompleted: data.totalTasksCompleted || 0,
        perfectDays: data.perfectDays || 0
      };
    } catch (error) {
      console.error('Error loading challenge data:', error);
      return null;
    }
  }



  private getTodayString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getEndOfDayISO(date?: Date): string {
    const target = date || new Date();
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.toISOString();
  }



  // This method is kept for potential fallback use, but the API now handles task generation
  private async generateRecommendedTasks(): Promise<DailyTask[]> {
    const tasks: DailyTask[] = [];
    const now = new Date();
    const expiresAt = this.getEndOfDayISO(now);

    try {
      const fallbackTasks = this.getFallbackTasks();
      const selectedTasks = this.shuffleArray(fallbackTasks).slice(0, 5);
      
      tasks.push(...selectedTasks.map(task => ({
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        description: task.description,
        type: 'recommended' as const,
        completed: false,
        createdAt: now.toISOString(),
        expiresAt,
        source: 'fallback'
      })));
    } catch (error) {
      console.log('Failed to generate fallback tasks');
    }

    return tasks.slice(0, 5);
  }



  private getFallbackTasks(): {title: string, description?: string}[] {
    return [
      { title: 'Write 3 things you\'re grateful for', description: 'Take a moment to appreciate what you have' },
      { title: 'Take a 10-minute walk', description: 'Get some fresh air and move your body' },
      { title: 'Call or text someone you care about', description: 'Strengthen your connections' },
      { title: 'Practice deep breathing for 5 minutes', description: 'Focus on your breath and relax' },
      { title: 'Tidy up one small area', description: 'Organize a drawer, desk, or corner of a room' },
      { title: 'Read for 15 minutes', description: 'Learn something new or enjoy a story' },
      { title: 'Drink an extra glass of water', description: 'Stay hydrated throughout the day' },
      { title: 'Compliment someone genuinely', description: 'Spread positivity to others' },
      { title: 'Spend 5 minutes in nature', description: 'Step outside and observe your surroundings' },
      { title: 'Write down one goal for tomorrow', description: 'Plan ahead for success' },
      { title: 'Listen to your favorite song', description: 'Take a music break and enjoy the moment' },
      { title: 'Do 10 push-ups or stretches', description: 'Keep your body active and strong' },
      { title: 'Smile at a stranger', description: 'Share kindness with someone new' },
      { title: 'Learn one new word', description: 'Expand your vocabulary today' },
      { title: 'Take a photo of something beautiful', description: 'Notice and capture beauty around you' }
    ];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private calculateScore(tasks: DailyTask[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }

  private initializeAchievements(): Achievement[] {
    return [
      {
        id: 'first_completion',
        title: 'Getting Started',
        description: 'Complete your first daily challenge',
        icon: '🚀',
        type: 'completion',
        target: 1,
        progress: 0,
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'streak_3',
        title: 'Fire Starter',
        description: 'Complete challenges 3 days in a row',
        icon: '🔥',
        type: 'streak',
        target: 3,
        progress: 0,
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'streak_7',
        title: 'Weekly Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        type: 'streak',
        target: 7,
        progress: 0,
        unlocked: false,
        rarity: 'rare'
      },
      {
        id: 'streak_30',
        title: 'Unstoppable Force',
        description: 'Achieve a 30-day streak',
        icon: '💎',
        type: 'streak',
        target: 30,
        progress: 0,
        unlocked: false,
        rarity: 'legendary'
      },
      {
        id: 'perfect_5',
        title: 'Perfectionist',
        description: 'Get 100% completion 5 times',
        icon: '⭐',
        type: 'completion',
        target: 5,
        progress: 0,
        unlocked: false,
        rarity: 'rare'
      },
      {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete all tasks before 10 AM',
        icon: '🌅',
        type: 'speed',
        target: 1,
        progress: 0,
        unlocked: false,
        rarity: 'common'
      },
      {
        id: 'consistent_week',
        title: 'Consistent Performer',
        description: 'Score above 80% for 7 consecutive days',
        icon: '📈',
        type: 'consistency',
        target: 7,
        progress: 0,
        unlocked: false,
        rarity: 'epic'
      },
      {
        id: 'task_master',
        title: 'Task Master',
        description: 'Complete 100 total tasks',
        icon: '🏆',
        type: 'completion',
        target: 100,
        progress: 0,
        unlocked: false,
        rarity: 'epic'
      }
    ];
  }

  private initializeStreakData(): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: '',
      streakHistory: []
    };
  }

  async getTodaysChallenges(userId: string): Promise<DailyChallengeData> {
    let data = await this.loadData(userId);

    // If no data exists, the API will create it automatically
    // The API handles daily resets and initialization
    if (!data) {
      // This should trigger the API to create a new record
      data = await this.loadData(userId);
    }

    // Fallback for safety - should rarely be needed with proper API
    if (!data) {
      const today = this.getTodayString();
      data = {
        date: today,
        tasks: [],
        score: 0,
        lastResetAt: new Date().toISOString(),
        streakData: this.initializeStreakData(),
        achievements: this.initializeAchievements(),
        totalTasksCompleted: 0,
        perfectDays: 0
      };
    }

    // Ensure all fields exist for legacy data
    if (!data.streakData) data.streakData = this.initializeStreakData();
    if (!data.achievements) data.achievements = this.initializeAchievements();
    if (typeof data.totalTasksCompleted !== 'number') data.totalTasksCompleted = 0;
    if (typeof data.perfectDays !== 'number') data.perfectDays = 0;

    return data;
  }

  async addUserTask(userId: string, title: string, description?: string): Promise<DailyTask> {
    try {
      const response = await fetch(`${API_BASE}/api/challenges/daily/${userId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add task: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error adding user task:', error);
      throw error;
    }
  }

  async completeTask(userId: string, taskId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/challenges/daily/${userId}/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to complete task: ${response.statusText}`);
      }

      // The API handles all the streak and achievement updates
      return;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  async getCompletionStats(userId: string): Promise<{completed: number, total: number, score: number}> {
    const data = await this.getTodaysChallenges(userId);
    const completed = data.tasks.filter(t => t.completed).length;
    return {
      completed,
      total: data.tasks.length,
      score: data.score
    };
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const data = await this.getTodaysChallenges(userId);
    return data.streakData;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const response = await fetch(`${API_BASE}/api/challenges/achievements/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fallback to getting from daily challenges if API fails
      const data = await this.getTodaysChallenges(userId);
      return data.achievements;
    }
  }

  async getNewlyUnlockedAchievements(userId: string): Promise<Achievement[]> {
    try {
      const response = await fetch(`${API_BASE}/api/challenges/achievements/${userId}/newly-unlocked`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch newly unlocked achievements: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching newly unlocked achievements:', error);
      // Fallback to local filtering if API fails
      const data = await this.getTodaysChallenges(userId);
      const today = new Date().toISOString().slice(0, 10);
      
      return data.achievements.filter(achievement => 
        achievement.unlocked && 
        achievement.unlockedAt?.startsWith(today)
      );
    }
  }
}