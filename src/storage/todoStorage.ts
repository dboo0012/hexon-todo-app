import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Todo } from "../api/todos";

/** Versioned so a future change to the stored shape can't be misread as current data. */
export const STORAGE_KEY = "hexon-todo/tasks/v1";

function isTodo(value: unknown): value is Todo {
  const t = value as Todo;
  return (
    typeof t === "object" &&
    t !== null &&
    typeof t.id === "number" &&
    typeof t.userId === "number" &&
    typeof t.title === "string" &&
    typeof t.completed === "boolean"
  );
}

/**
 * Returns the saved list, or null when nothing usable is stored (first launch, cleared or
 * corrupted data). An empty array is a valid saved list: the user deleted everything.
 */
export async function loadStoredTodos(): Promise<Todo[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isTodo) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export async function clearStoredTodos(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
