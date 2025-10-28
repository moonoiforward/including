import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { HttpClient } from '../../lib/http-client';
import { Session } from '../../models/Session';

// Mock node-fetch with a factory function
jest.mock('node-fetch', () => jest.fn());

// Mock object-query-string
jest.mock('object-query-string', () => ({
  queryString: jest.fn((obj: any) => {
    if (!obj || Object.keys(obj).length === 0) return '';
    return Object.entries(obj)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  })
}));

// Import the mocked fetch after mocking
import fetch from 'node-fetch';
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('HttpClient', () => {
  const sessionId = 'test-http-session';

  beforeEach(() => {
    mockedFetch.mockClear();
    Session.initSession(sessionId, {});
  });

  afterEach(() => {
    Session.clearSession(sessionId);
  });

  describe('constructor', () => {
    it('should create instance without sessionId', () => {
      const client = new HttpClient();
      expect(client.sessionId).toBeUndefined();
    });

    it('should create instance with sessionId', () => {
      const client = new HttpClient({ sessionId });
      expect(client.sessionId).toBe(sessionId);
    });
  });

  describe('request', () => {
    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify(mockData))
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      const result = await client.request('https://api.example.com/test', {
        method: 'GET'
      });

      expect(result).toEqual(mockData);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        { method: 'GET' }
      );
    });

    it('should make POST request with body', async () => {
      const requestBody = { name: 'New Item' };
      const mockResponse: any = {
        status: 201,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify({ id: 1, ...requestBody }))
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      const result = await client.request('https://api.example.com/items', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      expect(result).toEqual({ id: 1, ...requestBody });
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );
    });

    it('should append query string to URL', async () => {
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from('[]'))
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      await client.request('https://api.example.com/items', {
        method: 'GET',
        query: { page: 1, limit: 10 }
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.example.com/items?page=1&limit=10',
        { method: 'GET' }
      );
    });

    it('should handle empty query object', async () => {
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from('[]'))
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      await client.request('https://api.example.com/items', {
        method: 'GET',
        query: {}
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.example.com/items',
        { method: 'GET' }
      );
    });

    it('should handle status 200', async () => {
      const mockData = { success: true };
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify(mockData))
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      const result = await client.request('https://api.example.com/test', {
        method: 'GET'
      });

      expect(result).toEqual(mockData);
    });

    it('should handle status 201', async () => {
      const mockData = { id: 1, created: true };
      const mockResponse: any = {
        status: 201,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify(mockData))
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      const result = await client.request('https://api.example.com/test', {
        method: 'POST'
      });

      expect(result).toEqual(mockData);
    });

    it('should reject on status > 201', async () => {
      const mockError = { error: 'Not Found' };
      const mockResponse: any = {
        status: 404,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify(mockError))
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();

      await expect(
        client.request('https://api.example.com/test', { method: 'GET' })
      ).rejects.toEqual({
        status: 404,
        error: JSON.stringify(mockError)
      });
    });

    it('should reject on status 500', async () => {
      const mockResponse: any = {
        status: 500,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from('Internal Server Error')
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();

      await expect(
        client.request('https://api.example.com/test', { method: 'GET' })
      ).rejects.toEqual({
        status: 500,
        error: 'Internal Server Error'
      });
    });

    it('should handle non-JSON response', async () => {
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from('Plain text response')
        )
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      const result = await client.request('https://api.example.com/test', {
        method: 'GET'
      });

      expect(result).toBe('Plain text response');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');
      (networkError as any).code = 'ECONNREFUSED';
      (networkError as any).stack = 'Error stack trace';

      mockedFetch.mockRejectedValueOnce(networkError);

      const client = new HttpClient();

      await expect(
        client.request('https://api.example.com/test', { method: 'GET' })
      ).rejects.toEqual({
        status: 'ECONNREFUSED',
        message: 'Network failure',
        stack: 'Error stack trace'
      });
    });

    it('should log request when sessionId is provided', async () => {
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from('{}'))
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient({ sessionId });
      await client.request('https://api.example.com/test', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token' }
      });

      const logs = Session.getLogs(sessionId);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual({
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: { 'Authorization': 'Bearer token' }
      });
    });

    it('should not log request when sessionId is not provided', async () => {
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from('{}'))
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      await client.request('https://api.example.com/test', {
        method: 'GET'
      });

      // Should not throw error when trying to log without sessionId
      expect(mockedFetch).toHaveBeenCalled();
    });

    it('should handle headers correctly', async () => {
      const mockResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from('{}'))
      };

      mockedFetch.mockResolvedValueOnce(mockResponse);

      const client = new HttpClient();
      await client.request('https://api.example.com/test', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token',
          'Content-Type': 'application/json'
        }
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json'
          }
        }
      );
    });
  });
});
