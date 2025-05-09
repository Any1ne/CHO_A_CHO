const mockQuery = jest.fn();
const mockRelease = jest.fn();

const mockClient = {
  query: mockQuery,
  release: mockRelease,
};

const mockPool = {
  connect: jest.fn(() => Promise.resolve(mockClient)),
};

export { mockQuery, mockRelease, mockClient };
export const Pool = jest.fn(() => mockPool);
