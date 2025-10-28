import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import MyString from '../../lib/my-string';
import Random from '../../lib/random';

// Mock the Random module
jest.mock('../../lib/random');

describe('MyString', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateId', () => {
    it('should generate ID with timestamp and random string', () => {
      // Mock Date.now() to return a specific timestamp
      const mockTimestamp = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      // Mock Random.stringWithNumber to return a specific string
      (Random.stringWithNumber as jest.MockedFunction<typeof Random.stringWithNumber>)
        .mockReturnValue('ABC12');

      const result = MyString.generateId();

      expect(result).toBe('1234567890_ABC12');
      expect(Date.now).toHaveBeenCalledTimes(1);
      expect(Random.stringWithNumber).toHaveBeenCalledWith(5);
    });

    it('should generate unique IDs on different calls', () => {
      // Mock different timestamps
      const timestamps = [1000, 2000, 3000];
      let callCount = 0;

      jest.spyOn(Date, 'now').mockImplementation(() => {
        return timestamps[callCount++];
      });

      // Mock different random strings
      const randomStrings = ['AAA11', 'BBB22', 'CCC33'];
      let randomCallCount = 0;

      (Random.stringWithNumber as jest.MockedFunction<typeof Random.stringWithNumber>)
        .mockImplementation(() => {
          return randomStrings[randomCallCount++];
        });

      const id1 = MyString.generateId();
      const id2 = MyString.generateId();
      const id3 = MyString.generateId();

      expect(id1).toBe('1000_AAA11');
      expect(id2).toBe('2000_BBB22');
      expect(id3).toBe('3000_CCC33');
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });

    it('should call Random.stringWithNumber with length 5', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      (Random.stringWithNumber as jest.MockedFunction<typeof Random.stringWithNumber>)
        .mockReturnValue('TEST1');

      MyString.generateId();

      expect(Random.stringWithNumber).toHaveBeenCalledWith(5);
    });

    it('should format ID as timestamp_randomString', () => {
      jest.spyOn(Date, 'now').mockReturnValue(999999999);
      (Random.stringWithNumber as jest.MockedFunction<typeof Random.stringWithNumber>)
        .mockReturnValue('XYZ99');

      const result = MyString.generateId();

      expect(result).toMatch(/^\d+_[A-Z0-9]{5}$/);
      expect(result.split('_')).toHaveLength(2);
      expect(result.split('_')[0]).toBe('999999999');
      expect(result.split('_')[1]).toBe('XYZ99');
    });
  });
});
