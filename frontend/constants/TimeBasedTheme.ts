// constants/TimeBasedTheme.ts
// Dynamic theme system that changes based on real-time

export type ThemeMode = 'auto' | 'dawn' | 'morning' | 'day' | 'evening' | 'night' | 'midnight';

export interface TimeBasedTheme {
  name: string;
  mode: ThemeMode;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      accent: string;
      warning: string;
    };
    accent: {
      primary: string;
      secondary: string;
      tertiary: string;
      warning: string;
      success: string;
      error: string;
    };
    gradients: {
      primary: string[];
      background: string[];
      card: string[];
    };
    effects: {
      star?: string;
      starGlow?: string;
      shadow: string;
      glow: string;
    };
  };
  typography: {
    sizes: Record<string, number>;
    weights: Record<string, string>;
    spacing: Record<string, number>;
  };
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  shadows: Record<string, any>;
}

// Default app color as base
const DEFAULT_BASE = '#1a1a1a';

// Time-based themes
export const TimeBasedThemes: Record<ThemeMode, TimeBasedTheme> = {
  // Midnight (12 AM - 4 AM) - Deep dark theme
  midnight: {
    name: 'Midnight',
    mode: 'midnight',
    colors: {
      background: {
        primary: '#0a0a0a',
        secondary: '#1a1a1a',
        tertiary: '#2a2a2a',
        card: '#1a1a1a',
        overlay: 'rgba(10, 10, 10, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b3b3b3',
        tertiary: '#808080',
        accent: '#6366f1',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#6366f1',
        secondary: '#818cf8',
        tertiary: '#4f46e5',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
        background: ['#0a0a0a', '#1a1a1a'],
        card: ['#1a1a1a', '#2a2a2a'],
      },
      effects: {
        star: '#ffffff',
        starGlow: 'rgba(255, 255, 255, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.5)',
        glow: 'rgba(99, 102, 241, 0.3)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    },
  },

  // Dawn (4 AM - 7 AM) - Soft purple/blue transition
  dawn: {
    name: 'Dawn',
    mode: 'dawn',
    colors: {
      background: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        tertiary: '#0f3460',
        card: '#16213e',
        overlay: 'rgba(26, 26, 46, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#c7d2fe',
        tertiary: '#a5b4fc',
        accent: '#8b5cf6',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        tertiary: '#7c3aed',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#1a1a2e', '#16213e', '#0f3460'],
        background: ['#1a1a2e', '#16213e'],
        card: ['#16213e', '#0f3460'],
      },
      effects: {
        star: '#c7d2fe',
        starGlow: 'rgba(199, 210, 254, 0.6)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        glow: 'rgba(139, 92, 246, 0.3)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    },
  },

  // Morning (7 AM - 12 PM) - Bright blue sky with sun bloom
  morning: {
    name: 'Morning',
    mode: 'morning',
    colors: {
      background: {
        primary: '#7492BA',
        secondary: '#1A66B4',
        tertiary: '#548CCA',
        card: '#1A66B4',
        overlay: 'rgba(116, 146, 186, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#f0f9ff',
        tertiary: '#e0f2fe',
        accent: '#f59e0b',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#f59e0b',
        secondary: '#fbbf24',
        tertiary: '#d97706',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#7492BA', '#1A66B4', '#548CCA'],
        background: ['#7492BA', '#1A66B4', '#548CCA'],
        card: ['#1A66B4', '#548CCA'],
      },
      effects: {
        sun: '#FFFFFF',
        sunGlow: 'rgba(255, 255, 255, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.3)',
        glow: 'rgba(116, 146, 186, 0.4)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    },
  },

  // Day (12 PM - 5 PM) - Bright and energetic
  day: {
    name: 'Day',
    mode: 'day',
    colors: {
      background: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        tertiary: '#0369a1',
        card: '#0284c7',
        overlay: 'rgba(14, 165, 233, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#e0f2fe',
        tertiary: '#bae6fd',
        accent: '#f97316',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#f97316',
        secondary: '#fb923c',
        tertiary: '#ea580c',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#0ea5e9', '#0284c7', '#0369a1'],
        background: ['#0ea5e9', '#0284c7'],
        card: ['#0284c7', '#0369a1'],
      },
      effects: {
        star: '#fbbf24',
        starGlow: 'rgba(251, 191, 36, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.2)',
        glow: 'rgba(249, 115, 22, 0.3)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
    },
  },

  // Evening (5 PM - 8 PM) - Golden hour
  evening: {
    name: 'Evening',
    mode: 'evening',
    colors: {
      background: {
        primary: '#7c2d12',
        secondary: '#dc2626',
        tertiary: '#f97316',
        card: '#dc2626',
        overlay: 'rgba(124, 45, 18, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#fef3c7',
        tertiary: '#fde68a',
        accent: '#f59e0b',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#f59e0b',
        secondary: '#fbbf24',
        tertiary: '#d97706',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#7c2d12', '#dc2626', '#f97316'],
        background: ['#7c2d12', '#dc2626'],
        card: ['#dc2626', '#f97316'],
      },
      effects: {
        star: '#fbbf24',
        starGlow: 'rgba(251, 191, 36, 0.9)',
        shadow: 'rgba(0, 0, 0, 0.4)',
        glow: 'rgba(245, 158, 11, 0.4)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    },
  },

  // Night (8 PM - 12 AM) - Deep blue night
  night: {
    name: 'Night',
    mode: 'night',
    colors: {
      background: {
        primary: '#1e1b4b',
        secondary: '#312e81',
        tertiary: '#4338ca',
        card: '#312e81',
        overlay: 'rgba(30, 27, 75, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#c7d2fe',
        tertiary: '#a5b4fc',
        accent: '#6366f1',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#6366f1',
        secondary: '#818cf8',
        tertiary: '#4f46e5',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#1e1b4b', '#312e81', '#4338ca'],
        background: ['#1e1b4b', '#312e81'],
        card: ['#312e81', '#4338ca'],
      },
      effects: {
        star: '#ffffff',
        starGlow: 'rgba(255, 255, 255, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.5)',
        glow: 'rgba(99, 102, 241, 0.3)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    },
  },

  // Auto mode (default app color #1a1a1a)
  auto: {
    name: 'Auto',
    mode: 'auto',
    colors: {
      background: {
        primary: '#1a1a1a',
        secondary: '#2a2a2a',
        tertiary: '#3a3a3a',
        card: '#2a2a2a',
        overlay: 'rgba(26, 26, 26, 0.95)',
      },
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
        accent: '#3b82f6',
        warning: '#fbbf24',
      },
      accent: {
        primary: '#3b82f6',
        secondary: '#60a5fa',
        tertiary: '#2563eb',
        warning: '#fbbf24',
        success: '#10b981',
        error: '#ef4444',
      },
      gradients: {
        primary: ['#1a1a1a', '#2a2a2a', '#3a3a3a'],
        background: ['#1a1a1a', '#2a2a2a'],
        card: ['#2a2a2a', '#3a3a3a'],
      },
      effects: {
        shadow: 'rgba(0, 0, 0, 0.4)',
        glow: 'rgba(59, 130, 246, 0.3)',
      },
    },
    typography: {
      sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60 },
      weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
      spacing: { tight: 0.5, normal: 1, relaxed: 1.5, loose: 2 },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 },
    shadows: {
      sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
      lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    },
  },
};

// Function to get theme based on current time
export const getThemeByTime = (): ThemeMode => {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 0 && hour < 4) return 'midnight';
  if (hour >= 4 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 24) return 'night';
  
  return 'auto'; // fallback
};

// Function to get current theme
export const getCurrentTheme = (mode: ThemeMode = 'auto'): TimeBasedTheme => {
  if (mode === 'auto') {
    const timeBasedMode = getThemeByTime();
    return TimeBasedThemes[timeBasedMode];
  }
  return TimeBasedThemes[mode];
};

export default TimeBasedThemes;
