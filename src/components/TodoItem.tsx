import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Todo } from "../api/todos";
import { colors, radius, spacing, TOUCH_TARGET } from "../theme";

interface Props {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function TodoItemComponent({ todo, onToggle, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onToggle(todo.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}
        // react-native-web ignores accessibilityState.checked; aria-checked reaches the DOM.
        aria-checked={todo.completed}
        accessibilityLabel={todo.title}
        accessibilityHint={todo.completed ? "Marks the task as not done" : "Marks the task as done"}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <View style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
          {todo.completed && <Ionicons name="checkmark" size={16} color={colors.surface} />}
        </View>
        <Text style={[styles.title, todo.completed && styles.titleDone]}>{todo.title}</Text>
      </Pressable>

      <Pressable
        onPress={() => onDelete(todo.id)}
        accessibilityRole="button"
        accessibilityLabel={`Delete "${todo.title}"`}
        hitSlop={8}
        style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}

export const TodoItem = memo(TodoItemComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  toggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET + 12,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.6 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  title: { flex: 1, fontSize: 16, lineHeight: 22, color: colors.ink },
  titleDone: { color: colors.muted, textDecorationLine: "line-through" },
  delete: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  deletePressed: { backgroundColor: colors.dangerSoft },
});
