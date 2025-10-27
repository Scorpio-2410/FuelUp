// constants/Theme.ts
// Celestial theme inspired by modern weather apps
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeBasedThemes, getThemeByTime, getCurrentTheme, ThemeMode, TimeBasedTheme } from './TimeBasedTheme';

export const CelestialTheme = {
  colors: {
    // Primary backgrounds
    background: {
      primary: '#0B1426',      // Deep night blue
      secondary: '#1A2332',    // Slightly lighter blue for cards
      tertiary: '#253141',     // Even lighter for subtle elements
      card: '#1A2332',         // Card backgrounds
      overlay: 'rgba(11, 20, 38, 0.95)', // Semi-transparent overlay
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',      // Pure white for main text
      secondary: '#B8C5D6',    // Light blue-grey for secondary text
      tertiary: '#8A9BA8',     // Muted blue-grey for subtle text
      accent: '#4A90E2',       // Bright blue for accents
      warning: '#FFD700',      // Golden yellow for warnings/alerts
    },
    
    // Accent colors
    accent: {
      primary: '#4A90E2',      // Bright blue
      secondary: '#6BB6FF',    // Lighter blue
      tertiary: '#2E5BBA',     // Darker blue
      warning: '#FFD700',      // Golden yellow
      success: '#4CAF50',      // Green for success states
      error: '#F44336',        // Red for errors
    },
    
    // Gradients
    gradients: {
      primary: ['#0B1426', '#1A2332', '#253141'],
      celestial: ['#0B1426', '#1E3A8A', '#3B82F6'],
      sunset: ['#FF6B6B', '#FFD93D', '#6BCF7F'],
      night: ['#0B1426', '#1A2332'],
      card: ['#1A2332', '#253141'],
    },
    
    // Special effects
    effects: {
      star: '#FFFFFF',
      starGlow: 'rgba(255, 255, 255, 0.8)',
      shadow: 'rgba(0, 0, 0, 0.3)',
      glow: 'rgba(74, 144, 226, 0.2)',
    }
  },
  
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    spacing: {
      tight: 0.5,
      normal: 1,
      relaxed: 1.5,
      loose: 2,
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    glow: {
      shadowColor: '#4A90E2',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    }
  }
};

export default CelestialTheme;
