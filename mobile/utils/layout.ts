import { Platform } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'

export function getTopPadding(insets: EdgeInsets): number {
  return insets.top + (Platform.OS === 'web' ? 40 : 0)
}
