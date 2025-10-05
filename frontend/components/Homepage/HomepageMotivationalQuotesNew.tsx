// Homepage motivational quote component with celestial theme
// Fetches quotes from backend API with 30-minute auto-refresh
// Supports pull-to-refresh and cache clearing

import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CelestialBackground } from '../Theme/CelestialBackground';
import { ThemedCard } from '../Theme/ThemedCard';
import { ThemedText } from '../Theme/ThemedText';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  apiGetQuoteOfTheDay,
  apiGetRandomQuote, 
  readQuoteCache, 
  writeQuoteCache 
} from '../../constants/api';

interface QuoteData {
  id: number;
  quoteText: string;
  author?: {
    name: string;
    birthYear?: number;
    deathYear?: number;
  } | null;
}

interface HomepageMotivationalQuotesProps {
  className?: string;
  onRefresh?: () => void;
}

interface HomepageMotivationalQuotesRef {
  refresh: () => void;
}

const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutes in milliseconds

const HomepageMotivationalQuotesNew = forwardRef<any, HomepageMotivationalQuotesProps>(({ className, onRefresh }, ref) => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);
  const { theme } = useTheme();

  // Format author display with years
  const formatAuthor = (author: QuoteData['author']) => {
    if (!author || !author.name) return null;
    
    // Format years
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

  // Check if cached quote should be refreshed
  const shouldRefreshQuote = (cachedQuote: any): boolean => {
    if (!cachedQuote || !cachedQuote.timestamp) return true;
    const now = Date.now();
    const cacheAge = now - cachedQuote.timestamp;
    return cacheAge > THIRTY_MINUTES;
  };

  // Fetch quote from API or cache
  const fetchQuote = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);

      // Try to read from cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedQuote = await readQuoteCache();
        if (cachedQuote && !shouldRefreshQuote(cachedQuote)) {
          setQuote(cachedQuote.data);
          setIsLoading(false);
          return;
        }
      }

      // Fetch new quote from API
      const response = await apiGetRandomQuote();
      if (response.success && response.data) {
        setQuote(response.data);
        // Cache the new quote
        await writeQuoteCache({
          data: response.data,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Fallback quote if API fails
      setQuote({
        id: 0,
        quoteText: "The only way to do great work is to love what you do.",
        author: {
          name: "Steve Jobs",
          birthYear: 1955,
          deathYear: 2011,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: () => fetchQuote(true),
  }));

  // Initial fetch
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchQuote(false);
    }
  }, []);

  return (
    <ThemedCard 
      className={className}
      variant="glass"
      style={{ 
        shadowColor: theme.colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        borderRadius: 24,
      }}>
      <CelestialBackground 
        theme={theme}
        intensity="medium"
        showStars={true}
        showClouds={true}>
        
        <View style={{ position: 'relative', minHeight: 160, padding: 24 }}>
          {/* Subtle accent line */}
          <LinearGradient
            colors={[theme.colors.accent.warning, theme.colors.accent.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              borderRadius: 1,
            }}
          />

          {/* Decorative icons */}
          <View style={{ position: 'absolute', top: 16, right: 16, opacity: 0.1, zIndex: 1 }}>
            <Ionicons name="sparkles" size={60} color={theme.colors.accent.warning} />
          </View>
          <View style={{ position: 'absolute', bottom: 16, left: 16, opacity: 0.1, zIndex: 1 }}>
            <Ionicons name="book-outline" size={80} color={theme.colors.accent.primary} />
          </View>

          <View style={{ position: 'relative', flex: 1 }}>
            {/* Opening quote */}
            <ThemedText 
              style={{ 
                position: 'absolute',
                top: -8,
                left: -2,
                fontSize: 42,
                fontWeight: '900',
                opacity: 0.8,
                color: theme.colors.accent.warning,
                textShadowColor: theme.colors.effects.glow,
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 6,
                lineHeight: 42,
                zIndex: 5,
              }}>
              {'\u201C'}
            </ThemedText>
            
            {/* Closing quote */}
            <ThemedText 
              style={{ 
                position: 'absolute',
                bottom: 8,
                right: 2,
                fontSize: 42,
                fontWeight: '900',
                opacity: 0.8,
                color: theme.colors.accent.warning,
                textShadowColor: theme.colors.effects.glow,
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 6,
                lineHeight: 42,
                zIndex: 5,
              }}>
              {'\u201D'}
            </ThemedText>
            
            {/* Centered quote text */}
            <View style={{
              paddingHorizontal: 20,
              paddingVertical: 20,
              paddingBottom: 50, // Space for author
              flex: 1,
              justifyContent: 'center',
            }}>
              <ThemedText 
                variant="primary"
                size="lg"
                weight="semibold"
                align="center"
                style={{ 
                  fontSize: 18,
                  letterSpacing: 1.0, 
                  lineHeight: 28,
                  fontStyle: 'italic',
                  fontFamily: Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif',
                  textShadowColor: theme.colors.effects.glow,
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 8,
                }}>
                {isLoading ? 'Loading wisdom...' : quote?.quoteText || '...'}
              </ThemedText>
            </View>
            
            {/* Author attribution */}
            {!isLoading && quote?.author && formatAuthor(quote.author) && (
              <ThemedText 
                variant="secondary"
                size="sm"
                weight="medium"
                style={{ 
                  position: 'absolute',
                  bottom: 32,
                  right: 20,
                  letterSpacing: 0.3,
                  textAlign: 'right',
                  zIndex: 6,
                  opacity: 0.8,
                }}>
                — {formatAuthor(quote.author)}
              </ThemedText>
            )}
          </View>
        </View>
      </CelestialBackground>
    </ThemedCard>
  );
});

HomepageMotivationalQuotesNew.displayName = 'HomepageMotivationalQuotesNew';

export default HomepageMotivationalQuotesNew;
