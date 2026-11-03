import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearStoredTodos, loadStoredTodos, saveTodos, STORAGE_KEY } from "./todoStorage";

const todos = [{ id: 1, userId: 1, title: "a", completed: true }];

it("returns null when nothing is stored", async () => {
  await expect(loadStoredTodos()).resolves.toBeNull();
});

it("round-trips a list, including an empty one", async () => {
  await saveTodos(todos);
  await expect(loadStoredTodos()).resolves.toEqual(todos);
  await saveTodos([]);
  await expect(loadStoredTodos()).resolves.toEqual([]);
});

it.each([
  ["not json", "{oops"],
  ["not an array", JSON.stringify({ id: 1 })],
  ["wrong shape", JSON.stringify([{ id: "1", title: 2 }])],
])("ignores corrupted data (%s)", async (_label, raw) => {
  await AsyncStorage.setItem(STORAGE_KEY, raw);
  await expect(loadStoredTodos()).resolves.toBeNull();
});

it("clears the stored list", async () => {
  await saveTodos(todos);
  await clearStoredTodos();
  await expect(loadStoredTodos()).resolves.toBeNull();
});
