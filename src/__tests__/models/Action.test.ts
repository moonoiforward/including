import { describe, it, expect } from '@jest/globals';
import { Action } from '../../models/Action';

describe('Action', () => {
  describe('constructor', () => {
    it('should create Action with all properties', () => {
      const data = {
        url: 'https://api.example.com/users',
        model: 'User',
        query: { limit: 10 },
        at: 'users',
        method: 'GET',
        body: { name: 'John' },
        sessions: { token: 'abc123' },
        headers: { 'Authorization': 'Bearer token' }
      };

      const action = new Action(data);

      expect(action.url).toBe('https://api.example.com/users');
      expect(action.model).toBe('User');
      expect(action.query).toEqual({ limit: 10 });
      expect(action.at).toBe('users');
      expect(action.method).toBe('GET');
      expect(action.body).toEqual({ name: 'John' });
      expect(action.sessions).toEqual({ token: 'abc123' });
      expect(action.headers).toEqual({ 'Authorization': 'Bearer token' });
      expect(action.then).toEqual([]);
    });

    it('should create Action with minimal properties', () => {
      const data = {
        url: 'https://api.example.com/posts'
      };

      const action = new Action(data);

      expect(action.url).toBe('https://api.example.com/posts');
      expect(action.model).toBeUndefined();
      expect(action.query).toBeUndefined();
      expect(action.at).toBeUndefined();
      expect(action.method).toBeUndefined();
      expect(action.body).toBeUndefined();
      expect(action.sessions).toBeUndefined();
      expect(action.headers).toBeUndefined();
      expect(action.then).toEqual([]);
    });

    it('should handle nested then actions', () => {
      const data = {
        url: 'https://api.example.com/users',
        method: 'GET',
        then: [
          {
            url: 'https://api.example.com/posts',
            method: 'GET'
          },
          {
            url: 'https://api.example.com/comments',
            method: 'GET'
          }
        ]
      };

      const action = new Action(data);

      expect(action.url).toBe('https://api.example.com/users');
      expect(action.then).toHaveLength(2);
      expect(action.then[0]).toBeInstanceOf(Action);
      expect(action.then[0].url).toBe('https://api.example.com/posts');
      expect(action.then[1]).toBeInstanceOf(Action);
      expect(action.then[1].url).toBe('https://api.example.com/comments');
    });

    it('should handle deeply nested then actions', () => {
      const data = {
        url: 'https://api.example.com/level1',
        then: [
          {
            url: 'https://api.example.com/level2',
            then: [
              {
                url: 'https://api.example.com/level3'
              }
            ]
          }
        ]
      };

      const action = new Action(data);

      expect(action.url).toBe('https://api.example.com/level1');
      expect(action.then[0].url).toBe('https://api.example.com/level2');
      expect(action.then[0].then[0].url).toBe('https://api.example.com/level3');
    });

    it('should handle empty then array', () => {
      const data = {
        url: 'https://api.example.com/users',
        then: []
      };

      const action = new Action(data);

      expect(action.then).toEqual([]);
    });
  });

  describe('fromJSON', () => {
    it('should create Action from JSON data', () => {
      const data = {
        url: 'https://api.example.com/users',
        model: 'User',
        method: 'POST',
        body: { name: 'Jane' }
      };

      const action = Action.fromJSON(data);

      expect(action).toBeInstanceOf(Action);
      expect(action.url).toBe('https://api.example.com/users');
      expect(action.model).toBe('User');
      expect(action.method).toBe('POST');
      expect(action.body).toEqual({ name: 'Jane' });
    });

    it('should create Action with nested then using fromJSON', () => {
      const data = {
        url: 'https://api.example.com/users',
        then: [
          {
            url: 'https://api.example.com/posts'
          }
        ]
      };

      const action = Action.fromJSON(data);

      expect(action.then[0]).toBeInstanceOf(Action);
      expect(action.then[0].url).toBe('https://api.example.com/posts');
    });

    it('should handle null values in properties', () => {
      const data = {
        url: 'https://api.example.com/users',
        model: null,
        query: null,
        at: null,
        method: null,
        body: null,
        sessions: null,
        headers: null
      };

      const action = Action.fromJSON(data);

      expect(action.url).toBe('https://api.example.com/users');
      expect(action.model).toBeNull();
      expect(action.query).toBeNull();
      expect(action.at).toBeNull();
      expect(action.method).toBeNull();
      expect(action.body).toBeNull();
      expect(action.sessions).toBeNull();
      expect(action.headers).toBeNull();
      expect(action.then).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    it('should handle action chain with different HTTP methods', () => {
      const data = {
        url: 'https://api.example.com/login',
        method: 'POST',
        body: { username: 'user', password: 'pass' },
        then: [
          {
            url: 'https://api.example.com/profile',
            method: 'GET'
          },
          {
            url: 'https://api.example.com/settings',
            method: 'PATCH',
            body: { theme: 'dark' }
          }
        ]
      };

      const action = new Action(data);

      expect(action.method).toBe('POST');
      expect(action.then[0].method).toBe('GET');
      expect(action.then[1].method).toBe('PATCH');
      expect(action.then[1].body).toEqual({ theme: 'dark' });
    });

    it('should preserve all properties through action chain', () => {
      const data = {
        url: 'https://api.example.com/users/:id',
        model: 'User',
        query: { include: 'posts' },
        at: 'user',
        method: 'GET',
        sessions: { userId: ':session.userId' },
        headers: { 'X-Custom': 'value' },
        then: [
          {
            url: 'https://api.example.com/posts',
            at: 'posts',
            query: { userId: ':user.id' }
          }
        ]
      };

      const action = new Action(data);

      expect(action.at).toBe('user');
      expect(action.sessions).toEqual({ userId: ':session.userId' });
      expect(action.then[0].at).toBe('posts');
      expect(action.then[0].query).toEqual({ userId: ':user.id' });
    });
  });
});
