# Hexon To Do

A small React Native (Expo) to-do app. It loads tasks from the
[JSONPlaceholder](https://jsonplaceholder.typicode.com) API, and you can add, complete and delete
them. Your changes are saved on the device.

Built for the Hexon *React Native To Do Application* (junior) technical assessment.

**Live web build: <https://todo.darylboon.me>**. The same code runs on iOS and Android through
Expo Go (see [Getting started](#getting-started)).

| | |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, React 19 |
| Language | TypeScript (strict) |
| State | React hooks (`useReducer` in a custom `useTodos` hook) |
| Networking | `fetch` with a 10 s timeout |
| Persistence (bonus) | `@react-native-async-storage/async-storage` |
| Tests | Jest (`jest-expo`) + React Native Testing Library (39 tests) |

## Features

**Required by the brief**
- Fetches the first 10 tasks from `GET /todos?_limit=10` and shows each title with its completion state. The tasks are shown as household chores (see [Notes on JSONPlaceholder](#notes-on-jsonplaceholder)).
- Tap a task to mark it done or not done. This is a local change only.
- Add a task with the form at the top. This sends `POST /todos` with `{ title, completed: false, userId: 1 }`, and the new task appears at the top of the list as soon as the request succeeds.
- Delete a task with the trash button. This is a local change only.
- A loading indicator shows while fetching. If fetching fails you see an error message and a **Retry** button. When no tasks remain you see an empty state.
- Empty or whitespace-only titles are rejected with an inline message. The Add button is disabled and shows a spinner while saving, and a failed save shows an error while keeping the text you typed.

**Bonus**
- Tasks are saved with AsyncStorage and restored on the next launch, including your toggles,
  deletions and added tasks. **Reset** discards local changes and reloads the original 10 tasks
  from the API.

Also included: a done-count in the header, 44 pt minimum touch targets, screen-reader labels and
states (checkbox and button roles, live error messages), keyboard-aware layout, and safe-area
handling.

## Getting started

**Prerequisites**
- Node.js 20.19+ (22 LTS recommended) and npm.
- One way to run the app:
  - **Expo Go** on an iOS or Android phone ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)). The phone must be on the same network as your computer.
  - An **Android emulator** (Android Studio) or the **iOS Simulator** (Xcode, macOS only).
  - A **web browser**, which needs no extra setup.

```bash
git clone https://github.com/dboo0012/hexon-todo-app.git
cd hexon-todo-app
npm install
npm start          # starts the Expo dev server and prints a QR code
```

Then:
- **Phone:** scan the QR code with the Camera app (iOS) or the Expo Go app (Android).
- **Android emulator:** press `a` in the terminal, or run `npm run android`.
- **iOS Simulator:** press `i`, or run `npm run ios`.
- **Web:** press `w`, or run `npm run web`. This opens <http://localhost:8081>.

If your phone can't reach the dev server (for example on a restricted Wi-Fi network), run
`npx expo start --tunnel`.

## Usage

1. Wait for the first 10 tasks to load.
2. Tap a task's circle or title to toggle it. The header shows how many are done.
3. Type in **Add a task** and tap **Add** (or press the keyboard's return key).
4. Tap the trash icon to delete a task.
5. Close and reopen the app: your list is restored as you left it. Tap **Reset** to start over
   from the API data.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` / `ios` / `web` | Start and open on a platform |
| `npm test` | Run the Jest test suite |
| `npm run typecheck` | TypeScript type-check (`tsc --noEmit`) |
| `npm run lint` | ESLint (`eslint-config-expo`) |
| `npm run format` | Prettier |
| `npm run build:web` | Static web build in `dist/` |
| `npm run deploy` | Build for web and deploy to Cloudflare (`wrangler.jsonc`) |

The live site is a static-assets Cloudflare Worker serving the web export; no server code runs.
To deploy your own copy, run `npx wrangler login`, change the custom domain in `wrangler.jsonc`,
then `npm run deploy`.

## Project structure

```
App.tsx                     safe-area provider + the single screen
src/
├── api/todos.ts            typed fetchTodos / createTodo, ApiError, timeout handling
├── hooks/useTodos.ts       reducer-based state: load, retry, add, toggle, delete, reset, persistence
├── storage/todoStorage.ts  AsyncStorage load / save / clear with shape validation
├── components/
│   ├── AddTodoForm.tsx     input + Add button, saving and error states
│   ├── TodoItem.tsx        checkbox row with delete button
│   └── States.tsx          loading, error + retry, and empty states
├── screens/TodoScreen.tsx  header, form, list and state switching
└── theme.ts                colours, spacing, touch-target size
```

Tests sit next to the code (`*.test.ts(x)`). They cover:
- the API client: success, HTTP errors, network failure, timeout and malformed responses;
- the hook: every state transition;
- the screen: every requirement in the brief;
- persistence: restart, empty list, corrupted data, and Reset.

## Notes on JSONPlaceholder

JSONPlaceholder is a fake API: **writes are simulated and never saved**.
- Its titles are lorem ipsum ("delectus aut autem"). The app still loads the 10 tasks from the API,
  but shows a household chore for each id (`src/api/chores.ts`), so the list reads like a real
  one. The id, completion state and userId come from the API unchanged.
- `POST /todos` always returns `id: 201`. The app gives each added task the next free id above
  every id in the list instead, so React keys stay unique when you add more than one task.
- Toggling and deleting never call the API, as the brief asks.
- Because the server forgets everything, refetching would bring back the original 10 tasks.
  That is why the app restores the saved list on launch instead of refetching, and only goes back
  to the API on first launch, after **Reset**, or if the saved data is missing or corrupted.

## Design decisions

- **One reducer, one hook.** All state transitions live in `todosReducer`, which is a pure function and easy to test. `useTodos` wires it to the API and storage, so components only render.
- **Newest tasks first.** A newly added task appears at the top, where the user can see it without scrolling.
- **Validation in the hook, not only the form.** `addTodo` trims the title and rejects blank titles, so the rule holds wherever it is called from. It also ignores a second submit while a save is in flight.
- **Errors explain the fix.** Network failures, timeouts and HTTP errors each get their own message, for example "Could not reach the server. Check your internet connection."
- **Persistence is best-effort.** A failed AsyncStorage write never breaks the in-memory list, and corrupted stored data falls back to the API.
- **Web accessibility.** Checkboxes set `aria-checked` as well as `accessibilityState`, because react-native-web ignores the latter.
