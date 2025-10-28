import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Session } from '../../models/Session';

describe('Session', () => {
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    // Clean up before each test
    Session.clearSession(testSessionId);
  });

  afterEach(() => {
    // Clean up after each test
    Session.clearSession(testSessionId);
    Session.setSaveLogs(false);
  });

  describe('initSession', () => {
    it('should initialize session with default values', () => {
      Session.initSession(testSessionId, {});

      expect(Session.data[testSessionId]).toBeDefined();
      expect(Session.data[testSessionId].headers).toEqual({});
      expect(Session.data[testSessionId].replaces).toEqual({});
      expect(Session.data[testSessionId].session).toEqual({});
      expect(Session.data[testSessionId].logs).toEqual([]);
      expect(Session.data[testSessionId].timeout).toBe(1000 * 60 * 2);
    });

    it('should initialize session with custom values', () => {
      const params = {
        headers: { 'Authorization': 'Bearer token' },
        replaces: { '$baseUrl': 'https://api.example.com' },
        timeout: 5000
      };

      Session.initSession(testSessionId, params);

      expect(Session.data[testSessionId].headers).toEqual(params.headers);
      expect(Session.data[testSessionId].replaces).toEqual(params.replaces);
      expect(Session.data[testSessionId].timeout).toBe(5000);
    });

    it('should initialize session with partial params', () => {
      const params = {
        headers: { 'X-Custom': 'value' }
      };

      Session.initSession(testSessionId, params);

      expect(Session.data[testSessionId].headers).toEqual(params.headers);
      expect(Session.data[testSessionId].replaces).toEqual({});
      expect(Session.data[testSessionId].timeout).toBe(1000 * 60 * 2);
    });

    it('should handle null params', () => {
      Session.initSession(testSessionId, null);

      expect(Session.data[testSessionId]).toBeDefined();
      expect(Session.data[testSessionId].headers).toEqual({});
    });
  });

  describe('getHeaders', () => {
    it('should get headers from session', () => {
      const headers = { 'Authorization': 'Bearer token' };
      Session.initSession(testSessionId, { headers });

      const result = Session.getHeaders(testSessionId);
      expect(result).toEqual(headers);
    });

    it('should return empty object for session with no headers', () => {
      Session.initSession(testSessionId, {});

      const result = Session.getHeaders(testSessionId);
      expect(result).toEqual({});
    });
  });

  describe('getReplaces', () => {
    it('should get replaces from session', () => {
      const replaces = { '$baseUrl': 'https://api.example.com' };
      Session.initSession(testSessionId, { replaces });

      const result = Session.getReplaces(testSessionId);
      expect(result).toEqual(replaces);
    });

    it('should return empty object for session with no replaces', () => {
      Session.initSession(testSessionId, {});

      const result = Session.getReplaces(testSessionId);
      expect(result).toEqual({});
    });
  });

  describe('getTimeout', () => {
    it('should get timeout from session', () => {
      Session.initSession(testSessionId, { timeout: 5000 });

      const result = Session.getTimeout(testSessionId);
      expect(result).toBe(5000);
    });

    it('should return default timeout', () => {
      Session.initSession(testSessionId, {});

      const result = Session.getTimeout(testSessionId);
      expect(result).toBe(1000 * 60 * 2);
    });
  });

  describe('setSession and getSession', () => {
    beforeEach(() => {
      Session.initSession(testSessionId, {});
    });

    it('should set and get session value', () => {
      Session.setSession(testSessionId, 'token', 'abc123');

      const result = Session.getSession(testSessionId, 'token');
      expect(result).toBe('abc123');
    });

    it('should set and get multiple session values', () => {
      Session.setSession(testSessionId, 'token', 'abc123');
      Session.setSession(testSessionId, 'userId', '42');
      Session.setSession(testSessionId, 'role', 'admin');

      expect(Session.getSession(testSessionId, 'token')).toBe('abc123');
      expect(Session.getSession(testSessionId, 'userId')).toBe('42');
      expect(Session.getSession(testSessionId, 'role')).toBe('admin');
    });

    it('should overwrite existing session value', () => {
      Session.setSession(testSessionId, 'token', 'old-token');
      Session.setSession(testSessionId, 'token', 'new-token');

      const result = Session.getSession(testSessionId, 'token');
      expect(result).toBe('new-token');
    });

    it('should handle object values', () => {
      const userData = { id: 1, name: 'John' };
      Session.setSession(testSessionId, 'user', userData);

      const result = Session.getSession(testSessionId, 'user');
      expect(result).toEqual(userData);
    });

    it('should handle array values', () => {
      const permissions = ['read', 'write', 'delete'];
      Session.setSession(testSessionId, 'permissions', permissions);

      const result = Session.getSession(testSessionId, 'permissions');
      expect(result).toEqual(permissions);
    });
  });

  describe('getSessions', () => {
    beforeEach(() => {
      Session.initSession(testSessionId, {});
    });

    it('should get all session values', () => {
      Session.setSession(testSessionId, 'token', 'abc123');
      Session.setSession(testSessionId, 'userId', '42');

      const result = Session.getSessions(testSessionId);
      expect(result).toEqual({
        token: 'abc123',
        userId: '42'
      });
    });

    it('should return empty object for new session', () => {
      const result = Session.getSessions(testSessionId);
      expect(result).toEqual({});
    });
  });

  describe('insertLog and getLogs', () => {
    beforeEach(() => {
      Session.initSession(testSessionId, {});
    });

    it('should insert and get logs', () => {
      const log1 = { url: '/api/users', method: 'GET' };
      const log2 = { url: '/api/posts', method: 'POST' };

      Session.insertLog(testSessionId, log1);
      Session.insertLog(testSessionId, log2);

      const logs = Session.getLogs(testSessionId);
      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual(log1);
      expect(logs[1]).toEqual(log2);
    });

    it('should return empty array for session with no logs', () => {
      const logs = Session.getLogs(testSessionId);
      expect(logs).toEqual([]);
    });

    it('should maintain log order', () => {
      for (let i = 0; i < 5; i++) {
        Session.insertLog(testSessionId, { index: i });
      }

      const logs = Session.getLogs(testSessionId);
      expect(logs).toHaveLength(5);
      logs.forEach((log, index) => {
        expect(log.index).toBe(index);
      });
    });
  });

  describe('setSaveLogs', () => {
    it('should set save logs flag to true', () => {
      Session.setSaveLogs(true);
      expect(Session.isSaveLogs).toBe(true);
    });

    it('should set save logs flag to false', () => {
      Session.setSaveLogs(false);
      expect(Session.isSaveLogs).toBe(false);
    });

    it('should default to false', () => {
      expect(Session.isSaveLogs).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('should clear session data', () => {
      Session.initSession(testSessionId, {
        headers: { 'Authorization': 'Bearer token' }
      });

      Session.setSession(testSessionId, 'token', 'abc123');
      Session.insertLog(testSessionId, { url: '/api/test' });

      expect(Session.data[testSessionId]).toBeDefined();

      Session.clearSession(testSessionId);

      expect(Session.data[testSessionId]).toBeUndefined();
    });

    it('should not affect other sessions', () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';

      Session.initSession(sessionId1, {});
      Session.initSession(sessionId2, {});

      Session.setSession(sessionId1, 'value', 'session1');
      Session.setSession(sessionId2, 'value', 'session2');

      Session.clearSession(sessionId1);

      expect(Session.data[sessionId1]).toBeUndefined();
      expect(Session.data[sessionId2]).toBeDefined();
      expect(Session.getSession(sessionId2, 'value')).toBe('session2');

      // Cleanup
      Session.clearSession(sessionId2);
    });

    it('should handle clearing non-existent session', () => {
      expect(() => {
        Session.clearSession('non-existent-session');
      }).not.toThrow();
    });
  });

  describe('multiple sessions', () => {
    const sessionId1 = 'session-1';
    const sessionId2 = 'session-2';

    afterEach(() => {
      Session.clearSession(sessionId1);
      Session.clearSession(sessionId2);
    });

    it('should handle multiple independent sessions', () => {
      Session.initSession(sessionId1, { timeout: 1000 });
      Session.initSession(sessionId2, { timeout: 2000 });

      Session.setSession(sessionId1, 'token', 'token1');
      Session.setSession(sessionId2, 'token', 'token2');

      expect(Session.getSession(sessionId1, 'token')).toBe('token1');
      expect(Session.getSession(sessionId2, 'token')).toBe('token2');
      expect(Session.getTimeout(sessionId1)).toBe(1000);
      expect(Session.getTimeout(sessionId2)).toBe(2000);
    });

    it('should maintain separate logs for each session', () => {
      Session.initSession(sessionId1, {});
      Session.initSession(sessionId2, {});

      Session.insertLog(sessionId1, { session: 1 });
      Session.insertLog(sessionId2, { session: 2 });

      const logs1 = Session.getLogs(sessionId1);
      const logs2 = Session.getLogs(sessionId2);

      expect(logs1).toHaveLength(1);
      expect(logs2).toHaveLength(1);
      expect(logs1[0]).toEqual({ session: 1 });
      expect(logs2[0]).toEqual({ session: 2 });
    });
  });
});
