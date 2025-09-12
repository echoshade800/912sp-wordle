import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import useGameStore from '../store/gameStore';

export default function RootLayout() {
  useFrameworkReady();
  const initializeApp = useGameStore(state => state.initializeApp);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Wordle Mini' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Welcome' }} />
        <Stack.Screen name="game" options={{ title: 'Play' }} />
        <Stack.Screen name="stats" options={{ title: 'Stats & History' }} />
        <Stack.Screen name="about" options={{ title: 'About & Help' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}