# Implementation Plan — React Native To Do App

Source brief: *Hexon Technical Assessments*, page 3 ("React Native To Do Application", junior).

Living checklist for the implementation loop: pick the first unchecked task, implement, verify,
tick it off, commit, push. Decisions go at the bottom.

## Requirements (from the brief)

- `GET https://jsonplaceholder.typicode.com/todos?_limit=10` → list with title + completion state.
- Toggle completed / incomplete **locally**.
- Add form → `POST /todos` with `{ title, completed: false, userId: 1 }`; on success add the task to the
  list immediately (no reload).
- Delete tasks **locally**.
- Loading indicator while fetching; error message + **Retry** when fetching fails; empty state when no tasks.
- Reject empty / whitespace-only titles. Disable submit while saving. Show an error if adding fails.
- Expo + functional components + hooks, TypeScript, `fetch`.
- Bonus: persist tasks with **AsyncStorage** so they survive restarts.
- Deliverables: GitHub repo + README (setup & usage).

## Architecture

```
src/
├─ api/todos.ts          fetchTodos(), createTodo() — typed fetch wrappers, throw on !res.ok
├─ hooks/useTodos.ts     state machine: status (loading|error|ready), todos, add/toggle/delete/retry,
│                        AsyncStorage hydrate + persist
├─ storage/todoStorage.ts AsyncStorage load/save (versioned key)
├─ components/           TodoItem, AddTodoForm, EmptyState, ErrorState, LoadingState
└─ screens/TodoScreen.tsx
App.tsx
```

JSONPlaceholder always returns `id: 201` for created todos, so new tasks get a local unique id
(e.g. `Date.now()`-based negative/offset id) to avoid key collisions.

## Tasks

- [x] **T1 Scaffold** — `create-expo-app` (blank-typescript), ESLint/Prettier, jest-expo + @testing-library/react-native, `.gitignore`.
- [x] **T2 API layer** — `fetchTodos`, `createTodo`, typed; unit tests with mocked `fetch` (ok, non-ok, network error).
- [x] **T3 useTodos hook** — load / retry / add (saving + error state, local id) / toggle / delete; tests.
- [x] **T4 UI** — components + screen: FlatList, checkbox toggle, delete button, add form (trim validation, disabled while saving, inline error), loading / error+retry / empty states, KeyboardAvoidingView, safe area. Component tests.
- [x] **T5 AsyncStorage bonus** — hydrate from storage on launch (skip network if present), persist on change, "Reset from API" action; tests.
- [x] **T6 Verify** — `npx expo start --web` smoke test in a browser (+ typecheck, lint, tests green).
- [ ] **T7 README** — overview, setup (Node, Expo Go / emulator / web), usage, scripts, structure, notes on JSONPlaceholder behaviour, decisions.

## Decisions

- **AsyncStorage takes precedence over the network once data exists** — otherwise the bonus is meaningless because a refetch restores the original 10 todos. A "Reset" action refetches on demand.
- **`aria-checked` alongside `accessibilityState`** — react-native-web 0.21 does not map `accessibilityState.checked` to the DOM, so web screen readers (and the browser smoke test) could not see completion state.
- **Press handlers return `void`** — `onPress={() => void submit()}` so nothing awaits a still-pending save.
- **Tests reset only the API mocks** — `jest.resetAllMocks()` also wipes the AsyncStorage mock's implementation.
