import { describe, it, expect } from '@jest/globals';
import MyObject from '../../lib/my-object';

describe('MyObject', () => {
  describe('filterDuplicate', () => {
    it('should remove duplicate values from array', () => {
      const input = [1, 2, 2, 3, 3, 3, 4];
      const result = MyObject.filterDuplicate(input);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle array of strings', () => {
      const input = ['a', 'b', 'a', 'c', 'b'];
      const result = MyObject.filterDuplicate(input);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      const result = MyObject.filterDuplicate([]);
      expect(result).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      const input = [1, 2, 3, 4];
      const result = MyObject.filterDuplicate(input);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle array with all same values', () => {
      const input = [5, 5, 5, 5];
      const result = MyObject.filterDuplicate(input);
      expect(result).toEqual([5]);
    });
  });

  describe('get', () => {
    const testData = {
      user: {
        name: 'John',
        address: {
          city: 'Bangkok',
          country: 'Thailand'
        },
        posts: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' }
        ]
      },
      count: 10
    };

    it('should get value from nested object using dot notation', () => {
      const result = MyObject.get('user.name', testData);
      expect(result).toBe('John');
    });

    it('should get deeply nested value', () => {
      const result = MyObject.get('user.address.city', testData);
      expect(result).toBe('Bangkok');
    });

    it('should get top-level value', () => {
      const result = MyObject.get('count', testData);
      expect(result).toBe(10);
    });

    it('should return null for non-existent key', () => {
      const result = MyObject.get('user.email', testData);
      expect(result).toBeNull();
    });

    it('should return null for deeply non-existent path', () => {
      const result = MyObject.get('user.address.zipcode', testData);
      expect(result).toBeNull();
    });

    it('should get array value', () => {
      const result = MyObject.get('user.posts', testData);
      expect(result).toEqual([
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' }
      ]);
    });

    it('should handle empty string key', () => {
      const result = MyObject.get('', testData);
      expect(result).toEqual(testData);
    });

    it('should handle key with empty segments', () => {
      const result = MyObject.get('user..name', testData);
      expect(result).toBe('John');
    });
  });

  describe('flatten', () => {
    it('should flatten simple nested object', () => {
      const input = {
        user: {
          name: 'John',
          age: 30
        }
      };
      const result = MyObject.flatten(input);
      expect(result['user.name']).toBe('John');
      expect(result['user.age']).toBe(30);
    });

    it('should flatten array items to indexed keys', () => {
      const input = {
        users: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' }
        ]
      };
      const result = MyObject.flatten(input);

      // Arrays are flattened to indexed keys
      expect(result['users.0.id']).toBe(1);
      expect(result['users.0.name']).toBe('User 1');
      expect(result['users.1.id']).toBe(2);
      expect(result['users.1.name']).toBe('User 2');
    });

    it('should handle deeply nested arrays', () => {
      const input = {
        data: {
          posts: [
            { id: 1, title: 'Post 1' },
            { id: 2, title: 'Post 2' }
          ]
        }
      };
      const result = MyObject.flatten(input);

      // Deeply nested arrays are also flattened to indexed keys
      expect(result['data.posts.0.id']).toBe(1);
      expect(result['data.posts.0.title']).toBe('Post 1');
      expect(result['data.posts.1.id']).toBe(2);
      expect(result['data.posts.1.title']).toBe('Post 2');
    });

    it('should handle empty object', () => {
      const result = MyObject.flatten({});
      expect(result).toEqual({});
    });

    it('should handle object with null values', () => {
      const input = {
        user: {
          name: 'John',
          email: null
        }
      };
      const result = MyObject.flatten(input);
      expect(result['user.name']).toBe('John');
      expect(result['user.email']).toBeNull();
    });

    it('should handle mixed nested structure', () => {
      const input = {
        user: {
          name: 'John',
          posts: [
            { id: 1, title: 'Post 1' },
            { id: 2, title: 'Post 2' }
          ],
          address: {
            city: 'Bangkok'
          }
        }
      };
      const result = MyObject.flatten(input);

      expect(result['user.name']).toBe('John');
      expect(result['user.address.city']).toBe('Bangkok');
      // Arrays in mixed structure are also flattened
      expect(result['user.posts.0.id']).toBe(1);
      expect(result['user.posts.1.id']).toBe(2);
    });

    it('should convert array of primitives at deepest level to array notation', () => {
      const input = {
        colors: ['red', 'blue', 'green']
      };
      const result = MyObject.flatten(input);

      // Deepest level arrays should be kept as arrays
      expect(result['colors']).toEqual(['red', 'blue', 'green']);
      expect(result['colors.0']).toBeUndefined();
      expect(result['colors.1']).toBeUndefined();
      expect(result['colors.2']).toBeUndefined();
    });

    it('should convert nested array of primitives at deepest level', () => {
      const input = {
        user: {
          tags: ['javascript', 'typescript', 'nodejs']
        }
      };
      const result = MyObject.flatten(input);

      // Deepest level arrays should be kept as arrays
      expect(result['user.tags']).toEqual(['javascript', 'typescript', 'nodejs']);
      expect(result['user.tags.0']).toBeUndefined();
    });

    it('should handle multiple deepest-level arrays', () => {
      const input = {
        data: {
          items: {
            ids: [1, 2, 3],
            names: ['A', 'B', 'C']
          }
        }
      };
      const result = MyObject.flatten(input);

      expect(result['data.items.ids']).toEqual([1, 2, 3]);
      expect(result['data.items.names']).toEqual(['A', 'B', 'C']);
    });
  });

  describe('unflatten', () => {
    it('should unflatten simple flat object', () => {
      const input = {
        'user.name': 'John',
        'user.age': 30
      };
      const result = MyObject.unflatten(input);

      expect(result).toEqual({
        user: {
          name: 'John',
          age: 30
        }
      });
    });

    it('should unflatten deeply nested structure', () => {
      const input = {
        'user.address.city': 'Bangkok',
        'user.address.country': 'Thailand',
        'user.name': 'John'
      };
      const result = MyObject.unflatten(input);

      expect(result).toEqual({
        user: {
          name: 'John',
          address: {
            city: 'Bangkok',
            country: 'Thailand'
          }
        }
      });
    });

    it('should handle array notation', () => {
      const input = {
        'users.0.name': 'User 1',
        'users.1.name': 'User 2'
      };
      const result = MyObject.unflatten(input);

      expect(result).toEqual({
        users: [
          { name: 'User 1' },
          { name: 'User 2' }
        ]
      });
    });

    it('should handle empty object', () => {
      const result = MyObject.unflatten({});
      expect(result).toEqual({});
    });
  });

  describe('flatten and unflatten round-trip', () => {
    it('should preserve data through flatten and unflatten', () => {
      const original = {
        user: {
          name: 'John',
          age: 30,
          address: {
            city: 'Bangkok',
            country: 'Thailand'
          }
        },
        count: 10
      };

      const flattened = MyObject.flatten(original);
      const unflattened = MyObject.unflatten(flattened) as any;

      expect(unflattened.user.name).toBe('John');
      expect(unflattened.user.age).toBe(30);
      expect(unflattened.user.address.city).toBe('Bangkok');
      expect(unflattened.count).toBe(10);
    });

    it('should handle arrays in round-trip', () => {
      const original = {
        posts: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' }
        ]
      };

      const flattened = MyObject.flatten(original);
      const unflattened = MyObject.unflatten(flattened) as any;

      expect(Array.isArray(unflattened.posts)).toBe(true);
      expect(unflattened.posts).toHaveLength(2);
      expect(unflattened.posts[0].id).toBe(1);
      expect(unflattened.posts[1].id).toBe(2);
    });
  });
});
