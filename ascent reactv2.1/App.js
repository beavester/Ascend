import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SetupScreen from './src/screens/SetupScreen';
import MainScreen from './src/screens/MainScreen';

import { loadData, saveData, getInitialData } from './src/services/storage';
import { colors } from './src/constants/theme';

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

  // Load data on mount
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
    };
    
    init();
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

  // Loading screen
  if (screen === SCREENS.LOADING) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
        <StatusBar style="dark" />
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
