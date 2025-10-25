import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import LiquidTabBar from '@/components/ui/LiquidTabBar';

export default function Layout() {
  return (
    <GluestackUIProvider>
      <Tabs tabBar={(props) => <LiquidTabBar {...props} />}>
        <Tabs.Screen name="home" options={{ title: 'Home', headerShown: false }} />
        <Tabs.Screen name="journal" options={{ title: 'Journal', headerShown: false }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar', headerShown: false }} />
        <Tabs.Screen name="account" options={{ title: 'Account', headerShown: false }} />
      </Tabs>
    </GluestackUIProvider>
  );
}
