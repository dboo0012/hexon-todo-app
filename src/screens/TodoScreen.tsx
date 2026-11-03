import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddTodoForm } from "../components/AddTodoForm";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { TodoItem } from "../components/TodoItem";
import { useTodos } from "../hooks/useTodos";
import { colors, spacing } from "../theme";

export function TodoScreen() {
  const {
    status,
    todos,
    loadError,
    saving,
    addError,
    retry,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAddError,
  } = useTodos();

  const done = todos.filter((t) => t.completed).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Tasks
          </Text>
          {status === "ready" && todos.length > 0 && (
            <Text style={styles.summary}>
              {done} of {todos.length} done
            </Text>
          )}
        </View>

        <View style={styles.form}>
          <AddTodoForm
            saving={saving}
            error={addError}
            onSubmit={addTodo}
            onChangeText={clearAddError}
          />
        </View>

        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <ErrorState message={loadError ?? "Something went wrong."} onRetry={retry} />
        )}
        {status === "ready" && (
          <FlatList
            data={todos}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TodoItem todo={item} onToggle={toggleTodo} onDelete={deleteTodo} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={EmptyState}
            contentContainerStyle={[styles.list, todos.length === 0 && styles.flexGrow]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  summary: { fontSize: 15, color: colors.muted },
  form: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});
