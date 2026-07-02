import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (otp: string) => void;
  length?: number;
}

export function OtpInput({ value, onChange, onComplete, length = 6 }: OtpInputProps) {
  const colors = useColors();
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length && onComplete) {
      onComplete(clean);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.boxes}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  borderRadius: colors.radius,
                  borderColor: active ? colors.primary : filled ? colors.primaryLight : colors.border,
                  backgroundColor: filled ? colors.primarySurface : colors.backgroundAlt,
                  borderWidth: active ? 2 : 1.5,
                },
              ]}
            >
              <Text style={[styles.digit, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hidden}
        autoFocus
        caretHidden
      />
      <View style={StyleSheet.absoluteFill} onTouchStart={() => inputRef.current?.focus()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  boxes: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    width: 48,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: { fontSize: 22 },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
});
