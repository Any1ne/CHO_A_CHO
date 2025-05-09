// import { POST } from "@/app/api/orders/route";
// import { NextRequest } from "next/server";

// // Створюємо моки вручну
// const mockQuery = jest.fn();
// const mockRelease = jest.fn();
// const mockConnect = jest.fn(() =>
//   Promise.resolve({ query: mockQuery, release: mockRelease })
// );
// const mockPool = jest.fn(() => ({ connect: mockConnect }));

// // Мокуємо pg.Pool
// jest.mock("pg", () => ({
//   Pool: mockPool,
// }));

// describe("POST /api/orders", () => {
//   const mockCustomerId = 1;
//   const mockOrderId = 100;

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("створює замовлення успішно", async () => {
//     mockQuery
//       .mockResolvedValueOnce({ rows: [{ id: mockCustomerId }] }) // INSERT INTO Customers
//       .mockResolvedValueOnce({ rows: [{ id: mockOrderId }] }) // INSERT INTO Orders
//       .mockResolvedValueOnce({}) // INSERT INTO Order_Delivery_Details
//       .mockResolvedValueOnce({}) // INSERT INTO OrderItems
//       .mockResolvedValueOnce({}); // COMMIT

//     const req = {
//       json: async () => ({
//         fullName: "John Doe",
//         phone: "123456789",
//         email: "john@example.com",
//         items: [{ id: "1", quantity: 2, price: 100 }],
//         paymentMethod: "Cash",
//         deliveryMethod: "Nova Poshta",
//         deliveryService: "Nova",
//         deliveryType: "Branch",
//         branchNumber: "12",
//         fullAddress: "", // ignored
//       }),
//     } as unknown as NextRequest;

//     const res = await POST(req);
//     const data = await res.json();

//     expect(data.success).toBe(true);
//     expect(data.orderId).toBe(mockOrderId);
//     expect(mockQuery).toHaveBeenCalledTimes(5);
//   });

//   it("повертає помилку при збої БД", async () => {
//     mockQuery.mockImplementationOnce(() => {
//       throw new Error("DB insert failed");
//     });

//     const req = {
//       json: async () => ({
//         fullName: "John Doe",
//         phone: "123456789",
//         email: "john@example.com",
//         items: [{ id: "1", quantity: 2, price: 100 }],
//         paymentMethod: "Cash",
//         deliveryMethod: "Nova Poshta",
//         deliveryService: "Nova",
//         deliveryType: "Branch",
//         branchNumber: "12",
//         fullAddress: "",
//       }),
//     } as unknown as NextRequest;

//     const res = await POST(req);
//     const data = await res.json();

//     expect(res.status).toBe(500);
//     expect(data.success).toBe(false);
//     expect(data.error).toContain("DB insert failed");
//   });
// });
