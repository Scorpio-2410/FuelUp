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
        className="relative"
        style={{ minHeight: 160 }}>
        
        {/* Subtle overlay for depth */}
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.08)', 'transparent', 'rgba(168, 85, 247, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        
        {/* Decorative background elements */}
        <View className="absolute -top-8 -right-8 opacity-8">
          <Ionicons name="sparkles" size={120} color="#fbbf24" />
        </View>
        <View className="absolute -bottom-6 -left-6 opacity-6">
          <Ionicons name="book-outline" size={90} color="#a78bfa" />
        </View>
        
        {/* Top accent bar with golden gradient */}
        <LinearGradient
          colors={['#f59e0b', '#fbbf24', '#fcd34d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute top-0 left-0 right-0"
          style={{ height: 2 }}
        />

        {/* Content wrapper */}
        <View className="p-7" style={{ overflow: 'visible' }}>
          {/* Quote text with sophisticated styling */}
          <View className="relative" style={{ minHeight: 120 }}>
            {/* Opening quote mark */}
            <Text 
              className="text-amber-400 font-black absolute top-0 left-0"
              style={{ 
                fontSize: 72,
                lineHeight: 72,
                opacity: 0.85,
                fontWeight: '900',
              }}>
              "
            </Text>
            
            <View className="pl-14 pr-14 pt-8 pb-8">
              <Text 
                className="text-white text-lg font-medium leading-7" 
                style={{ 
                  letterSpacing: 0.4, 
                  lineHeight: 28,
                  fontStyle: 'italic',
                }}>
                {isLoading ? 'Loading wisdom...' : quote?.quoteText || '...'}
              </Text>
            </View>
            
            {/* Closing quote mark and author - bottom right */}
            <View className="absolute bottom-0 right-0 items-end">
              <Text 
                className="text-amber-400 font-black"
                style={{ 
                  fontSize: 72,
                  lineHeight: 72,
                  opacity: 0.85,
                  fontWeight: '900',
                  marginBottom: -30,
                }}>
                "
              </Text>
              {!isLoading && quote?.author && formatAuthor(quote.author) && (
                <Text 
                  className="text-amber-300/70 text-xs font-medium mr-2 mb-2"
                  style={{ letterSpacing: 0.3 }}>
                  — {formatAuthor(quote.author)}
                </Text>
              )}
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
