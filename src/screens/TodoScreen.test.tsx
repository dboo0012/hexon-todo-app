import { act, fireEvent, render, screen } from "@testing-library/react-native";
import App from "../../App";
import * as api from "../api/todos";
import { ApiError, type Todo } from "../api/todos";

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function renderLoaded(todos = seed) {
  fetchTodos.mockResolvedValue(todos);
  await render(<App />);
  await screen.findByText("Tasks");
}

describe("fetching", () => {
  it("shows a loading indicator, then the tasks with their completion state", async () => {
    const pending = deferred<Todo[]>();
    fetchTodos.mockReturnValue(pending.promise);
    await render(<App />);
    expect(screen.getByText("Loading tasks…")).toBeOnTheScreen();

    await act(async () => pending.resolve(seed));

    expect(screen.queryByText("Loading tasks…")).not.toBeOnTheScreen();
    expect(screen.getByRole("checkbox", { name: "Wash the dishes" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Take out the rubbish" })).toBeChecked();
    expect(screen.getByText("1 of 2 done")).toBeOnTheScreen();
  });

  it("shows an error with a working Retry button", async () => {
    fetchTodos.mockRejectedValueOnce(
      new ApiError("Could not reach the server. Check your internet connection."),
    );
    await render(<App />);

    expect(await screen.findByText("Could not load tasks")).toBeOnTheScreen();
    expect(screen.getByText(/Could not reach the server/)).toBeOnTheScreen();

    fetchTodos.mockResolvedValueOnce(seed);
    await fireEvent.press(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("checkbox", { name: "Wash the dishes" })).toBeOnTheScreen();
    expect(fetchTodos).toHaveBeenCalledTimes(2);
  });

  it("shows the empty state when the API returns nothing", async () => {
    await renderLoaded([]);
    expect(screen.getByText("No tasks left")).toBeOnTheScreen();
  });
});

describe("toggling and deleting", () => {
  it("toggles a task locally", async () => {
    await renderLoaded();
    const task = screen.getByRole("checkbox", { name: "Wash the dishes" });

    await fireEvent.press(task);
    expect(screen.getByRole("checkbox", { name: "Wash the dishes" })).toBeChecked();
    expect(screen.getByText("2 of 2 done")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("checkbox", { name: "Wash the dishes" }));
    expect(screen.getByRole("checkbox", { name: "Wash the dishes" })).not.toBeChecked();
    expect(createTodo).not.toHaveBeenCalled();
  });

  it("deletes tasks locally and shows the empty state when none remain", async () => {
    await renderLoaded();
    await fireEvent.press(screen.getByRole("button", { name: 'Delete "Wash the dishes"' }));
    expect(screen.queryByText("Wash the dishes")).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: 'Delete "Take out the rubbish"' }));
    expect(screen.getByText("No tasks left")).toBeOnTheScreen();
    expect(fetchTodos).toHaveBeenCalledTimes(1);
  });
});

describe("adding", () => {
  it("POSTs the task and shows it immediately", async () => {
    await renderLoaded();
    createTodo.mockResolvedValue({ id: 201, userId: 1, title: "Buy milk", completed: false });

    await fireEvent.changeText(screen.getByLabelText("New task title"), "  Buy milk ");
    await fireEvent.press(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByRole("checkbox", { name: "Buy milk" })).not.toBeChecked();
    expect(createTodo).toHaveBeenCalledWith("Buy milk", 1);
    expect(screen.getByLabelText("New task title")).toHaveDisplayValue("");
    expect(fetchTodos).toHaveBeenCalledTimes(1);
  });

  it("rejects whitespace-only titles", async () => {
    await renderLoaded();
    await fireEvent.changeText(screen.getByLabelText("New task title"), "   ");
    await fireEvent.press(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByText("Enter a task title.")).toBeOnTheScreen();
    expect(createTodo).not.toHaveBeenCalled();

    // Typing again clears the message.
    await fireEvent.changeText(screen.getByLabelText("New task title"), "Something");
    expect(screen.queryByText("Enter a task title.")).not.toBeOnTheScreen();
  });

  it("disables submission while saving", async () => {
    await renderLoaded();
    const pending = deferred<Todo>();
    createTodo.mockReturnValue(pending.promise);

    await fireEvent.changeText(screen.getByLabelText("New task title"), "Slow task");
    await fireEvent.press(screen.getByRole("button", { name: "Add task" }));

    const button = screen.getByRole("button", { name: "Add task" });
    expect(button).toBeDisabled();
    expect(screen.getByTestId("add-spinner")).toBeOnTheScreen();
    await fireEvent.press(button);
    expect(createTodo).toHaveBeenCalledTimes(1);

    await act(async () =>
      pending.resolve({ id: 201, userId: 1, title: "Slow task", completed: false }),
    );
    expect(screen.getByRole("button", { name: "Add task" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Slow task" })).toBeOnTheScreen();
  });

  it("shows an error and keeps the text when adding fails", async () => {
    await renderLoaded();
    createTodo.mockRejectedValue(new ApiError("The server responded with an error (500)."));

    await fireEvent.changeText(screen.getByLabelText("New task title"), "Will fail");
    await fireEvent.press(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("The server responded with an error (500).")).toBeOnTheScreen();
    expect(screen.getByLabelText("New task title")).toHaveDisplayValue("Will fail");
    expect(screen.queryByRole("checkbox", { name: "Will fail" })).not.toBeOnTheScreen();
  });
});
