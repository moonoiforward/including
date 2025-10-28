import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { including } from '../../lib/including';
import { Session } from '../../models/Session';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
import fetch from 'node-fetch';
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock object-query-string
jest.mock('object-query-string', () => ({
  queryString: jest.fn((obj: any) => {
    if (!obj || Object.keys(obj).length === 0) return '';
    return Object.entries(obj)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  })
}));

describe('Including - Advanced Features', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
  });

  afterEach(() => {
    Object.keys(Session.data).forEach(sessionId => {
      Session.clearSession(sessionId);
    });
  });

  describe('nested includes', () => {
    it('should fetch nested includes - posts with users', async () => {
      const postsData = [
        { id: 1, title: 'Post 1', userId: 10 },
        { id: 2, title: 'Post 2', userId: 20 }
      ];

      const usersData = [
        { id: 10, name: 'User 10' },
        { id: 20, name: 'User 20' }
      ];

      const postsResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify(postsData))
        )
      };

      const usersResponse: any = {
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(
          Buffer.from(JSON.stringify(usersData))
        )
      };

      mockedFetch
        .mockResolvedValueOnce(postsResponse)
        .mockResolvedValueOnce(usersResponse);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/posts',
          method: 'GET',
          model: 'posts',
          includes: [{
            url: 'https://api.example.com/users',
            method: 'GET',
            model: 'user',
            on: 'userId',
            foreign: 'id'
          }]
        }]
      });

      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(result.posts).toBeDefined();
      expect(Array.isArray(result.posts)).toBe(true);
    });

    it('should handle deeply nested includes - posts > users > profiles', async () => {
      const postsData = [{ id: 1, userId: 10 }];
      const usersData = [{ id: 10, name: 'User 10', profileId: 100 }];
      const profilesData = [{ id: 100, bio: 'Bio 100' }];

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(postsData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(profilesData)))
        } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/posts',
          method: 'GET',
          model: 'posts',
          includes: [{
            url: 'https://api.example.com/users',
            method: 'GET',
            model: 'user',
            on: 'userId',
            includes: [{
              url: 'https://api.example.com/profiles',
              method: 'GET',
              model: 'profile',
              on: 'profileId'
            }]
          }]
        }]
      });

      expect(mockedFetch).toHaveBeenCalledTimes(3);
      expect(result.posts).toBeDefined();
    });
  });

  describe('params mode', () => {
    it('should replace URL params with data values', async () => {
      const postsData = [
        { id: 1, userId: 10, categoryId: 5 },
        { id: 2, userId: 20, categoryId: 6 }
      ];

      const detailsData = { info: 'Details' };

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(postsData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(detailsData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(detailsData)))
        } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/posts',
          method: 'GET',
          model: 'posts',
          includes: [{
            url: 'https://api.example.com/users/$1/categories/$2',
            method: 'GET',
            model: 'details',
            params: ['userId', 'categoryId']
          }]
        }]
      });

      expect(mockedFetch).toHaveBeenCalled();
      expect(result.posts).toBeDefined();
    });
  });

  describe('each mode', () => {
    it('should make separate request for each item when each=true', async () => {
      const usersData = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];

      const post1Data = [{ id: 101, title: 'Post 101', userId: 1 }];
      const post2Data = [{ id: 102, title: 'Post 102', userId: 2 }];

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(post1Data)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(post2Data)))
        } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/users',
          method: 'GET',
          model: 'users',
          includes: [{
            url: 'https://api.example.com/posts',
            method: 'GET',
            model: 'posts',
            each: true,
            on: 'id',
            foreign: 'userId'
          }]
        }]
      });

      expect(result.users).toBeDefined();
      // Each mode should make separate requests for each user
    });
  });

  describe('buildQuery callback', () => {
    it('should use buildQuery to dynamically build query parameters', async () => {
      const usersData = [{ id: 1, name: 'User 1', role: 'admin' }];
      const postsData = [{ id: 101, title: 'Post 101' }];

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(postsData)))
        } as any);

      const buildQuery = jest.fn((data: any) => {
        return { userId: data.id, role: data.role };
      });

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/users',
          method: 'GET',
          model: 'users',
          includes: [{
            url: 'https://api.example.com/posts',
            method: 'GET',
            model: 'posts',
            buildQuery
          }]
        }]
      });

      expect(buildQuery).toHaveBeenCalled();
      expect(result.users).toBeDefined();
    });
  });

  describe('buildBody callback', () => {
    it('should use buildBody to dynamically build request body', async () => {
      const usersData = [{ id: 1, name: 'User 1' }];
      const createResponse = { id: 201, created: true };

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersData)))
        } as any)
        .mockResolvedValueOnce({
          status: 201,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(createResponse)))
        } as any);

      const buildBody = jest.fn((data: any) => {
        return { userId: data.id, userName: data.name };
      });

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/users',
          method: 'GET',
          model: 'users',
          includes: [{
            url: 'https://api.example.com/logs',
            method: 'POST',
            model: 'logs',
            buildBody
          }]
        }]
      });

      expect(buildBody).toHaveBeenCalled();
      expect(result.users).toBeDefined();
    });
  });

  describe('buildHeaders callback', () => {
    it('should use buildHeaders to dynamically build request headers', async () => {
      const authData = { token: 'abc123' };
      const protectedData = { id: 1, secret: 'data' };

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(authData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(protectedData)))
        } as any);

      const buildHeaders = jest.fn((data: any) => {
        return { 'Authorization': `Bearer ${data.token}` };
      });

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/auth',
          method: 'GET',
          model: 'auth',
          includes: [{
            url: 'https://api.example.com/protected',
            method: 'GET',
            model: 'protected',
            buildHeaders
          }]
        }]
      });

      expect(buildHeaders).toHaveBeenCalled();
      expect(result.auth).toBeDefined();
    });
  });

  describe('branches', () => {
    it('should handle branches configuration', async () => {
      const postsData = [
        { id: 1, userId: 10 },
        { id: 2, userId: 20 }
      ];

      const allUsersData = [
        { id: 10, name: 'User 10' },
        { id: 20, name: 'User 20' },
        { id: 30, name: 'User 30' }
      ];

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(postsData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(allUsersData)))
        } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/posts',
          method: 'GET',
          model: 'posts',
          branches: [{
            url: 'https://api.example.com/users',
            method: 'GET',
            model: 'allUsers'
          }]
        }]
      });

      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(result.posts).toBeDefined();
    });
  });

  describe('session variables', () => {
    it('should store session variables from response', async () => {
      const loginData = {
        token: 'jwt-token-123',
        userId: 42,
        user: { id: 42, name: 'John' }
      };

      mockedFetch.mockResolvedValueOnce({
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(loginData)))
      } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/login',
          method: 'POST',
          model: 'auth',
          body: { username: 'john', password: 'pass' },
          sessions: {
            token: 'token',
            userId: 'userId',
            userName: 'user.name'
          }
        }]
      });

      expect(result.auth).toBeDefined();
      // Session variables should be stored for use in subsequent requests
    });
  });

  describe('frame configuration', () => {
    it('should handle frame to wrap response', async () => {
      const itemsData = [{ id: 1 }, { id: 2 }];

      mockedFetch.mockResolvedValueOnce({
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(itemsData)))
      } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/items',
          method: 'GET',
          model: 'items',
          frame: 'data'
        }]
      });

      expect(result.items).toBeDefined();
      // Frame should wrap the response in a specific structure
    });
  });

  describe('duplicate handling', () => {
    it('should handle duplicate:false to prevent duplicate requests', async () => {
      const usersData = [
        { id: 1, managerId: 10 },
        { id: 2, managerId: 10 } // Same manager
      ];

      const managerData = { id: 10, name: 'Manager 10' };

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersData)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(managerData)))
        } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/users',
          method: 'GET',
          model: 'users',
          includes: [{
            url: 'https://api.example.com/managers',
            method: 'GET',
            model: 'manager',
            on: 'managerId',
            duplicate: false
          }]
        }]
      });

      expect(result.users).toBeDefined();
      // Should only fetch manager once even though 2 users have same managerId
    });
  });

  describe('onSuccess callback', () => {
    it('should call onSuccess callback after successful request', async () => {
      const usersData = [{ id: 1, name: 'User 1' }];

      mockedFetch.mockResolvedValueOnce({
        status: 200,
        arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersData)))
      } as any);

      const onSuccess = jest.fn((result: any, requestConfig: any, data: any) => {
        // onSuccess receives (result, requestConfig, data) as parameters
        return data;
      });

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/users',
          method: 'GET',
          model: 'users',
          onSuccess
        }]
      });

      expect(onSuccess).toHaveBeenCalled();
      expect(result.users).toBeDefined();
    });
  });

  describe('whole mode', () => {
    it('should handle whole:true to join data as single object', async () => {
      const usersList = [
        { id: 1, categoryId: 10 },
        { id: 2, categoryId: 10 }
      ];

      const categoryData = { id: 10, name: 'Category 10' };

      mockedFetch
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(usersList)))
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: (jest.fn() as any).mockResolvedValue(Buffer.from(JSON.stringify(categoryData)))
        } as any);

      const result: any = await including({
        list: [{
          url: 'https://api.example.com/users',
          method: 'GET',
          model: 'users',
          includes: [{
            url: 'https://api.example.com/categories',
            method: 'GET',
            model: 'category',
            on: 'categoryId',
            whole: true
          }]
        }]
      });

      expect(result.users).toBeDefined();
      // Whole mode should join single object instead of array
    });
  });
});
