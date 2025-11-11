import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '@/utils/dailyChallenges';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type AchievementNotificationProps = {
  achievements: Achievement[];
  onDismiss: () => void;
};

// Confetti particle component
const ConfettiPiece: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  const [animValue] = useState(new Animated.Value(0));
  const [rotateValue] = useState(new Animated.Value(0));
  
  // Generate random starting position across full screen width
  const [startPosition] = useState({
    x: Math.random() * screenWidth,
    drift: (Math.random() - 0.5) * 300, // More horizontal movement
  });

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 3000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        animValue.setValue(0);
        rotateValue.setValue(0);
      });
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, screenHeight + 50],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, startPosition.drift],
  });

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          left: startPosition.x,
          transform: [
            { translateY },
            { translateX },
            { rotate },
          ],
          opacity,
        },
      ]}
    />
  );
};

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ 
  achievements, 
  onDismiss 
}) => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [bounceAnim] = useState(new Animated.Value(0));
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievements.length > 0) {
      setVisible(true);
      setCurrentIndex(0);
      setShowConfetti(true);
      
      // Animate in with bounce effect
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        // Celebration bounce
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ]).start();
    }
  }, [achievements]);

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowConfetti(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  if (!visible || achievements.length === 0) {
    return null;
  }

  const currentAchievement = achievements[currentIndex];

  // Confetti colors based on achievement rarity
  const getConfettiColors = (rarity: string) => {
    switch (rarity) {
      case 'common': return ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];
      case 'rare': return ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'];
      case 'epic': return ['#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF'];
      case 'legendary': return ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7'];
      default: return ['#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'];
    }
  };

  const bounceTransform = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Confetti Animation */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {getConfettiColors(currentAchievement.rarity).map((color, index) => 
              Array.from({ length: 15 }, (_, i) => (
                <ConfettiPiece 
                  key={`${color}-${i}`} 
                  color={color} 
                  delay={i * 100} 
                />
              ))
            ).flat()}
          </View>
        )}

        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { scale: bounceTransform }
              ],
              opacity: opacityAnim,
              backgroundColor: getRarityBg(currentAchievement.rarity),
              borderColor: getRarityColor(currentAchievement.rarity),
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.celebration}>🎉</Text>
            <Text style={styles.title}>Achievement Unlocked!</Text>
          </View>

          <View style={styles.achievementContent}>
            <Text style={styles.achievementIcon}>{currentAchievement.icon}</Text>
            <Text style={styles.achievementTitle}>{currentAchievement.title}</Text>
            <Text style={styles.achievementDescription}>
              {currentAchievement.description}
            </Text>
            
            <View style={styles.rarityBadge}>
              <Text style={[styles.rarityText, { color: getRarityColor(currentAchievement.rarity) }]}>
                {currentAchievement.rarity.toUpperCase()} ACHIEVEMENT
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            {achievements.length > 1 && (
              <Text style={styles.counter}>
                {currentIndex + 1} of {achievements.length}
              </Text>
            )}
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: getRarityColor(currentAchievement.rarity) }]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentIndex < achievements.length - 1 ? 'Next' : 'Awesome!'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebration: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  achievementContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  counter: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AchievementNotification;