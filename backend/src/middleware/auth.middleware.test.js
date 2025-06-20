const { protect } = require('./auth.middleware');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('../models/user.model');

describe('Auth Middleware (protect)', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jwt.verify.mockClear();
    User.findByPk.mockClear();
    process.env.JWT_SECRET = 'your_default_secret_key';
  });

  test('should call next() when valid token is in Authorization header', async () => {
    const token = 'valid.token.header';
    const decodedPayload = { id: 1 };
    const mockUser = { id: 1, user_name: 'test_user', user_role: 'admin' };

    mockRequest.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue(decodedPayload);
    User.findByPk.mockResolvedValue(mockUser);

    await protect(mockRequest, mockResponse, nextFunction);

    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(User.findByPk).toHaveBeenCalledWith(decodedPayload.id, expect.any(Object));
    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  test('should call next() when valid token is in query parameter', async () => {
    const token = 'valid.token.query';
    const decodedPayload = { id: 2 };
    const mockUser = { id: 2, user_name: 'query_user', user_role: 'operator' };

    mockRequest.query.token = token;
    jwt.verify.mockReturnValue(decodedPayload);
    User.findByPk.mockResolvedValue(mockUser);

    await protect(mockRequest, mockResponse, nextFunction);

    expect(User.findByPk).toHaveBeenCalledWith(decodedPayload.id, expect.any(Object));
    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  test('should return 401 if no token is provided', async () => {
    await protect(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should return 401 if token verification fails', async () => {
    mockRequest.headers.authorization = `Bearer invalid.token`;
    jwt.verify.mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    await protect(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should return 401 if user is not found in DB', async () => {
    const token = 'valid.token.for.nonexistent.user';
    const decodedPayload = { id: 99 };
    
    mockRequest.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue(decodedPayload);
    User.findByPk.mockResolvedValue(null);

    await protect(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, user not found' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should return 401 if database lookup fails', async () => {
    const token = 'valid.token.db.error';
    const decodedPayload = { id: 1 };
    
    mockRequest.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue(decodedPayload);
    User.findByPk.mockRejectedValue(new Error('Database error'));

    await protect(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
}); 