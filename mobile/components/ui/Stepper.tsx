import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useColors } from '@/hooks/useColors'

interface StepperProps {
  current: number
  total: number
  labels?: string[]
}

export function Stepper({ current, total, labels }: StepperProps) {
  const colors = useColors()

  if (labels) {
    return (
      <View style={styles.stepper}>
        {Array.from({ length: total }, (_, i) => {
          const done = i < current - 1
          const active = i === current - 1
          return (
            <View key={i} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: done ? colors.primary : active ? colors.gold : colors.border },
                ]}
              >
                <Text style={[styles.stepNum, { color: active || done ? '#FFF' : colors.textSubtle }]}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: active ? colors.text : colors.textSubtle,
                    fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                  },
                ]}
              >
                {labels[i]}
              </Text>
              {i < total - 1 && (
                <View style={[styles.stepLine, { backgroundColor: done ? colors.primary : colors.border }]} />
              )}
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.primarySurface }]}>
      <Text style={[styles.badgeText, { color: colors.primary, fontFamily: 'Poppins_500Medium' }]}>
        Step {current} of {total}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 10, marginLeft: 4 },
  stepLine: { width: 24, height: 2, marginHorizontal: 4, borderRadius: 1 },
})
