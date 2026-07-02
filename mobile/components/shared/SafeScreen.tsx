import React from 'react'
import { Platform, StatusBar, StyleSheet, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface SafeScreenProps {
  children: React.ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export function SafeScreen({ children, style, edges = ['top', 'bottom'] }: SafeScreenProps) {
  const insets = useSafeAreaInsets()
  const isWeb = Platform.OS === 'web'

  const paddingTop = edges.includes('top')
    ? (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + insets.top + (isWeb ? 40 : 0)
    : 0

  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0
  const paddingLeft = edges.includes('left') ? insets.left : 0
  const paddingRight = edges.includes('right') ? insets.right : 0

  return (
    <View style={[styles.container, { paddingTop, paddingBottom, paddingLeft, paddingRight }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
})
