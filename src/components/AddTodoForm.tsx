import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, TOUCH_TARGET } from "../theme";

interface Props {
  saving: boolean;
  error: string | null;
  onSubmit: (title: string) => Promise<boolean>;
  onChangeText?: () => void;
}

export function AddTodoForm({ saving, error, onSubmit, onChangeText }: Props) {
  const [title, setTitle] = useState("");
  const blank = title.trim().length === 0;

  async function submit() {
    if (saving) return;
    const added = await onSubmit(title);
    if (added) setTitle("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            onChangeText?.();
          }}
          onSubmitEditing={() => void submit()}
          placeholder="Add a task"
          placeholderTextColor={colors.muted}
          accessibilityLabel="New task title"
          returnKeyType="done"
          submitBehavior="submit"
          editable={!saving}
          maxLength={200}
          style={[styles.input, error ? styles.inputError : null]}
        />
        <Pressable
          onPress={() => void submit()}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Add task"
          accessibilityState={{ disabled: saving, busy: saving }}
          style={({ pressed }) => [
            styles.button,
            (saving || blank) && styles.buttonMuted,
            pressed && styles.buttonPressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.surface} testID="add-spinner" />
          ) : (
            <Text style={styles.buttonText}>Add</Text>
          )}
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: TOUCH_TARGET + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
  inputError: { borderColor: colors.danger },
  button: {
    minWidth: 72,
    minHeight: TOUCH_TARGET + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonMuted: { opacity: 0.55 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.surface, fontSize: 16, fontWeight: "600" },
  error: { color: colors.danger, fontSize: 14 },
});
