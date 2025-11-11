import supabaseClient from '../services/supabaseClient.js';

// Helper function to get today's date
const getTodayDate = () => {
  return new Date().toISOString().slice(0, 10);
};

// Daily Challenges endpoints
async function getTodaysChallenges(req, res) {
  const { user_id } = req.params;
  const date = req.query.date || getTodayDate();
  
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  
  try {
    // Get or create daily challenges
    let { data, error } = await supabaseClient.getUserDailyChallenges(user_id, date);
    
    if (error) {
      return res.status(500).json({ error });
    }
    
    // If no record exists, create one with recommended tasks
    if (!data) {
      // Generate recommended tasks (you can extract this to a helper function)
      const recommendedTasks = await generateRecommendedTasks();
      
      const insertResult = await supabaseClient.insertUserDailyChallenges({
        user_id,
        date,
        daily_tasks: recommendedTasks,
        score: 0
      });
      
      if (insertResult.error) {
        return res.status(500).json({ error: insertResult.error });
      }
      
      data = insertResult.data;
    }
    
    // Get streak data
    const streakResult = await getOrCreateStreakData(user_id);
    if (streakResult.error) {
      return res.status(500).json({ error: streakResult.error });
    }
    
    // Get achievements
    const achievementsResult = await getUserAchievementsWithProgress(user_id);
    if (achievementsResult.error) {
      return res.status(500).json({ error: achievementsResult.error });
    }
    
    res.json({
      date,
      tasks: data.daily_tasks || [],
      score: data.score || 0,
      lastResetAt: data.updated_at || data.created_at,
      streakData: {
        currentStreak: streakResult.data.current_streak || 0,
        longestStreak: streakResult.data.longest_streak || 0,
        lastCompletionDate: streakResult.data.last_completion_date || '',
        streakHistory: [] // TODO: Implement if needed
      },
      achievements: achievementsResult.data,
      totalTasksCompleted: streakResult.data.total_tasks_completed || 0,
      perfectDays: streakResult.data.perfect_days_count || 0
    });
    
  } catch (error) {
    console.error('Error in getTodaysChallenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function addUserTask(req, res) {
  const { user_id } = req.params;
  const { title, description } = req.body || {};
  const date = getTodayDate();
  
  if (!user_id || !title) {
    return res.status(400).json({ error: 'Missing user_id or title' });
  }
  
  try {
    // Get current daily challenges
    const { data: currentData, error: fetchError } = await supabaseClient.getUserDailyChallenges(user_id, date);
    if (fetchError) {
      return res.status(500).json({ error: fetchError });
    }
    
    if (!currentData) {
      return res.status(404).json({ error: 'Daily challenges not found for today' });
    }
    
    // Create new user task
    const newTask = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description?.trim() || null,
      type: 'user',
      completed: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      source: 'user'
    };
    
    // Add to existing tasks
    const updatedTasks = [...(currentData.daily_tasks || []), newTask];
    const newScore = calculateScore(updatedTasks);
    
    // Update in database
    const { error: updateError } = await supabaseClient.updateUserDailyChallenges({
      user_id,
      date,
      daily_tasks: updatedTasks,
      score: newScore,
      current_version: currentData.version
    });
    
    if (updateError) {
      return res.status(500).json({ error: updateError });
    }
    
    res.json({ data: newTask });
    
  } catch (error) {
    console.error('Error in addUserTask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function completeTask(req, res) {
  const { user_id, task_id } = req.params;
  const date = getTodayDate();
  
  if (!user_id || !task_id) {
    return res.status(400).json({ error: 'Missing user_id or task_id' });
  }
  
  try {
    // Get current daily challenges
    const { data: currentData, error: fetchError } = await supabaseClient.getUserDailyChallenges(user_id, date);
    if (fetchError) {
      return res.status(500).json({ error: fetchError });
    }
    
    if (!currentData) {
      return res.status(404).json({ error: 'Daily challenges not found for today' });
    }
    
    const tasks = currentData.daily_tasks || [];
    const task = tasks.find(t => t.id === task_id);
    
    if (!task || task.completed) {
      return res.status(400).json({ error: 'Task not found or already completed' });
    }
    
    task.completed = true;
    const newScore = calculateScore(tasks);
    const isNewPerfectDay = newScore === 100 && currentData.score !== 100;
    
    // Update daily challenges
    const { error: updateError } = await supabaseClient.updateUserDailyChallenges({
      user_id,
      date,
      daily_tasks: tasks,
      score: newScore,
      current_version: currentData.version
    });
    
    if (updateError) {
      return res.status(500).json({ error: updateError });
    }
    
    // Update streaks and achievements
    await updateStreakAndAchievements(user_id, newScore, isNewPerfectDay);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error in completeTask:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserAchievements(req, res) {
  const { user_id } = req.params;
  
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  
  try {
    const result = await getUserAchievementsWithProgress(user_id);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({ data: result.data });
    
  } catch (error) {
    console.error('Error in getUserAchievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getNewlyUnlockedAchievements(req, res) {
  const { user_id } = req.params;
  const date = req.query.date || getTodayDate();
  
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  
  try {
    // Get today's unlocked achievements
    const { data: unlockedData, error } = await supabaseClient.getTodaysUnlockedAchievements(user_id, date);
    if (error) {
      return res.status(500).json({ error });
    }
    
    // Get all achievements to map the data
    const { data: allAchievements, error: achievementsError } = await supabaseClient.getAllAchievements();
    if (achievementsError) {
      return res.status(500).json({ error: achievementsError });
    }
    
    const achievementMap = new Map((allAchievements || []).map(a => [a.id, a]));
    
    const result = (unlockedData || [])
      .map(userAchievement => {
        const achievement = achievementMap.get(userAchievement.achievement_id);
        if (!achievement) return null;
        
        return {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          type: achievement.category,
          target: achievement.progress_required,
          progress: userAchievement.progress,
          unlocked: true,
          unlockedAt: userAchievement.unlocked_at,
          rarity: achievement.rarity
        };
      })
      .filter(Boolean);
    
    res.json({ data: result });
    
  } catch (error) {
    console.error('Error in getNewlyUnlockedAchievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper functions
async function generateRecommendedTasks() {
  const fallbackTasks = [
    { title: 'Write 3 things you\'re grateful for', description: 'Take a moment to appreciate what you have' },
    { title: 'Take a 10-minute walk', description: 'Get some fresh air and move your body' },
    { title: 'Call or text someone you care about', description: 'Strengthen your connections' },
    { title: 'Practice deep breathing for 5 minutes', description: 'Focus on your breath and relax' },
    { title: 'Tidy up one small area', description: 'Organize a drawer, desk, or corner of a room' }
  ];
  
  // Try API first, fallback to local tasks
  try {
    const response = await fetch('https://api.quotable.io/quotes?tags=motivational&limit=5');
    const data = await response.json();
    
    const apiTasks = data.results.map((quote, index) => ({
      id: `rec_${Date.now()}_${index}`,
      title: `Reflect on: "${quote.content}"`,
      description: `Take 5 minutes to think about this quote by ${quote.author}`,
      type: 'recommended',
      completed: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      source: 'api'
    }));
    
    return apiTasks;
  } catch (error) {
    console.log('API failed, using fallback tasks');
    return fallbackTasks.map((task, index) => ({
      id: `rec_${Date.now()}_${index}`,
      title: task.title,
      description: task.description,
      type: 'recommended',
      completed: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      source: 'fallback'
    }));
  }
}

async function getOrCreateStreakData(user_id) {
  const { data, error } = await supabaseClient.getUserStreaks(user_id);
  
  if (error) {
    return { error };
  }
  
  if (data) {
    return { data };
  }
  
  // Create new streak record
  const { data: newData, error: insertError } = await supabaseClient.insertUserStreaks({
    user_id,
    current_streak: 0,
    longest_streak: 0,
    last_completion_date: null,
    perfect_days_count: 0,
    total_tasks_completed: 0
  });
  
  return { data: newData, error: insertError };
}

async function getUserAchievementsWithProgress(user_id) {
  // Get all available achievements
  const { data: allAchievements, error: achievementsError } = await supabaseClient.getAllAchievements();
  if (achievementsError) {
    return { error: achievementsError };
  }
  
  // Get user's progress on achievements
  const { data: userProgress, error: progressError } = await supabaseClient.getUserAchievements(user_id);
  if (progressError) {
    return { error: progressError };
  }
  
  // Create a map of user progress
  const progressMap = new Map(userProgress?.map(p => [p.achievement_id, p]) || []);
  
  // Combine all achievements with user progress
  const result = (allAchievements || []).map(achievement => {
    const userRecord = progressMap.get(achievement.id);
    
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.category,
      target: achievement.progress_required,
      progress: userRecord?.progress || 0,
      unlocked: !!userRecord?.unlocked_at,
      unlockedAt: userRecord?.unlocked_at,
      rarity: achievement.rarity
    };
  });
  
  return { data: result };
}

function calculateScore(tasks) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

async function updateStreakAndAchievements(user_id, score, isNewPerfectDay) {
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  // Get current streak data
  const streakResult = await getOrCreateStreakData(user_id);
  if (streakResult.error) {
    console.error('Failed to get streak data:', streakResult.error);
    return;
  }
  
  const currentStreak = streakResult.data;
  let newCurrentStreak = currentStreak.current_streak || 0;
  let newLongestStreak = currentStreak.longest_streak || 0;
  let newPerfectDays = (currentStreak.perfect_days_count || 0) + (isNewPerfectDay ? 1 : 0);
  let newLastCompletionDate = currentStreak.last_completion_date;
  
  // Update streak logic
  if (score >= 50) {
    if (currentStreak.last_completion_date === yesterdayStr) {
      newCurrentStreak = (currentStreak.current_streak || 0) + 1;
    } else if (currentStreak.last_completion_date !== today) {
      newCurrentStreak = 1;
    }
    
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }
    
    newLastCompletionDate = today;
  }
  
  // Update streak data
  const { error: streakError } = await supabaseClient.updateUserStreaks({
    user_id,
    current_streak: newCurrentStreak,
    longest_streak: newLongestStreak,
    last_completion_date: newLastCompletionDate,
    perfect_days_count: newPerfectDays,
    total_tasks_completed: (currentStreak.total_tasks_completed || 0) + 1,
    current_version: currentStreak.version
  });
  
  if (streakError) {
    console.error('Failed to update streaks:', streakError);
    return;
  }
  
  // Check if all tasks are completed before 10 AM for early bird achievement
  const currentTime = new Date();
  const tenAM = new Date();
  tenAM.setHours(10, 0, 0, 0);
  
  // Get current daily challenges to check if all tasks are completed
  const { data: currentChallenges } = await supabaseClient.getUserDailyChallenges(user_id, today);
  const allTasksCompleted = currentChallenges && currentChallenges.daily_tasks && 
    currentChallenges.daily_tasks.length > 0 && 
    currentChallenges.daily_tasks.every(task => task.completed);
  
  const isEarlyBird = allTasksCompleted && currentTime < tenAM;
  
  // Get previous days' data to check for consistent week achievement
  let consistentDays = 0;
  try {
    // Check consecutive days with 80%+ score, starting from today backwards
    let consecutiveDays = 0;
    
    // Check today first
    if (score >= 80) {
      consecutiveDays = 1;
      
      // Then check previous days
      for (let i = 1; i <= 6; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().slice(0, 10);
        
        const { data: dayData } = await supabaseClient.getUserDailyChallenges(user_id, dateStr);
        if (dayData && (dayData.score || 0) >= 80) {
          consecutiveDays++;
        } else {
          break; // Break streak if any day doesn't meet criteria
        }
      }
    }
    
    consistentDays = Math.min(consecutiveDays, 7);
  } catch (error) {
    console.log('Failed to check consistent week data:', error);
    consistentDays = 0;
  }
  
  // Get current achievement progress to preserve already unlocked achievements
  const { data: currentAchievements } = await supabaseClient.getUserAchievements(user_id);
  const achievementMap = new Map(currentAchievements?.map(a => [a.achievement_id, a]) || []);
  
  // Early bird: preserve if already unlocked, otherwise check current condition
  const currentEarlyBird = achievementMap.get('early_bird');
  const earlyBirdProgress = (currentEarlyBird && currentEarlyBird.progress >= 1) ? 1 : (isEarlyBird ? 1 : 0);

  // Update achievement progress for ALL achievements
  const newTotalTasks = (currentStreak.total_tasks_completed || 0) + 1;
  
  const achievementUpdates = [
    { id: 'first_completion', progress: Math.min(newTotalTasks, 1), target: 1 },
    { id: 'streak_3', progress: Math.min(newCurrentStreak, 3), target: 3 },
    { id: 'streak_7', progress: Math.min(newCurrentStreak, 7), target: 7 },
    { id: 'streak_30', progress: Math.min(newCurrentStreak, 30), target: 30 },
    { id: 'perfect_5', progress: Math.min(newPerfectDays, 5), target: 5 },
    { id: 'task_master', progress: Math.min(newTotalTasks, 100), target: 100 },
    { id: 'consistent_week', progress: Math.min(consistentDays, 7), target: 7 },
    { id: 'early_bird', progress: earlyBirdProgress, target: 1 }
  ];
  
  console.log('Achievement calculations:', {
    newTotalTasks,
    newCurrentStreak,
    newPerfectDays,
    consistentDays,
    earlyBirdProgress
  });

  // Debug logging
  console.log('Achievement Update Debug:', {
    user_id,
    score,
    originalCurrentStreak: currentStreak.current_streak,
    newCurrentStreak,
    originalPerfectDays: currentStreak.perfect_days_count,
    newPerfectDays,
    consistentDays,
    originalTotalTasks: currentStreak.total_tasks_completed,
    totalTasks: (currentStreak.total_tasks_completed || 0) + 1,
    earlyBirdProgress,
    isEarlyBird,
    allTasksCompleted,
    lastCompletionDate: currentStreak.last_completion_date,
    today,
    yesterday: yesterdayStr
  });
  
  for (const achievement of achievementUpdates) {
    const currentRecord = achievementMap.get(achievement.id);
    const shouldUnlock = achievement.progress >= achievement.target;
    
    // Preserve existing unlock date if already unlocked, otherwise set new unlock date
    let unlocked_at = null;
    if (currentRecord && currentRecord.unlocked_at) {
      unlocked_at = currentRecord.unlocked_at; // Keep existing unlock date
    } else if (shouldUnlock) {
      unlocked_at = new Date().toISOString(); // New unlock
    }
    
    console.log(`Updating achievement ${achievement.id}:`, {
      currentProgress: currentRecord?.progress || 0,
      newProgress: achievement.progress,
      target: achievement.target,
      shouldUnlock,
      unlocked_at
    });
    
    try {
      const result = await supabaseClient.upsertUserAchievement({
        user_id,
        achievement_id: achievement.id,
        progress: achievement.progress,
        unlocked_at
      });
      
      if (result.error) {
        console.error(`Error updating achievement ${achievement.id}:`, result.error);
      } else {
        console.log(`Successfully updated achievement ${achievement.id}`);
      }
    } catch (error) {
      console.error(`Failed to update achievement ${achievement.id}:`, error);
    }
  }
}

export default {
  getTodaysChallenges,
  addUserTask,
  completeTask,
  getUserAchievements,
  getNewlyUnlockedAchievements
};