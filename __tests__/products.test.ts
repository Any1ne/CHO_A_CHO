import { GET } from "@/app/api/products/route";
import { redis } from "../src/db/redis/client";
import { mockQuery } from "../__tests__/__mocks__/pg";

jest.mock("pg");
jest.mock("../src/db/redis/client", () => ({
  redis: {
    ping: jest.fn(),
    lrange: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    set: jest.fn(),
    rpush: jest.fn(),
  },
}));

describe("GET /api/products", () => {
  const mockRequest = (url: string) => ({ url } as any);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("повертає продукти з PostgreSQL", async () => {
    (redis.ping as jest.Mock).mockResolvedValue("PONG");
    (redis.lrange as jest.Mock).mockResolvedValue([]);

    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          title: "Test Product",
          price: "9.99",
          category: "Tea",
          flavour: "Mint",
        },
      ],
    });

    const response = await GET(mockRequest("http://localhost/api/products"));
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Test Product");
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
