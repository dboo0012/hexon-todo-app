import { withChoreTitle } from "./chores";

export const API_BASE_URL = "https://jsonplaceholder.typicode.com";

export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

/** fetch with a timeout and a friendly error for network failures and non-2xx responses. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    const timedOut = (err as Error)?.name === "AbortError";
    throw new ApiError(
      timedOut
        ? "The server took too long to respond."
        : "Could not reach the server. Check your internet connection.",
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ApiError(`The server responded with an error (${response.status}).`, response.status);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("The server sent an unexpected response.", response.status);
  }
}

/** GET /todos?_limit=N (the brief asks for the first 10), with chore titles (see chores.ts). */
export async function fetchTodos(limit = 10): Promise<Todo[]> {
  const todos = await request<unknown>(`/todos?_limit=${limit}`);
  if (!Array.isArray(todos)) {
    throw new ApiError("The server sent an unexpected response.");
  }
  return (todos as Todo[]).map(withChoreTitle);
}

/** POST /todos with `{ title, completed: false, userId }`. */
export function createTodo(title: string, userId = 1): Promise<Todo> {
  return request<Todo>("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ title, completed: false, userId }),
  });
}
