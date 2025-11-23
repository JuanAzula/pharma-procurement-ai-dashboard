import { translateText, batchTranslate } from '../translationService';
import translate from 'google-translate-api-x';
import { redisClient } from '../../config/redis';

// Mock dependencies
jest.mock('google-translate-api-x');
jest.mock('../../config/redis', () => ({
  redisClient: {
    isOpen: true,
    get: jest.fn(),
    setEx: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('translationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('translateText', () => {
    it('should return original text if target language matches source', async () => {
      const result = await translateText('Hello', 'en', 'en');
      expect(result).toBe('Hello');
      expect(redisClient.get).not.toHaveBeenCalled();
      expect(translate).not.toHaveBeenCalled();
    });

    it('should return cached translation if available', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue('Hola');
      
      const result = await translateText('Hello', 'es', 'en');
      
      expect(result).toBe('Hola');
      expect(redisClient.get).toHaveBeenCalled();
      expect(translate).not.toHaveBeenCalled();
    });

    it('should call API and cache result if not in cache', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (translate as jest.Mock).mockResolvedValue({ text: 'Hola' });
      
      const result = await translateText('Hello', 'es', 'en');
      
      expect(result).toBe('Hola');
      expect(translate).toHaveBeenCalledWith('Hello', expect.objectContaining({ from: 'en', to: 'es' }));
      expect(redisClient.setEx).toHaveBeenCalledWith(expect.stringContaining('translation:es:'), 86400, 'Hola');
    });

    it('should retry on 429 Too Many Requests', async () => {
      jest.useFakeTimers();
      jest.spyOn(Math, 'random').mockReturnValue(0);
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      
      const error429 = new Error('Too Many Requests');
      (error429 as any).statusCode = 429;
      
      (translate as jest.Mock)
        .mockRejectedValueOnce(error429)
        .mockResolvedValueOnce({ text: 'Hola' });
      
      const promise = translateText('Hello', 'es', 'en');
      
      // Advance time to trigger retry
      await Promise.resolve(); // Wait for rejection to schedule setTimeout
      await Promise.resolve();
      jest.advanceTimersByTime(5000);
      
      const result = await promise;
      
      expect(result).toBe('Hola');
      expect(translate).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('should return original text after max retries', async () => {
      jest.useFakeTimers();
      jest.spyOn(Math, 'random').mockReturnValue(0);
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      
      const error429 = new Error('Too Many Requests');
      (error429 as any).statusCode = 429;
      
      (translate as jest.Mock).mockRejectedValue(error429);
      
      const promise = translateText('Hello', 'es', 'en');
      
      // Advance time for multiple retries
      // Retry 1: 1000ms
      // Retry 2: 2000ms
      // Retry 3: 4000ms
      
      for (let i = 0; i < 3; i++) {
        // We need to wait for the async operation (rejection) to reach the setTimeout
        // Since we can't easily hook into that, we assume it's fast.
        // But we need to yield to the event loop.
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        
        jest.advanceTimersByTime(5000);
      }
      
      const result = await promise;
      
      expect(result).toBe('Hello');
      expect(translate).toHaveBeenCalledTimes(3);
      jest.useRealTimers();
      jest.spyOn(Math, 'random').mockRestore();
    }, 15000); // Increase test timeout to 15s
  });

  describe('batchTranslate', () => {
    it('should return empty array for empty input', async () => {
      const result = await batchTranslate([], 'es');
      expect(result).toEqual([]);
    });

    it('should batch translate texts', async () => {
        // Mock translateText to simulate the internal call
        // Note: Since we are testing the logic inside batchTranslate which calls translateText, 
        // and translateText is in the same module, mocking it directly with jest.mock might be tricky 
        // if we were importing it from the module itself. 
        // However, batchTranslate calls translateText directly. 
        // For this test, we'll mock the external dependencies that translateText uses.
        
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        (translate as jest.Mock).mockImplementation(async (text, options) => {
            if (text.includes('|||')) {
                // Simulate batch translation
                const parts = text.split(' ||| ');
                const translated = parts.map((p: string) => `Translated ${p}`);
                return { text: translated.join(' ||| ') };
            }
            return { text: `Translated ${text}` };
        });

        const texts = ['One', 'Two', 'Three'];
        const result = await batchTranslate(texts, 'es');

        expect(result).toEqual(['Translated One', 'Translated Two', 'Translated Three']);
        expect(translate).toHaveBeenCalled();
    });
  });
});
