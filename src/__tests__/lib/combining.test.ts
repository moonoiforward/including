import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { combining } from '../../lib/combining';
import { Session } from '../../models/Session';
import MyString from '../../lib/my-string';

// Mock the onSuccess function since it's complex and tested separately
jest.mock('../../lib/including', () => ({
  onSuccess: jest.fn((params: any) => Promise.resolve(params.data))
}));

import { onSuccess } from '../../lib/including';
const mockedOnSuccess = onSuccess as jest.MockedFunction<typeof onSuccess>;

describe('combining', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should combine data with includes configuration', async () => {
    const inputData = [
      { id: 1, userId: 10 },
      { id: 2, userId: 20 }
    ];

    const param = {
      includes: [
        {
          url: 'https://api.example.com/users/:userId',
          model: 'User',
          method: 'GET',
          at: 'user',
          on: 'userId'
        }
      ]
    };

    const result = await combining(inputData, param);

    // Should call onSuccess with correct parameters
    expect(mockedOnSuccess).toHaveBeenCalledTimes(1);
    const callArgs = mockedOnSuccess.mock.calls[0][0];
    expect(callArgs.data).toEqual(inputData);
    expect(callArgs.dimension).toBe(1);
    expect(callArgs.sessionId).toBeDefined();
    expect(callArgs.inc).toBeDefined();
    expect(callArgs.inc.includes).toHaveLength(1);
    expect(callArgs.inc.includes![0].url).toBe('https://api.example.com/users/:userId');
    expect(callArgs.inc.includes![0].model).toBe('User');
    expect(callArgs.inc.includes![0].method).toBe('GET');
    expect(callArgs.inc.includes![0].at).toBe('user');
  });

  it('should initialize session with headers', async () => {
    const data = { id: 1 };
    const headers = { 'Authorization': 'Bearer token123' };

    const param = {
      headers: headers,
      includes: []
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    const sessionId = callArgs.sessionId;

    const sessionHeaders = Session.getHeaders(sessionId);
    expect(sessionHeaders).toEqual(headers);
  });

  it('should initialize session with replaces', async () => {
    const data = { id: 1 };
    const replaces = { baseUrl: 'https://api.example.com' };

    const param = {
      replaces: replaces,
      includes: []
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    const sessionId = callArgs.sessionId;

    const sessionReplaces = Session.getReplaces(sessionId);
    expect(sessionReplaces).toEqual(replaces);
  });

  it('should initialize session with timeout', async () => {
    const data = { id: 1 };
    const timeout = 5000;

    const param = {
      timeout: timeout,
      includes: []
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    const sessionId = callArgs.sessionId;

    const sessionTimeout = Session.getTimeout(sessionId);
    expect(sessionTimeout).toBe(timeout);
  });

  it('should initialize session with all parameters', async () => {
    const data = { id: 1 };
    const headers = { 'X-API-Key': 'secret' };
    const replaces = { version: 'v2' };
    const timeout = 10000;

    const param = {
      headers: headers,
      replaces: replaces,
      timeout: timeout,
      includes: [
        {
          url: 'https://api.example.com/users',
          model: 'User',
          method: 'GET',
          at: 'users'
        }
      ]
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    const sessionId = callArgs.sessionId;

    expect(Session.getHeaders(sessionId)).toEqual(headers);
    expect(Session.getReplaces(sessionId)).toEqual(replaces);
    expect(Session.getTimeout(sessionId)).toBe(timeout);
  });

  it('should generate unique session ID', async () => {
    const data = { id: 1 };
    const param = { includes: [] };

    await combining(data, param);
    const sessionId1 = mockedOnSuccess.mock.calls[0][0].sessionId;

    mockedOnSuccess.mockClear();

    await combining(data, param);
    const sessionId2 = mockedOnSuccess.mock.calls[0][0].sessionId;

    expect(sessionId1).not.toBe(sessionId2);
  });

  it('should handle empty includes array', async () => {
    const data = { id: 1, name: 'Test' };
    const param = { includes: [] };

    const result = await combining(data, param);

    expect(mockedOnSuccess).toHaveBeenCalled();
    expect(result).toEqual(data);
  });

  it('should handle object data', async () => {
    const data = { id: 1, name: 'John', email: 'john@example.com' };
    const param = {
      includes: [
        {
          url: 'https://api.example.com/profile/:id',
          model: 'Profile',
          method: 'GET',
          at: 'profile'
        }
      ]
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    expect(callArgs.data).toEqual(data);
  });

  it('should handle array data', async () => {
    const data = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];
    const param = {
      includes: [
        {
          url: 'https://api.example.com/details/:id',
          model: 'Detail',
          method: 'GET',
          at: 'details'
        }
      ]
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    expect(callArgs.data).toEqual(data);
  });

  it('should pass dimension as 1', async () => {
    const data = { id: 1 };
    const param = { includes: [] };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    expect(callArgs.dimension).toBe(1);
  });

  it('should handle nested includes configuration', async () => {
    const data = { id: 1 };
    const param = {
      includes: [
        {
          url: 'https://api.example.com/posts',
          model: 'Post',
          method: 'GET',
          at: 'posts',
          includes: [
            {
              url: 'https://api.example.com/comments',
              model: 'Comment',
              method: 'GET',
              at: 'comments'
            }
          ]
        }
      ]
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    expect(callArgs.inc.includes).toHaveLength(1);
    expect(callArgs.inc.includes![0].url).toBe('https://api.example.com/posts');
    expect(callArgs.inc.includes![0].includes).toHaveLength(1);
    expect(callArgs.inc.includes![0].includes![0].url).toBe('https://api.example.com/comments');
  });

  it('should handle undefined optional parameters', async () => {
    const data = { id: 1 };
    const param = {
      includes: []
    };

    await combining(data, param);

    const callArgs = mockedOnSuccess.mock.calls[0][0];
    const sessionId = callArgs.sessionId;

    expect(Session.getHeaders(sessionId)).toEqual({});
    expect(Session.getReplaces(sessionId)).toEqual({});
    expect(Session.getTimeout(sessionId)).toBe(120000); // default timeout is 120000
  });
});
