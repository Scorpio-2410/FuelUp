// Homepage motivational quote component
// Fetches quotes from backend API with 30-minute auto-refresh
// Supports pull-to-refresh and cache clearing

import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  apiGetQuoteOfTheDay, 
  readQuoteCache, 
  writeQuoteCache 
} from '../../constants/api';

interface QuoteData {
  id: number;
  quoteText: string;
  category: string;
  author: {
    name: string;
    birthYear?: number;
    deathYear?: number;
  } | null;
}

interface HomepageMotivationalQuotesProps {
  className?: string;
  onRefresh?: () => void;
}

const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds

const HomepageMotivationalQuotes = forwardRef<any, HomepageMotivationalQuotesProps>(({ className, onRefresh }, ref) => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);

  // Format author display with years
  const formatAuthor = (author: QuoteData['author']) => {
    if (!author || !author.name) return null;
    
    // Format years
    let yearsStr = '';
    if (author.birthYear || author.deathYear) {
      const birth = author.birthYear 
        ? (author.birthYear < 0 ? `${Math.abs(author.birthYear)} BC` : author.birthYear)
        : '';
      const death = author.deathYear 
        ? (author.deathYear < 0 ? `${Math.abs(author.deathYear)} BC` : author.deathYear)
        : '';
      
      if (birth && death) {
        yearsStr = ` (${birth} - ${death})`;
      } else if (birth) {
        yearsStr = ` (${birth} - )`;
      }
    }
    
    return `${author.name}${yearsStr}`;
  };

  // Check if cached quote needs refresh (older than 30 minutes)
  const shouldRefreshQuote = (timestamp: number): boolean => {
    const now = Date.now();
    return (now - timestamp) > THIRTY_MINUTES;
  };

  // Fetch fresh quote from API
  const fetchQuote = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await readQuoteCache();
        if (cached && cached.quote && !shouldRefreshQuote(cached.timestamp)) {
          setQuote(cached.quote);
          setIsLoading(false);
          return;
        }
      }

      // Fetch fresh quote from API
      const freshQuote = await apiGetQuoteOfTheDay();
      setQuote(freshQuote);
      await writeQuoteCache(freshQuote);
      
      onRefresh?.();
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      
      // Fall back to cached quote on error
      const cached = await readQuoteCache();
      if (cached && cached.quote) {
        setQuote(cached.quote);
      } else {
        // Ultimate fallback
        setQuote({
          id: 0,
          quoteText: "The journey of a thousand miles begins with a single step.",
          category: "motivational",
          author: { name: "Lao Tzu" }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update quote (for pull-to-refresh)
  const updateQuote = async () => {
    await fetchQuote(true); // Force refresh
  };

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateQuote
  }));

  // Initialize: Load cached quote first, then check if refresh needed
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchQuote(false);
    }
  }, []);

  return (
    <View className={`rounded-3xl overflow-hidden ${className}`}
      style={{ 
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 14,
      }}>
      {/* Main gradient background */}
      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="relative">
        
        {/* Subtle overlay for depth */}
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.08)', 'transparent', 'rgba(168, 85, 247, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        
        {/* Decorative background elements */}
        <View className="absolute top-4 right-4 opacity-10" style={{ zIndex: 0 }}>
          <Ionicons name="sparkles" size={90} color="#fbbf24" />
        </View>
        <View className="absolute bottom-4 left-4 opacity-8" style={{ zIndex: 0 }}>
          <Ionicons name="book-outline" size={70} color="#a78bfa" />
        </View>
        
        {/* Top accent bar with golden gradient */}
        <LinearGradient
          colors={['#f59e0b', '#fbbf24', '#fcd34d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute top-0 left-0 right-0"
          style={{ height: 2.5 }}
        />

        {/* Content wrapper */}
        <View className="px-6 py-6" style={{ zIndex: 1 }}>
          <View className="flex-row items-start">
            {/* Opening quote mark */}
            <Text 
              className="text-amber-400 font-black"
              style={{ 
                fontSize: 44,
                lineHeight: 44,
                opacity: 0.7,
                fontWeight: '900',
                marginTop: -6,
                marginRight: 6,
              }}>
              "
            </Text>
            
            {/* Quote content */}
            <View className="flex-1">
              {/* Quote text with gradient effect */}
              <View style={{ 
                backgroundColor: 'rgba(251, 191, 36, 0.06)',
                borderLeftWidth: 2,
                borderLeftColor: 'rgba(251, 191, 36, 0.3)',
                paddingLeft: 12,
                paddingRight: 8,
                paddingVertical: 6,
                borderRadius: 6,
              }}>
                <Text 
                  className="text-white font-semibold" 
                  style={{ 
                    fontSize: 17,
                    letterSpacing: 0.5, 
                    lineHeight: 26,
                    fontStyle: 'italic',
                    textShadowColor: 'rgba(251, 191, 36, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}>
                  {isLoading ? 'Loading wisdom...' : quote?.quoteText || '...'}
                </Text>
              </View>
              
              {/* Closing quote and author inline */}
              <View className="flex-row items-end justify-end mt-2">
                <View className="items-end mr-1">
                  {!isLoading && quote?.author && formatAuthor(quote.author) && (
                    <Text 
                      className="text-amber-300/70 text-xs font-medium"
                      style={{ letterSpacing: 0.3 }}>
                      — {formatAuthor(quote.author)}
                    </Text>
                  )}
                </View>
                <Text 
                  className="text-amber-400 font-black"
                  style={{ 
                    fontSize: 44,
                    lineHeight: 44,
                    opacity: 0.7,
                    fontWeight: '900',
                    marginBottom: -10,
                  }}>
                  "
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom accent shimmer */}
        <LinearGradient
          colors={['transparent', 'rgba(251, 191, 36, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 1 }}
        />
      </LinearGradient>
    </View>
  );
});

export default HomepageMotivationalQuotes;
