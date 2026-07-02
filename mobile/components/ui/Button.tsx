import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColors } from '@/hooks/useColors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const bgColor = {
    primary: disabled ? colors.border : colors.primary,
    secondary: colors.secondary,
    ghost: 'transparent',
    destructive: disabled ? colors.border : colors.destructive,
    outline: 'transparent',
  }[variant];

  const textColor = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    ghost: colors.primary,
    destructive: colors.destructiveForeground,
    outline: colors.primary,
  }[variant];

  const height = { sm: 40, md: 52, lg: 58 }[size];
  const fontSize = { sm: 13, md: 15, lg: 16 }[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          height,
          borderRadius: colors.radius,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: colors.primary,
          opacity: pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? 0 : 20,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, { color: textColor, fontSize, fontFamily: 'Poppins_600SemiBold' }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 0.2,
  },
});
