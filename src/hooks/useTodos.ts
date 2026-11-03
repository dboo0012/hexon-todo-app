import { useCallback, useEffect, useReducer, useRef } from "react";
import { createTodo, fetchTodos, type Todo } from "../api/todos";
import { clearStoredTodos, loadStoredTodos, saveTodos } from "../storage/todoStorage";

export type LoadStatus = "loading" | "error" | "ready";

export interface TodosState {
  status: LoadStatus;
  todos: Todo[];
  loadError: string | null;
  saving: boolean;
  addError: string | null;
}

type Action =
  | { type: "load/start" }
  | { type: "load/success"; todos: Todo[] }
  | { type: "load/failure"; error: string }
  | { type: "add/start" }
  | { type: "add/success"; todo: Todo }
  | { type: "add/failure"; error: string }
  | { type: "add/clearError" }
  | { type: "toggle"; id: number }
  | { type: "delete"; id: number };

export const initialState: TodosState = {
  status: "loading",
  todos: [],
  loadError: null,
  saving: false,
  addError: null,
};

export function todosReducer(state: TodosState, action: Action): TodosState {
  switch (action.type) {
    case "load/start":
      return { ...state, status: "loading", loadError: null };
    case "load/success":
      return { ...state, status: "ready", todos: action.todos };
    case "load/failure":
      return { ...state, status: "error", loadError: action.error };
    case "add/start":
      return { ...state, saving: true, addError: null };
    case "add/success":
      // Newest first, so the task the user just added is visible without scrolling.
      return { ...state, saving: false, todos: [action.todo, ...state.todos] };
    case "add/failure":
      return { ...state, saving: false, addError: action.error };
    case "add/clearError":
      return state.addError ? { ...state, addError: null } : state;
    case "toggle":
      return {
        ...state,
        todos: state.todos.map((t) => (t.id === action.id ? { ...t, completed: !t.completed } : t)),
      };
    case "delete":
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
  }
}

/**
 * JSONPlaceholder answers every POST with id 201, so a second added task would collide.
 * Give each created task the next id above everything already in the list (and above the
 * API's 200 seeded todos) so list keys stay unique.
 */
export function nextLocalId(todos: Todo[]): number {
  return Math.max(200, ...todos.map((t) => t.id)) + 1;
}

const message = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

export function useTodos() {
  const [state, dispatch] = useReducer(todosReducer, initialState);
  // Read the latest list inside async callbacks without re-creating them.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    dispatch({ type: "load/start" });
    try {
      const todos = await fetchTodos(10);
      if (mounted.current) dispatch({ type: "load/success", todos });
    } catch (err) {
      if (mounted.current) {
        dispatch({ type: "load/failure", error: message(err, "Could not load tasks.") });
      }
    }
  }, []);

  // On launch, restore the saved list if there is one; otherwise fetch from the API.
  // Saved data wins because the API never persists changes, so refetching would undo
  // every toggle, delete and addition the user made.
  useEffect(() => {
    void (async () => {
      const stored = await loadStoredTodos();
      if (!mounted.current) return;
      if (stored) dispatch({ type: "load/success", todos: stored });
      else await load();
    })();
  }, [load]);

  // Save whenever the list changes once it is loaded.
  useEffect(() => {
    if (state.status !== "ready") return;
    saveTodos(state.todos).catch(() => {
      // Persistence is best-effort; the in-memory list stays correct.
    });
  }, [state.status, state.todos]);

  /** Discards local changes and fetches the original 10 tasks again. */
  const resetFromApi = useCallback(async () => {
    await clearStoredTodos().catch(() => {});
    await load();
  }, [load]);

  /** Returns true when the task was added, so the form knows to clear its input. */
  const addTodo = useCallback(async (rawTitle: string): Promise<boolean> => {
    const title = rawTitle.trim();
    if (!title) {
      dispatch({ type: "add/failure", error: "Enter a task title." });
      return false;
    }
    if (stateRef.current.saving) return false;

    dispatch({ type: "add/start" });
    try {
      const created = await createTodo(title, 1);
      const todo: Todo = {
        ...created,
        id: nextLocalId(stateRef.current.todos),
        title: created.title ?? title,
        completed: false,
      };
      if (mounted.current) dispatch({ type: "add/success", todo });
      return true;
    } catch (err) {
      if (mounted.current) {
        dispatch({ type: "add/failure", error: message(err, "Could not add the task.") });
      }
      return false;
    }
  }, []);

  const toggleTodo = useCallback((id: number) => dispatch({ type: "toggle", id }), []);
  const deleteTodo = useCallback((id: number) => dispatch({ type: "delete", id }), []);
  const clearAddError = useCallback(() => dispatch({ type: "add/clearError" }), []);

  return {
    ...state,
    retry: load,
    resetFromApi,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAddError,
  };
}
