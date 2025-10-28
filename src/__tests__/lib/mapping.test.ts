import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  replaceUrl,
  mapParams,
  createQuery,
  mapIdentities,
  mapKeynameForIncludes,
  createIdentities,
  mapDataFromList
} from '../../lib/mapping';
import { Include } from '../../models/Include';
import { Session } from '../../models/Session';
import { Identity } from '../../models/Identity';

describe('Mapping utilities', () => {
  describe('replaceUrl', () => {
    it('should replace single variable in URL', () => {
      const url = '$baseUrl/users';
      const replaces = { '$baseUrl': 'https://api.example.com' };
      const result = replaceUrl(url, replaces);
      expect(result).toBe('https://api.example.com/users');
    });

    it('should replace multiple variables in URL', () => {
      const url = '$baseUrl/$version/users';
      const replaces = {
        '$baseUrl': 'https://api.example.com',
        '$version': 'v2'
      };
      const result = replaceUrl(url, replaces);
      expect(result).toBe('https://api.example.com/v2/users');
    });

    it('should handle URL with no replacements', () => {
      const url = 'https://api.example.com/users';
      const replaces = {};
      const result = replaceUrl(url, replaces);
      expect(result).toBe('https://api.example.com/users');
    });

    it('should handle empty replaces object', () => {
      const url = '$baseUrl/users';
      const replaces = {};
      const result = replaceUrl(url, replaces);
      expect(result).toBe('$baseUrl/users');
    });
  });

  describe('mapParams', () => {
    it('should replace params in URL path', () => {
      const url = '/users/$1/posts/$2';
      const identity = {
        params: ['123', '456']
      };
      const result = mapParams(url, identity);
      expect(result).toBe('/users/123/posts/456');
    });

    it('should replace single param', () => {
      const url = '/users/$1';
      const identity = {
        params: ['123']
      };
      const result = mapParams(url, identity);
      expect(result).toBe('/users/123');
    });

    it('should handle URL with no params', () => {
      const url = '/users/list';
      const identity = {
        params: []
      };
      const result = mapParams(url, identity);
      expect(result).toBe('/users/list');
    });

    it('should handle more params than placeholders', () => {
      const url = '/users/$1';
      const identity = {
        params: ['123', '456', '789']
      };
      const result = mapParams(url, identity);
      expect(result).toBe('/users/123');
    });
  });

  describe('createQuery', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = 'test-session-' + Date.now();
      Session.initSession(sessionId, {});
      Session.setSession(sessionId, 'token', 'abc123');
      Session.setSession(sessionId, 'userId', '42');
    });

    afterEach(() => {
      Session.clearSession(sessionId);
    });

    it('should replace session variables in query', () => {
      const query = {
        authorization: '$token',
        id: '$userId'
      };
      const result = createQuery({ query, sessionId });

      expect(result.authorization).toBe('abc123');
      expect(result.id).toBe('42');
    });

    it('should keep non-session values unchanged', () => {
      const query = {
        limit: 10,
        search: 'test'
      };
      const result = createQuery({ query, sessionId });

      expect(result.limit).toBe(10);
      expect(result.search).toBe('test');
    });

    it('should handle empty query', () => {
      const result = createQuery({ query: null, sessionId });
      expect(result).toEqual({});
    });

    it('should handle mixed values', () => {
      const query = {
        token: '$token',
        limit: 10,
        filter: 'active'
      };
      const result = createQuery({ query, sessionId });

      expect(result.token).toBe('abc123');
      expect(result.limit).toBe(10);
      expect(result.filter).toBe('active');
    });
  });

  describe('mapIdentities', () => {
    it('should extract values from identities', () => {
      const identities: Identity[] = [
        { key: '0.userId', value: 1, params: [] },
        { key: '1.userId', value: 2, params: [] },
        { key: '2.userId', value: 3, params: [] }
      ];

      const result = mapIdentities(identities);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should flatten array values', () => {
      const identities: Identity[] = [
        { key: '0.userId', value: [1, 2], params: [] },
        { key: '1.userId', value: [3, 4], params: [] }
      ];

      const result = mapIdentities(identities);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should skip null/undefined values', () => {
      const identities: Identity[] = [
        { key: '0.userId', value: 1, params: [] },
        { key: '1.userId', value: null, params: [] },
        { key: '2.userId', value: 3, params: [] }
      ];

      const result = mapIdentities(identities);
      expect(result).toEqual([1, 3]);
    });

    it('should handle empty identities array', () => {
      const result = mapIdentities([]);
      expect(result).toEqual([]);
    });

    it('should handle mixed types', () => {
      const identities: Identity[] = [
        { key: '0.id', value: 1, params: [] },
        { key: '1.id', value: [2, 3], params: [] },
        { key: '2.id', value: 4, params: [] }
      ];

      const result = mapIdentities(identities);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe('mapKeynameForIncludes', () => {
    it('should create keyname for simple include', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user'
      });

      const identity: Identity = {
        key: '0.userId',
        value: 1,
        params: []
      };

      const flatData = {};
      const identities: Identity[] = [];

      const result = mapKeynameForIncludes({
        inc,
        identity,
        flatData,
        identities
      });

      expect(result).toEqual(['0.user']);
    });

    it('should create keyname for nested include', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user'
      });

      const identity: Identity = {
        key: 'posts.0.userId',
        value: 1,
        params: []
      };

      const flatData = {};
      const identities: Identity[] = [];

      const result = mapKeynameForIncludes({
        inc,
        identity,
        flatData,
        identities
      });

      expect(result).toEqual(['posts.0.user']);
    });

    it('should handle params mode', () => {
      const inc = new Include({
        url: '/users/$1',
        method: 'GET',
        model: 'user',
        params: ['userId']
      });

      const identity: Identity = {
        key: '0.userId',
        value: 1,
        params: ['1']
      };

      const flatData = {};
      const identities: Identity[] = [];

      const result = mapKeynameForIncludes({
        inc,
        identity,
        flatData,
        identities
      });

      expect(result).toEqual(['0.userId']);
    });
  });

  describe('createIdentities', () => {
    it('should create identities from "on" field', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user',
        on: 'userId'
      });

      const flatData = {
        '0.userId': 1,
        '1.userId': 2,
        '2.userId': 3,
        '0.title': 'Post 1'
      };

      const keys = Object.keys(flatData);
      const result = createIdentities({ inc, keys, flatData });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ key: '0.userId', value: 1, params: [] });
      expect(result[1]).toEqual({ key: '1.userId', value: 2, params: [] });
      expect(result[2]).toEqual({ key: '2.userId', value: 3, params: [] });
    });

    it('should create identities from nested "on" field', () => {
      const inc = new Include({
        url: '/addresses',
        method: 'GET',
        model: 'address',
        on: 'user.addressId'
      });

      const flatData = {
        '0.user.addressId': 10,
        '1.user.addressId': 20
      };

      const keys = Object.keys(flatData);
      const result = createIdentities({ inc, keys, flatData });

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(20);
    });

    it('should create identities from params', () => {
      const inc = new Include({
        url: '/users/$1/posts/$2',
        method: 'GET',
        model: 'posts',
        params: ['userId', 'categoryId']
      });

      const flatData = {
        '0.userId': 1,
        '0.categoryId': 10,
        '1.userId': 2,
        '1.categoryId': 20
      };

      const keys = Object.keys(flatData);
      const result = createIdentities({ inc, keys, flatData });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].params).toBeDefined();
      expect(result[0].params.length).toBeGreaterThan(0);
    });

    it('should handle empty keys', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user',
        on: 'userId'
      });

      const result = createIdentities({ inc, keys: [], flatData: {} });
      expect(result).toEqual([]);
    });
  });

  describe('mapDataFromList', () => {
    it('should map single value data', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user',
        local: 'id'
      });

      const identities: Identity[] = [
        { key: '0.userId', value: 1, params: [] }
      ];

      const keyNames = ['user'];
      const flatData: any = {};

      const data = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];

      const result = mapDataFromList({
        inc,
        keyNames,
        identities,
        flatData,
        data
      });

      expect(result.user).toEqual({ id: 1, name: 'User 1' });
    });

    it('should map array value data', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'users',
        local: 'id'
      });

      const identities: Identity[] = [
        { key: '0', value: [1, 2], params: [] }
      ];

      const keyNames = ['users'];
      const flatData: any = {};

      const data = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        { id: 3, name: 'User 3' }
      ];

      const result = mapDataFromList({
        inc,
        keyNames,
        identities,
        flatData,
        data
      });

      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({ id: 1, name: 'User 1' });
      expect(result.users[1]).toEqual({ id: 2, name: 'User 2' });
    });

    it('should handle null values', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user',
        local: 'id'
      });

      const identities: Identity[] = [
        { key: '0.userId', value: null, params: [] }
      ];

      const keyNames = ['user'];
      const flatData: any = {};
      const data: any[] = [];

      const result = mapDataFromList({
        inc,
        keyNames,
        identities,
        flatData,
        data
      });

      expect(result.user).toBeNull();
    });

    it('should handle not found data', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user',
        local: 'id'
      });

      const identities: Identity[] = [
        { key: '0.userId', value: 999, params: [] }
      ];

      const keyNames = ['user'];
      const flatData: any = {};

      const data = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];

      const result = mapDataFromList({
        inc,
        keyNames,
        identities,
        flatData,
        data
      });

      expect(result.user).toBeNull();
    });

    it('should map multiple identities', () => {
      const inc = new Include({
        url: '/users',
        method: 'GET',
        model: 'user',
        local: 'id'
      });

      const identities: Identity[] = [
        { key: '0.userId', value: 1, params: [] },
        { key: '1.userId', value: 2, params: [] }
      ];

      const keyNames = ['posts.0.user', 'posts.1.user'];
      const flatData: any = {};

      const data = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];

      const result = mapDataFromList({
        inc,
        keyNames,
        identities,
        flatData,
        data
      });

      expect(result['posts.0.user']).toEqual({ id: 1, name: 'User 1' });
      expect(result['posts.1.user']).toEqual({ id: 2, name: 'User 2' });
    });
  });
});
