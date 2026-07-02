import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface PinPadProps {
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  onComplete?: (pin: string) => void;
  darkMode?: boolean;
}

export function PinDots({ value, maxLength = 6 }: { value: string; maxLength?: number }) {
  const colors = useColors();
  return (
    <View style={styles.dots}>
      {Array.from({ length: maxLength }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i < value.length ? colors.gold : 'transparent',
              borderColor: i < value.length ? colors.gold : colors.borderStrong,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function PinPad({ value, onChange, maxLength = 6, onComplete, darkMode = false }: PinPadProps) {
  const colors = useColors();

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const handlePress = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key && value.length < maxLength) {
      const next = value + key;
      onChange(next);
      if (next.length === maxLength && onComplete) {
        setTimeout(() => onComplete(next), 100);
      }
    }
  };

  const bg = darkMode ? 'rgba(255,255,255,0.12)' : colors.backgroundAlt;
  const textCol = darkMode ? '#FFFFFF' : colors.text;

  return (
    <View style={styles.grid}>
      {keys.map((key, i) => (
        <Pressable
          key={i}
          onPress={() => handlePress(key)}
          disabled={!key}
          style={({ pressed }) => [
            styles.key,
            {
              backgroundColor: !key ? 'transparent' : bg,
              borderRadius: 50,
              opacity: pressed && key ? 0.6 : 1,
            },
          ]}
        >
          {key === 'del' ? (
            <Ionicons name="backspace-outline" size={24} color={darkMode ? '#FFFFFF' : colors.primary} />
          ) : (
            <Text style={[styles.keyText, { color: textCol, fontFamily: 'Poppins_500Medium' }]}>
              {key}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 12,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  key: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
  },
});
