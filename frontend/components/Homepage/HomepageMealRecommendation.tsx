// Homepage meal recommendation component
// Fetches real meal names from FatSecret API to suggest meals to users
// Encourages exploration of meal planning features with authentic recipe data

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiSearchRecipesV3 } from '../../constants/api';

interface HomepageMealRecommendationProps {
  className?: string;
  onRefresh?: () => void; // Callback for when recommendation updates
}

type RecipeData = {
  recipe_id: string;
  recipe_name: string;
  recipe_image?: string | null;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
};

const HomepageMealRecommendation = forwardRef<any, HomepageMealRecommendationProps>(({ className, onRefresh }, ref) => {
  const router = useRouter();
  const [mealRecommendation, setMealRecommendation] = useState("Hey, try out this delicious meal!");
  const [currentRecipe, setCurrentRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentRecipeIds, setRecentRecipeIds] = useState<Set<string>>(new Set());
  const [imageError, setImageError] = useState(false);

  // Random search terms for variety
  const randomSearchTerms = [
    'chicken', 'pasta', 'salad', 'rice', 'fish', 'beef', 'soup', 'sandwich',
    'pizza', 'burger', 'steak', 'curry', 'noodles', 'breakfast', 'dessert',
    'cake', 'smoothie', 'tacos', 'sushi', 'eggs', 'vegetarian', 'shrimp',
    'salmon', 'pork', 'cheese', 'chocolate', 'bread', 'potato', 'beans'
  ];

  // Fetch random meal from API
  const fetchRandomMeal = async () => {
    setIsLoading(true);
    try {
      let recipesWithImages: any[] = [];
      let attempts = 0;
      const maxAttempts = 3;
      
      // Try multiple search terms until we find recipes with images
      while (recipesWithImages.length === 0 && attempts < maxAttempts) {
        const randomTerm = randomSearchTerms[Math.floor(Math.random() * randomSearchTerms.length)];
        const randomPage = Math.floor(Math.random() * 3);
        
        const data = await apiSearchRecipesV3({
          q: randomTerm,
          page: randomPage,
          maxResults: 25,
        });

        const recipes = data?.recipes?.recipe ?? [];
        const recipeList = Array.isArray(recipes) ? recipes : recipes ? [recipes] : [];
        
        // Filter to only recipes with images
        recipesWithImages = recipeList.filter(recipe => 
          recipe.recipe_image || recipe.recipe_images?._500
        );
        
        attempts++;
      }
      
      if (recipesWithImages.length > 0) {
        // Filter out recently shown recipes to avoid repetition
        const availableRecipes = recipesWithImages.filter(recipe => 
          !recentRecipeIds.has(String(recipe.recipe_id))
        );
        
        // If all recipes were recently shown, reset the cache
        const recipesToChooseFrom = availableRecipes.length > 0 ? availableRecipes : recipesWithImages;
        
        const randomRecipe = recipesToChooseFrom[Math.floor(Math.random() * recipesToChooseFrom.length)];
        const recipeName = randomRecipe.recipe_name || 'delicious meal';
        
        // Add to recent recipes cache (keep last 10)
        const newRecentIds = new Set(recentRecipeIds);
        newRecentIds.add(String(randomRecipe.recipe_id));
        if (newRecentIds.size > 10) {
          const firstId = Array.from(newRecentIds)[0];
          newRecentIds.delete(firstId);
        }
        setRecentRecipeIds(newRecentIds);
        
        // Store the full recipe data for navigation
        const imageUrl = randomRecipe.recipe_image || randomRecipe.recipe_images?._500 || null;
        
        setCurrentRecipe({
          recipe_id: randomRecipe.recipe_id,
          recipe_name: randomRecipe.recipe_name,
          recipe_image: imageUrl,
          nutrition: {
            calories: randomRecipe.recipe_nutrition?.calories || randomRecipe.calories,
            protein: randomRecipe.recipe_nutrition?.protein || randomRecipe.protein,
            carbs: randomRecipe.recipe_nutrition?.carbs || randomRecipe.carbs,
            fat: randomRecipe.recipe_nutrition?.fat || randomRecipe.fat,
          },
        });
        
        // Reset image error state when new recipe is loaded
        setImageError(false);
        
        setMealRecommendation(`Hey, try out this ${recipeName}`);
      } else {
        // Keep current recipe if we can't find new ones
        setMealRecommendation("Finding your next meal...");
      }
    } catch (error) {
      // Silently fail and keep showing current recipe
      setMealRecommendation("Finding your next meal...");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial meal recommendation
  useEffect(() => {
    fetchRandomMeal();
  }, []);

  // Update recommendation with API data
  const updateMessage = () => {
    fetchRandomMeal();
    onRefresh?.(); // Notify parent component if needed
  };

  // Navigate to meal details page
  const handleMealPress = () => {
    if (currentRecipe) {
      router.push(`/(tabs)/meal/${currentRecipe.recipe_id}`);
    }
  };

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateMessage
  }));

  return (
    <Pressable
      onPress={handleMealPress}
      disabled={!currentRecipe}
      className={`${className}`}
      style={{ 
        opacity: currentRecipe ? 1 : 0.8,
      }}>
      <View
        style={{
          borderRadius: 20,
          padding: 16,
          backgroundColor: "#4A4A6A",
          opacity: 0.9,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background meal image */}
        {currentRecipe?.recipe_image && !imageError && (
          <View style={{
            position: 'absolute',
            top: 1,
            right: 1,
            width: 130,
            bottom: 1,
            borderRadius: 19,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}>
            <Image
              source={{ uri: currentRecipe.recipe_image }}
              style={{ 
                width: '100%', 
                height: '100%',
              }}
              resizeMode="cover"
              onError={() => {
                setImageError(true);
              }}
            />
          </View>
        )}
        
        {/* Fallback when image fails to load */}
        {currentRecipe?.recipe_image && imageError && (
          <View style={{
            position: 'absolute',
            top: 1,
            right: 1,
            width: 130,
            bottom: 1,
            borderRadius: 19,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 24 }}>
              🍽️
            </Text>
          </View>
        )}
        <View style={{ marginBottom: 8, zIndex: 1, marginRight: 130 }}>
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 18, 
            fontWeight: 'bold',
          }}>
            🍽️ Meal Recommendation
          </Text>
        </View>

        <Text style={{ 
          color: '#ffffff', 
          fontSize: 16, 
          fontWeight: '600',
          textAlign: 'left',
          lineHeight: 22,
          zIndex: 1,
          marginRight: 130,
        }}>
          {isLoading ? "Finding a great meal..." : mealRecommendation}
        </Text>

        {currentRecipe?.nutrition && (
          <View style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.2)',
            zIndex: 1,
            marginRight: 130,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {currentRecipe.nutrition.calories && (
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                    {Math.round(currentRecipe.nutrition.calories)}
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '500' }}>
                    CAL
                  </Text>
                </View>
              )}
              {currentRecipe.nutrition.protein && (
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                    {Math.round(currentRecipe.nutrition.protein)}g
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '500' }}>
                    PROTEIN
                  </Text>
                </View>
              )}
              {currentRecipe.nutrition.carbs && (
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                    {Math.round(currentRecipe.nutrition.carbs)}g
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '500' }}>
                    CARBS
                  </Text>
                </View>
              )}
              {currentRecipe.nutrition.fat && (
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                    {Math.round(currentRecipe.nutrition.fat)}g
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '500' }}>
                    FAT
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
});

export default HomepageMealRecommendation;