// components/Theme/ThemedCard.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CelestialTheme } from '../../constants/Theme';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  disabled?: boolean;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  borderRadius = 'lg',
  onPress,
  disabled = false,
}) => {
  const getPaddingValue = () => {
    switch (padding) {
      case 'sm': return CelestialTheme.spacing.sm;
      case 'md': return CelestialTheme.spacing.md;
      case 'lg': return CelestialTheme.spacing.lg;
      case 'xl': return CelestialTheme.spacing.xl;
      default: return CelestialTheme.spacing.md;
    }
  };

  const getBorderRadiusValue = () => {
    switch (borderRadius) {
      case 'sm': return CelestialTheme.borderRadius.sm;
      case 'md': return CelestialTheme.borderRadius.md;
      case 'lg': return CelestialTheme.borderRadius.lg;
      case 'xl': return CelestialTheme.borderRadius.xl;
      default: return CelestialTheme.borderRadius.lg;
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      padding: getPaddingValue(),
      borderRadius: getBorderRadiusValue(),
      ...style,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: CelestialTheme.colors.background.card,
          ...CelestialTheme.shadows.lg,
        };
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(26, 35, 50, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        };
      case 'gradient':
        return {
          ...baseStyle,
          ...CelestialTheme.shadows.md,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: CelestialTheme.colors.background.card,
          ...CelestialTheme.shadows.md,
        };
    }
  };

  const CardContent = () => {
    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={CelestialTheme.colors.gradients.card}
          style={getCardStyle()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View style={getCardStyle()}>
        {children}
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
});

export default ThemedCard;
