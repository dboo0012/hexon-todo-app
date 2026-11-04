import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as api from "../api/todos";
import { ApiError, type Todo } from "../api/todos";
import { nextLocalId, useTodos } from "./useTodos";

jest.mock("../api/todos", () => ({
  ...jest.requireActual("../api/todos"),
  fetchTodos: jest.fn(),
  createTodo: jest.fn(),
}));

const fetchTodos = api.fetchTodos as jest.MockedFunction<typeof api.fetchTodos>;
const createTodo = api.createTodo as jest.MockedFunction<typeof api.createTodo>;

const seed: Todo[] = [
  { id: 1, userId: 1, title: "Wash the dishes", completed: false },
  { id: 2, userId: 1, title: "Take out the rubbish", completed: true },
];

// Reset only the API mocks: resetAllMocks would also wipe the AsyncStorage mock.
afterEach(() => {
  fetchTodos.mockReset();
  createTodo.mockReset();
});

async function setup() {
  const hook = await renderHook(() => useTodos());
  await waitFor(() => expect(hook.result.current.status).not.toBe("loading"));
  return hook;
}

describe("loading", () => {
  it("starts loading, then shows the fetched todos", async () => {
    let resolve!: (todos: Todo[]) => void;
    fetchTodos.mockReturnValue(new Promise((r) => (resolve = r)));
    const hook = await renderHook(() => useTodos());
    expect(hook.result.current.status).toBe("loading");

    await act(async () => resolve(seed));
    expect(hook.result.current.status).toBe("ready");
    expect(hook.result.current.todos).toEqual(seed);
    expect(fetchTodos).toHaveBeenCalledWith(10);
  });

  it("exposes the error and recovers on retry", async () => {
    fetchTodos.mockRejectedValueOnce(new ApiError("Could not reach the server."));
    const { result } = await setup();
    expect(result.current.status).toBe("error");
    expect(result.current.loadError).toBe("Could not reach the server.");

    fetchTodos.mockResolvedValueOnce(seed);
    await act(() => result.current.retry());
    expect(result.current.status).toBe("ready");
    expect(result.current.loadError).toBeNull();
    expect(result.current.todos).toHaveLength(2);
  });
});

describe("adding", () => {
  it("POSTs the trimmed title and prepends the new task", async () => {
    fetchTodos.mockResolvedValue(seed);
    createTodo.mockResolvedValue({ id: 201, userId: 1, title: "Buy milk", completed: false });
    const { result } = await setup();

    let added = false;
    await act(async () => {
      added = await result.current.addTodo("  Buy milk  ");
    });

    expect(added).toBe(true);
    expect(createTodo).toHaveBeenCalledWith("Buy milk", 1);
    expect(result.current.todos[0]).toEqual({
      id: 201,
      userId: 1,
      title: "Buy milk",
      completed: false,
    });
    expect(result.current.saving).toBe(false);
  });

  it("gives every added task a unique id even though the API always returns 201", async () => {
    fetchTodos.mockResolvedValue(seed);
    createTodo.mockResolvedValue({ id: 201, userId: 1, title: "x", completed: false });
    const { result } = await setup();

    await act(() => result.current.addTodo("first"));
    await act(() => result.current.addTodo("second"));

    const ids = result.current.todos.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(["", "   ", "\n\t"])(
    "rejects a blank title %j without calling the API",
    async (title) => {
      fetchTodos.mockResolvedValue(seed);
      const { result } = await setup();

      await act(() => result.current.addTodo(title));
      expect(createTodo).not.toHaveBeenCalled();
      expect(result.current.addError).toBe("Enter a task title.");
      expect(result.current.todos).toEqual(seed);
    },
  );

  it("is saving while the request is in flight and ignores a second submit", async () => {
    fetchTodos.mockResolvedValue(seed);
    let resolve!: (t: Todo) => void;
    createTodo.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = await setup();

    let first!: Promise<boolean>;
    await act(async () => {
      first = result.current.addTodo("Slow task");
    });
    expect(result.current.saving).toBe(true);

    let second = true;
    await act(async () => {
      second = await result.current.addTodo("Double tap");
    });
    expect(second).toBe(false);
    expect(createTodo).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve({ id: 201, userId: 1, title: "Slow task", completed: false });
      await first;
    });
    expect(result.current.saving).toBe(false);
    expect(result.current.todos[0].title).toBe("Slow task");
  });

  it("shows an error and keeps the list unchanged when the POST fails", async () => {
    fetchTodos.mockResolvedValue(seed);
    createTodo.mockRejectedValue(new ApiError("The server responded with an error (500)."));
    const { result } = await setup();

    let added = true;
    await act(async () => {
      added = await result.current.addTodo("Will fail");
    });

    expect(added).toBe(false);
    expect(result.current.addError).toBe("The server responded with an error (500).");
    expect(result.current.todos).toEqual(seed);
    expect(result.current.saving).toBe(false);

    await act(async () => result.current.clearAddError());
    expect(result.current.addError).toBeNull();
  });
});

describe("local changes", () => {
  it("toggles completion locally", async () => {
    fetchTodos.mockResolvedValue(seed);
    const { result } = await setup();

    await act(async () => result.current.toggleTodo(1));
    expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(true);
    await act(async () => result.current.toggleTodo(1));
    expect(result.current.todos.find((t) => t.id === 1)?.completed).toBe(false);
  });

  it("deletes locally and reaches an empty list", async () => {
    fetchTodos.mockResolvedValue(seed);
    const { result } = await setup();

    await act(async () => result.current.deleteTodo(1));
    await act(async () => result.current.deleteTodo(2));
    expect(result.current.todos).toEqual([]);
    expect(result.current.status).toBe("ready");
    expect(fetchTodos).toHaveBeenCalledTimes(1);
  });
});

test("nextLocalId stays above the API's ids", () => {
  expect(nextLocalId([])).toBe(201);
  expect(nextLocalId(seed)).toBe(201);
  expect(nextLocalId([...seed, { id: 205, userId: 1, title: "", completed: false }])).toBe(206);
});
