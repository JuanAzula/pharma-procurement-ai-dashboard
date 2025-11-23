import translate from "google-translate-api-x";
import { redisClient } from "../config/redis";
import { createHash } from "crypto";

/**
 * Translates text from one language to another using google-translate-api-x.
 * Implements caching via Redis and exponential backoff for rate limits.
 * 
 * @param text - The text to translate
 * @param targetLanguage - The target language code (e.g., 'en', 'es', 'nl')
 * @param sourceLanguage - The source language code (auto-detect if not provided)
 * @param options - Additional options for the translation service
 * @returns The translated text
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "auto",
  options: any = {}
): Promise<string> {
  if (!text || !targetLanguage) {
    return text;
  }

  // Don't translate if target is the same as source
  if (sourceLanguage !== "auto" && sourceLanguage === targetLanguage) {
    return text;
  }

  // Generate cache key
  const hash = createHash('md5').update(text).digest('hex');
  const cacheKey = `translation:${targetLanguage}:${hash}`;

  try {
    // Check cache
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        // console.log(`Cache hit for "${text.substring(0, 20)}..."`);
        return cached;
      }
    }
  } catch (err) {
    console.error("Redis cache error:", err);
  }

  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      // Default to forceBatch: false to avoid 429s on the batch endpoint
      const finalOptions = { forceBatch: false, ...options };
      const result = await translate(text, { from: sourceLanguage, to: targetLanguage, ...finalOptions });
      
      // Cache result
      try {
        if (redisClient.isOpen) {
          // Cache for 24 hours (86400 seconds)
          await redisClient.setEx(cacheKey, 86400, result.text);
        }
      } catch (err) {
        console.error("Failed to cache translation:", err);
      }

      return result.text;
    } catch (error: any) {
      console.error(`Translation error (attempt ${attempt + 1}):`, error.message);
      
      // Check for 429 status in various places or error message
      const isRateLimit = 
        error?.response?.status === 429 || 
        error?.statusCode === 429 || 
        (error?.message && error.message.includes('Too Many Requests'));

      if (isRateLimit) {
        attempt++;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff + jitter
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If not 429 or max retries reached, return original text
      return text;
    }
  }
  return text;
}

/**
 * Batch translate multiple texts.
 * Uses delimiter-based batching to reduce the number of HTTP requests.
 * 
 * @param texts - Array of texts to translate
 * @param targetLanguage - The target language code
 * @param sourceLanguage - The source language code
 * @returns Array of translated texts
 */
export async function batchTranslate(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<string[]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  const results: string[] = [];
  // Batch by joining texts to reduce HTTP requests
  // Google Translate usually handles up to ~5000 chars. 
  // We'll be conservative with batch size.
  const BATCH_SIZE = 10; 
  const DELIMITER = " ||| ";
  const DELAY_MS = 2000;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    
    // Join chunk into a single string
    const combinedText = chunk.join(DELIMITER);
    
    try {
      // Translate the combined string
      // forceBatch: false is still safer for reliability, but now we make fewer requests
      const translatedCombined = await translateText(
        combinedText, 
        targetLanguage, 
        sourceLanguage, 
        { forceBatch: false }
      );
      
      // Split back into array
      // We use a regex to be flexible with spaces around the delimiter that might be altered by translation
      const splitRegex = /\s*\|\|\|\s*/;
      let translatedChunk = translatedCombined.split(splitRegex);

      // Safety check: if split length doesn't match, we might have lost a delimiter
      if (translatedChunk.length !== chunk.length) {
        console.warn(`Batch translation mismatch: expected ${chunk.length} items, got ${translatedChunk.length}. Fallback to individual translation for this chunk.`);
        
        // Fallback: translate individually if batching failed to preserve structure
        translatedChunk = await Promise.all(
          chunk.map(text => translateText(text, targetLanguage, sourceLanguage, { forceBatch: false }))
        );
      }

      results.push(...translatedChunk);
    } catch (error) {
      console.error("Batch translation error:", error);
      // On error, return original texts for this chunk to avoid breaking the whole flow
      results.push(...chunk);
    }
    
    // Add delay between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}
