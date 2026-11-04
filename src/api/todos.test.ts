import { API_BASE_URL, ApiError, createTodo, fetchTodos } from "./todos";

const fetchMock = jest.fn();

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => fetchMock.mockReset());

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe("fetchTodos", () => {
  it("requests the first 10 todos and shows them as household chores", async () => {
    const todos = [
      { id: 1, userId: 1, title: "delectus aut autem", completed: false },
      { id: 4, userId: 1, title: "et porro tempora", completed: true },
    ];
    fetchMock.mockResolvedValue(jsonResponse(200, todos));

    await expect(fetchTodos()).resolves.toEqual([
      { id: 1, userId: 1, title: "Wash the dishes", completed: false },
      { id: 4, userId: 1, title: "Water the plants", completed: true },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/todos?_limit=10`,
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it("keeps the API's title for ids without a chore", async () => {
    const todos = [{ id: 11, userId: 1, title: "vero rerum temporibus dolor", completed: true }];
    fetchMock.mockResolvedValue(jsonResponse(200, todos));
    await expect(fetchTodos(11)).resolves.toEqual(todos);
  });

  it("throws an ApiError with the status for non-2xx responses", async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, {}));
    const error = await fetchTodos().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(503);
    expect((error as ApiError).message).toMatch(/503/);
  });

  it("throws a friendly ApiError when the network fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    await expect(fetchTodos()).rejects.toThrow("Could not reach the server.");
  });

  it("reports a timeout separately", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
    await expect(fetchTodos()).rejects.toThrow("took too long");
  });

  it("rejects a JSON body that is not a list", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { error: "nope" }));
    await expect(fetchTodos()).rejects.toThrow("unexpected response");
  });

  it("rejects a body that is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);
    await expect(fetchTodos()).rejects.toThrow("unexpected response");
  });
});

describe("createTodo", () => {
  it("POSTs the title with completed=false and userId=1", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { id: 201, userId: 1, title: "Buy milk", completed: false }),
    );

    await expect(createTodo("Buy milk")).resolves.toEqual({
      id: 201,
      userId: 1,
      title: "Buy milk",
      completed: false,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/todos`);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json; charset=UTF-8" });
    expect(JSON.parse(init.body)).toEqual({ title: "Buy milk", completed: false, userId: 1 });
  });

  it("throws when the POST fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}));
    await expect(createTodo("x")).rejects.toBeInstanceOf(ApiError);
  });
});
