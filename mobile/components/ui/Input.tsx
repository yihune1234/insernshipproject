import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { useColors } from '@/hooks/useColors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
}

export function Input({ label, error, hint, leftIcon, secureTextEntry, ...props }: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.textMuted, fontFamily: 'Poppins_500Medium' }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          {
            borderColor,
            borderRadius: colors.radius,
            backgroundColor: focused ? colors.primarySurface : colors.backgroundAlt,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textMuted} style={styles.leftIcon} />
        )}
        <TextInput
          {...props}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.input,
            { color: colors.text, fontFamily: 'Poppins_400Regular' },
            leftIcon ? { paddingLeft: 0 } : {},
          ]}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden(!hidden)} style={styles.eye}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error, fontFamily: 'Poppins_400Regular' }]}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textSubtle, fontFamily: 'Poppins_400Regular' }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13 },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 54,
    gap: 10,
  },
  leftIcon: {},
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eye: { padding: 4 },
  error: { fontSize: 12 },
  hint: { fontSize: 12 },
});
