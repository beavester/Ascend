import { useColorScheme } from 'react-native';
import { 
  lightColors, 
  darkColors, 
  shadows, 
  darkShadows,
  getStreakColor 
} from '../constants/theme';

/**
 * Custom hook for theme-aware styling
 * Returns colors, shadows, and utility functions based on system appearance
 */
export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  return {
    colors: isDark ? darkColors : lightColors,
    shadows: isDark ? darkShadows : shadows,
    isDark,
    // Utility function for streak colors
    getStreakColor: (days) => getStreakColor(days, isDark),
  };
};

export default useTheme;
