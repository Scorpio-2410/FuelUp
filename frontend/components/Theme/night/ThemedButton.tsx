// components/Theme/ThemedButton.tsx
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { CelestialTheme } from '../../constants/Theme';

interface ThemedButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: CelestialTheme.borderRadius.lg,
      ...CelestialTheme.shadows.sm,
    };

    const sizeStyles = {
      sm: {
        paddingHorizontal: CelestialTheme.spacing.md,
        paddingVertical: CelestialTheme.spacing.sm,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: CelestialTheme.spacing.lg,
        paddingVertical: CelestialTheme.spacing.md,
        minHeight: 48,
      },
      lg: {
        paddingHorizontal: CelestialTheme.spacing.xl,
        paddingVertical: CelestialTheme.spacing.lg,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: CelestialTheme.colors.accent.primary,
      },
      secondary: {
        backgroundColor: CelestialTheme.colors.background.tertiary,
        borderWidth: 1,
        borderColor: CelestialTheme.colors.accent.primary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: CelestialTheme.colors.accent.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      gradient: {
        // Handled separately with LinearGradient
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(disabled && { opacity: 0.5 }),
      ...style,
    };
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'gradient':
        return 'primary';
      case 'secondary':
      case 'outline':
        return 'accent';
      case 'ghost':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'md': return 'base';
      case 'lg': return 'lg';
      default: return 'base';
    }
  };

  const ButtonContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gradient' ? '#FFFFFF' : CelestialTheme.colors.accent.primary}
          style={styles.loader}
        />
      )}
      {icon && !loading && <>{icon}</>}
      <ThemedText
        variant={getTextColor() as any}
        size={getTextSize() as any}
        weight="semibold"
        style={styles.buttonText}
      >
        {title}
      </ThemedText>
    </>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        style={[getButtonStyle(), { padding: 0 }]}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={CelestialTheme.colors.gradients.celestial}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.gradientContent}>
          <ButtonContent />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    marginLeft: 4,
  },
  loader: {
    marginRight: 8,
  },
  gradientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CelestialTheme.spacing.lg,
    paddingVertical: CelestialTheme.spacing.md,
    minHeight: 48,
  },
});

export default ThemedButton;
