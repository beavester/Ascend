import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet, AppState } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SetupScreen from './src/screens/SetupScreen';
import MainScreen from './src/screens/MainScreen';

import { loadData, saveData, getInitialData } from './src/services/storage';
import { colors } from './src/constants/theme';
import {
  initializeNotifications,
  requestNotificationPermissions,
  scheduleAllNotifications,
  addNotificationResponseListener,
} from './src/services/notifications';

const SCREENS = {
  LOADING: 'loading',
  SPLASH: 'splash',
  ONBOARDING: 'onboarding',
  SETUP: 'setup',
  MAIN: 'main',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LOADING);
  const [data, setData] = useState(null);
  const notificationListener = useRef();
  const appState = useRef(AppState.currentState);

  // Load data on mount and initialize notifications
  useEffect(() => {
    const init = async () => {
      const savedData = await loadData();

      if (savedData) {
        setData(savedData);
        if (savedData.onboardingComplete) {
          setScreen(SCREENS.MAIN);
        } else {
          setScreen(SCREENS.SPLASH);
        }
      } else {
        setData(getInitialData());
        setScreen(SCREENS.SPLASH);
      }

      // Initialize notifications
      try {
        await initializeNotifications();
      } catch (err) {
        // Notifications may fail on simulators or if permissions denied - non-critical
      }
    };

    init();

    // Set up notification response listener (when user taps notification)
    notificationListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      // Navigate based on notification type - handled in MainScreen
      // data?.type can be 'streak_at_risk' or 'morning_reminder'
    });

    // Track app state changes for smart notifications
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - pool level refresh handled in MainScreen
      }
      appState.current = nextAppState;
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      subscription?.remove();
    };
  }, []);

  // Handle splash complete
  const handleSplashComplete = () => {
    if (data?.onboardingComplete) {
      setScreen(SCREENS.MAIN);
    } else {
      setScreen(SCREENS.ONBOARDING);
    }
  };

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    setScreen(SCREENS.SETUP);
  };

  // Handle setup complete
  const handleSetupComplete = async (setupData) => {
    const newData = {
      ...data,
      ...setupData,
      onboardingComplete: true,
      startDate: new Date().toISOString(),
    };
    
    setData(newData);
    await saveData(newData);
    setScreen(SCREENS.MAIN);
  };

  // Handle data save
  const handleSaveData = async (newData) => {
    await saveData(newData);
  };

  // Loading screen - show splash immediately, no spinner!
  // Data loads in background, user sees value within 3 seconds
  if (screen === SCREENS.LOADING) {
    return (
      <SafeAreaProvider>
        <SplashScreen onComplete={() => {}} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // Splash screen
  if (screen === SCREENS.SPLASH) {
    return (
      <SafeAreaProvider>
        <SplashScreen onComplete={handleSplashComplete} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // Onboarding screen
  if (screen === SCREENS.ONBOARDING) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // Setup screen
  if (screen === SCREENS.SETUP) {
    return (
      <SafeAreaProvider>
        <SetupScreen 
          onComplete={handleSetupComplete} 
          initialData={data}
        />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  // Main app
  return (
    <SafeAreaProvider>
      <MainScreen 
        data={data} 
        setData={setData} 
        saveData={handleSaveData}
      />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});
