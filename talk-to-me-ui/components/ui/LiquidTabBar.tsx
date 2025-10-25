import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const ICONS: Record<string, { inactive: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }>= {
  home: { inactive: 'home-outline', active: 'home' },
  journal: { inactive: 'book-outline', active: 'book' },
  calendar: { inactive: 'calendar-outline', active: 'calendar' },
  account: { inactive: 'person-outline', active: 'person' },
};

export default function LiquidTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = state.index;

  const screenWidth = Dimensions.get('window').width;
  const [measuredWidth, setMeasuredWidth] = React.useState<number>(screenWidth - 32);
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - measuredWidth) > 0.5) setMeasuredWidth(w);
  };
  const tabWidth = measuredWidth / state.routes.length;
  const blobSize = 46;
  const blobY = 9; // vertical center for 64 height container
  // base left relative to container's content (no external margins)
  const baseLeft = tabWidth / 2 - blobSize / 2;
  const translateX = useSharedValue(activeIndex * tabWidth);

  // update animation on index change
  React.useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth, { damping: 18, stiffness: 180 });
  }, [activeIndex, tabWidth, translateX]);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom - 4, 0) }]}> 
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="light" style={[styles.container]} onLayout={onContainerLayout}> 
          <InnerContent />
        </BlurView>
      ) : (
        <View style={[styles.container, { backgroundColor: 'rgba(28,28,30,0.88)' }]} onLayout={onContainerLayout}> 
          <InnerContent />
        </View>
      )}
    </View>
  );

  function InnerContent() {
    return (
      <View style={StyleSheet.absoluteFill}>
        {/* Liquid blob */}
        <Animated.View
          style={[styles.blob, { width: blobSize, height: blobSize, top: blobY, left: baseLeft }, blobStyle]}
        />

        {/* Tabs */}
  <View style={[styles.row, { width: measuredWidth }]}> 
          {state.routes.map((route, index) => {
            const isFocused = activeIndex === index;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };
            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            const icon = ICONS[route.name] || ICONS.home;
            const color = isFocused ? '#111827' : '#8E8E93';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.tab, { width: tabWidth }]}
                activeOpacity={0.8}
              >
                <View>
                  <Ionicons
                    name={(isFocused ? icon.active : icon.inactive) as any}
                    size={26}
                    color={color}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 64,
    borderRadius: 32,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
