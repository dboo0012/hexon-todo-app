import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, TOUCH_TARGET } from "../theme";

export function LoadingState() {
  return (
    <View style={styles.center} accessibilityLabel="Loading tasks" accessible>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.body}>Loading tasks…</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
      <Text style={styles.heading}>Could not load tasks</Text>
      <Text style={styles.body}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.retry, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState() {
  return (
    <View style={styles.center}>
      <Ionicons name="checkmark-done-circle-outline" size={44} color={colors.accent} />
      <Text style={styles.heading}>No tasks left</Text>
      <Text style={styles.body}>Add a task above to get started.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 48,
  },
  heading: { fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: spacing.xs },
  body: { fontSize: 15, color: colors.muted, textAlign: "center" },
  retry: {
    marginTop: spacing.md,
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    justifyContent: "center",
  },
  retryText: { color: colors.surface, fontSize: 16, fontWeight: "600" },
});
