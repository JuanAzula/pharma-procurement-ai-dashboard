import { searchNotices } from '../noticeService';
import axios from 'axios';
import { TED_API_BASE_URL, TED_SEARCH_ENDPOINT } from '../../config/ted';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('noticeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchNotices', () => {
    it('should call TED API and transform results', async () => {
      const mockResponse = {
        data: {
          notices: [
            {
              "notice-identifier": "123456-2023",
              "title-lot": ["Test Notice"],
              "description-lot": ["Test Description"],
              "publication-date": "2023-01-01",
              "buyer-country": ["DE"],
              "classification-cpv": [33600000],
              "result-value-lot": 100000
            }
          ],
          total: 1,
          page: 1
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await searchNotices({ filters: {} });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${TED_API_BASE_URL}${TED_SEARCH_ENDPOINT}`,
        expect.any(Object),
        expect.any(Object)
      );

      expect(result.notices).toHaveLength(1);
      expect(result.notices[0].id).toBe("123456-2023");
      expect(result.notices[0].title).toBe("Test Notice");
      expect(result.notices[0].country).toBe("DE");
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));
      mockedAxios.isAxiosError.mockReturnValue(false); // Simple error for now

      await expect(searchNotices({ filters: {} })).rejects.toThrow('API Error');
    });

    it('should apply client-side filters correctly', async () => {
        const mockResponse = {
            data: {
              notices: [
                {
                  "notice-identifier": "1",
                  "result-value-lot": 100
                },
                {
                  "notice-identifier": "2",
                  "result-value-lot": 500
                }
              ]
            }
          };
    
          mockedAxios.post.mockResolvedValue(mockResponse);
    
          const result = await searchNotices({ 
              filters: { 
                  valueRange: { min: 200 } 
              } 
          });
    
          expect(result.notices).toHaveLength(1);
          expect(result.notices[0].id).toBe("2");
    });
  });
});
