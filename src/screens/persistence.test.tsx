import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import App from "../../App";
import * as api from "../api/todos";
import type { Todo } from "../api/todos";
import { STORAGE_KEY } from "../storage/todoStorage";

jest.mock("../api/todos", () => ({
  ...jest.requireActual("../api/todos"),
  fetchTodos: jest.fn(),
  createTodo: jest.fn(),
}));

const fetchTodos = api.fetchTodos as jest.MockedFunction<typeof api.fetchTodos>;
const createTodo = api.createTodo as jest.MockedFunction<typeof api.createTodo>;

const seed: Todo[] = [
  { id: 1, userId: 1, title: "Wash the dishes", completed: false },
  { id: 2, userId: 1, title: "Take out the rubbish", completed: false },
];

// Reset only the API mocks: resetAllMocks would also wipe the AsyncStorage mock.
afterEach(() => {
  fetchTodos.mockReset();
  createTodo.mockReset();
});

const stored = async () => JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? "null");

it("saves changes and restores them after a restart without refetching", async () => {
  fetchTodos.mockResolvedValue(seed);
  createTodo.mockResolvedValue({ id: 201, userId: 1, title: "Buy milk", completed: false });

  const first = await render(<App />);
  await fireEvent.press(await screen.findByRole("checkbox", { name: "Wash the dishes" }));
  await fireEvent.press(screen.getByRole("button", { name: 'Delete "Take out the rubbish"' }));
  await fireEvent.changeText(screen.getByLabelText("New task title"), "Buy milk");
  await fireEvent.press(screen.getByRole("button", { name: "Add task" }));
  await screen.findByRole("checkbox", { name: "Buy milk" });

  await waitFor(async () => expect(await stored()).toHaveLength(2));
  await first.unmount();

  // "Restart" the app.
  await render(<App />);
  expect(await screen.findByRole("checkbox", { name: "Wash the dishes" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Buy milk" })).toBeOnTheScreen();
  expect(screen.queryByText("Take out the rubbish")).not.toBeOnTheScreen();
  expect(fetchTodos).toHaveBeenCalledTimes(1);
});

it("restores an empty list rather than refetching", async () => {
  await AsyncStorage.setItem(STORAGE_KEY, "[]");
  await render(<App />);
  expect(await screen.findByText("No tasks left")).toBeOnTheScreen();
  expect(fetchTodos).not.toHaveBeenCalled();
});

it("falls back to the API when stored data is corrupted", async () => {
  await AsyncStorage.setItem(STORAGE_KEY, "{not json");
  fetchTodos.mockResolvedValue(seed);
  await render(<App />);
  expect(await screen.findByRole("checkbox", { name: "Wash the dishes" })).toBeOnTheScreen();
  expect(fetchTodos).toHaveBeenCalledTimes(1);
});

it("Reset discards local changes and reloads from the API", async () => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([{ id: 205, userId: 1, title: "Local only", completed: true }]),
  );
  fetchTodos.mockResolvedValue(seed);
  await render(<App />);
  await screen.findByRole("checkbox", { name: "Local only" });

  await fireEvent.press(screen.getByRole("button", { name: "Reset list" }));

  expect(await screen.findByRole("checkbox", { name: "Wash the dishes" })).toBeOnTheScreen();
  expect(screen.queryByText("Local only")).not.toBeOnTheScreen();
  await waitFor(async () => expect(await stored()).toEqual(seed));
});
