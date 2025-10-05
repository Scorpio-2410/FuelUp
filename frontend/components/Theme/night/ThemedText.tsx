// components/Theme/ThemedText.tsx
import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { CelestialTheme } from '../../constants/Theme';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'warning' | 'success' | 'error';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'primary',
  size = 'base',
  weight = 'normal',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getTextColor = () => {
    switch (variant) {
      case 'primary': return CelestialTheme.colors.text.primary;
      case 'secondary': return CelestialTheme.colors.text.secondary;
      case 'tertiary': return CelestialTheme.colors.text.tertiary;
      case 'accent': return CelestialTheme.colors.text.accent;
      case 'warning': return CelestialTheme.colors.text.warning;
      case 'success': return CelestialTheme.colors.accent.success;
      case 'error': return CelestialTheme.colors.accent.error;
      default: return CelestialTheme.colors.text.primary;
    }
  };

  const getFontSize = () => {
    return CelestialTheme.typography.sizes[size];
  };

  const getFontWeight = () => {
    return CelestialTheme.typography.weights[weight];
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: getFontWeight(),
    textAlign: align,
    lineHeight: getFontSize() * CelestialTheme.typography.spacing.normal,
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default ThemedText;
