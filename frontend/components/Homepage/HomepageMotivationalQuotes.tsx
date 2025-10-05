// Homepage motivational quote component
// Fetches quotes from backend API with 30-minute auto-refresh
// Supports pull-to-refresh and cache clearing

import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  apiGetQuoteOfTheDay,
  apiGetRandomQuote, 
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
    
    let yearsStr = '';
    if (author.birthYear || author.deathYear) {
      const birth = author.birthYear 
        ? (author.birthYear < 0 ? `${Math.abs(author.birthYear)} BC` : author.birthYear)
        : '?';
      const death = author.deathYear 
        ? (author.deathYear < 0 ? `${Math.abs(author.deathYear)} BC` : author.deathYear)
        : '?';
      if (birth !== '?' || death !== '?') {
        yearsStr = ` (${birth} - ${death})`;
      }
    }
    return `${author.name}${yearsStr}`;
  };

  const shouldRefreshQuote = (timestamp: number): boolean => {
    const now = Date.now();
    return (now - timestamp) > THIRTY_MINUTES;
  };

  const fetchQuote = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      if (!forceRefresh) {
        const cached = await readQuoteCache();
        if (cached && cached.quote && !shouldRefreshQuote(cached.timestamp)) {
          setQuote(cached.quote);
          setIsLoading(false);
          return;
        }
      }

      // For testing
      const freshQuote = await apiGetRandomQuote();
      setQuote(freshQuote);
      await writeQuoteCache(freshQuote);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      const cached = await readQuoteCache();
      if (cached && cached.quote) {
        setQuote(cached.quote);
      } else {
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

  const updateQuote = async () => {
    await fetchQuote(true);
  };

  useImperativeHandle(ref, () => ({
    updateQuote
  }));

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
      <LinearGradient
        colors={['rgba(30, 27, 75, 0.6)', 'rgba(49, 40, 129, 0.6)', 'rgba(30, 41, 59, 0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="relative">

        <LinearGradient
          colors={['rgba(251, 191, 36, 0.08)', 'transparent', 'rgba(168, 85, 247, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />

        <View className="absolute -top-6 -right-6 opacity-10" style={{ zIndex: 0 }}>
          <Ionicons name="sparkles" size={110} color="#fbbf24" />
        </View>
        <View className="absolute -bottom-8 -left-8 opacity-8" style={{ zIndex: 0 }}>
          <Ionicons name="book-outline" size={120} color="#a78bfa" />
        </View>

        {/* Decorative stars inside the quote widget */}
        <View className="absolute top-12 right-16 opacity-20" style={{ zIndex: 2 }}>
          <Text style={{ color: '#fbbf24', fontSize: 8 }}>✦</Text>
        </View>
        <View className="absolute top-20 right-20 opacity-15" style={{ zIndex: 2 }}>
          <Text style={{ color: '#ffffff', fontSize: 6 }}>✦</Text>
        </View>
        <View className="absolute bottom-16 left-16 opacity-25" style={{ zIndex: 2 }}>
          <Text style={{ color: '#fbbf24', fontSize: 10 }}>✦</Text>
        </View>
        <View className="absolute bottom-20 left-24 opacity-20" style={{ zIndex: 2 }}>
          <Text style={{ color: '#ffffff', fontSize: 7 }}>✦</Text>
        </View>
        <View className="absolute top-16 left-12 opacity-18" style={{ zIndex: 2 }}>
          <Text style={{ color: '#a78bfa', fontSize: 8 }}>✦</Text>
        </View>
        <View className="absolute bottom-24 right-12 opacity-22" style={{ zIndex: 2 }}>
          <Text style={{ color: '#fbbf24', fontSize: 6 }}>✦</Text>
        </View>

        <LinearGradient
          colors={['#f59e0b', '#fbbf24', '#fcd34d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute top-0 left-0 right-0"
          style={{ height: 3 }}
        />

        <View className="px-6 py-6 pb-7" style={{ zIndex: 1, minHeight: 140 }}>
          <View style={{ position: 'relative', flex: 1 }}>
            {/* Opening quote */}
            <Text 
              style={{ 
                position: 'absolute',
                top: -10,
                left: -4,
                color: '#fbbf24',
                fontSize: 48,
                fontWeight: '900',
                opacity: 0.75,
                textShadowColor: 'rgba(251, 191, 36, 0.6)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
                lineHeight: 48,
                zIndex: 5,
              }}>
              {'\u201C'}
            </Text>

             {/* Closing quote */}
             <Text 
               style={{ 
                 position: 'absolute',
                 bottom: 10,
                 right: 4,
                 color: '#fbbf24',
                 fontSize: 48,
                 fontWeight: '900',
                 opacity: 0.75,
                 textShadowColor: 'rgba(251, 191, 36, 0.6)',
                 textShadowOffset: { width: 0, height: 2 },
                 textShadowRadius: 8,
                 lineHeight: 48,
                 zIndex: 5,
               }}>
               {'\u201D'}
             </Text>

            {/* Centered quote text */}
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: 56, // Added space for author
              flex: 1,
              justifyContent: 'center',
            }}>
               <Text 
                 style={{ 
                   fontSize: 20,
                   fontWeight: '700',
                   letterSpacing: 0.8, 
                   lineHeight: 34,
                   color: '#ffffff',
                   textAlign: 'center',
                   fontStyle: 'italic',
                   fontFamily: Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif',
                   textShadowColor: 'rgba(251, 191, 36, 0.6)',
                   textShadowOffset: { width: 0, height: 2 },
                   textShadowRadius: 12,
                   textTransform: 'capitalize',
                 }}>
                 {isLoading ? 'Loading wisdom...' : quote?.quoteText || '...'}
               </Text>
            </View>

            {/* Author attribution */}
            {!isLoading && quote?.author && formatAuthor(quote.author) && (
              <Text 
                className="text-amber-300/70 text-xs font-medium"
                style={{ 
                  position: 'absolute',
                  bottom: 12, // under closing quote
                  right: -5,
                  letterSpacing: 0.3,
                  textAlign: 'right',
                  maxWidth: '75%',
                  zIndex: 6,
                }}>
                — {formatAuthor(quote.author)}
              </Text>
            )}
          </View>
        </View>

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
