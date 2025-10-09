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

  // Fallback meal suggestions if API fails
  const fallbackMeals = [
    "Hey, try out this Chocolate Banana Bread",
    "Hey, try out this Grilled Salmon Bowl",
    "Hey, try out this Mediterranean Quinoa Salad",
    "Hey, try out this Spicy Thai Basil Chicken",
    "Hey, try out this Creamy Mushroom Risotto",
    "Hey, try out this Honey Glazed Chicken Wings",
    "Hey, try out this Fresh Berry Smoothie Bowl",
    "Hey, try out this Garlic Butter Shrimp Pasta",
    "Hey, try out this Avocado Toast Deluxe",
    "Hey, try out this Beef Teriyaki Stir Fry",
    "Hey, try out this Caprese Stuffed Chicken",
    "Hey, try out this Chocolate Chip Pancakes",
  ];

  // Smart recommendation categories based on time of day
  const getTimeBasedSearchTerms = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      // Morning - breakfast items
      return ['breakfast', 'pancake', 'waffle', 'cereal', 'muffin', 'toast', 'egg', 'smoothie', 'yogurt', 'coffee', 'bagel'];
    } else if (hour >= 11 && hour < 16) {
      // Lunch time - lighter meals
      return ['salad', 'sandwich', 'soup', 'wrap', 'quinoa', 'chicken', 'fish', 'vegetarian', 'lunch', 'healthy'];
    } else if (hour >= 16 && hour < 20) {
      // Dinner time - hearty meals
      return ['pasta', 'rice', 'pizza', 'burger', 'steak', 'roast', 'curry', 'stir', 'casserole', 'dinner', 'main'];
    } else {
      // Evening/night - snacks and desserts
      return ['dessert', 'cake', 'cookie', 'snack', 'trail', 'nuts', 'fruit', 'chocolate', 'ice cream', 'treat'];
    }
  };

  // Get recommendation message based on time
  const getRecommendationMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      return "Good morning! Try this breakfast:";
    } else if (hour >= 11 && hour < 16) {
      return "Lunch time! Here's a great option:";
    } else if (hour >= 16 && hour < 20) {
      return "Dinner inspiration:";
    } else {
      return "Late night treat:";
    }
  };

  // Fetch random meal from API with smart recommendations
  const fetchRandomMeal = async () => {
    setIsLoading(true);
    try {
      // Use time-based recommendations for better UX
      const searchTerms = getTimeBasedSearchTerms();
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const randomPage = Math.floor(Math.random() * 3); // Reduced pages for better results
      
      const data = await apiSearchRecipesV3({
        q: randomTerm,
        page: randomPage,
        maxResults: 25,
      });

      const recipes = data?.recipes?.recipe ?? [];
      const recipeList = Array.isArray(recipes) ? recipes : recipes ? [recipes] : [];
      
      if (recipeList.length > 0) {
        // Filter out recently shown recipes to avoid repetition
        const availableRecipes = recipeList.filter(recipe => 
          !recentRecipeIds.has(String(recipe.recipe_id))
        );
        
        // If all recipes were recently shown, reset the cache
        const recipesToChooseFrom = availableRecipes.length > 0 ? availableRecipes : recipeList;
        
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
        console.log('Recipe image URL:', imageUrl); // Debug log
        
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
        
        const timeMessage = getRecommendationMessage();
        setMealRecommendation(`${timeMessage} ${recipeName}`);
      } else {
        // Use fallback if no recipes found
        const fallback = fallbackMeals[Math.floor(Math.random() * fallbackMeals.length)];
        setMealRecommendation(fallback);
        setCurrentRecipe(null); // No navigation for fallback
      }
    } catch (error) {
      console.warn('Failed to fetch random meal:', error);
      // Use fallback on error
      const fallback = fallbackMeals[Math.floor(Math.random() * fallbackMeals.length)];
      setMealRecommendation(fallback);
      setCurrentRecipe(null); // No navigation for fallback
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
              onError={(error) => {
                console.log('Image failed to load:', currentRecipe.recipe_image, error);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', currentRecipe.recipe_image);
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