import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Button, ScrollView } from 'react-native';
import { apiRecommendFood } from '../constants/api';

// Lightweight component that fetches recommendations and renders simple cards.
// Usage: <FoodRecommendations token={jwt} />

type Ingredient = { name: string; qty?: number; unit?: string; optional?: boolean };
type Recipe = {
  id: string;
  title: string;
  mealType: string[];
  diet?: Record<string, boolean>;
  ingredients: Ingredient[];
  stepsMd: string;
  perServing: { kcal: number; protein: number; carbs: number; fat: number; servings: number };
};
export default function FoodRecommendations({ token, inventory }: { token?: string | null; inventory?: Ingredient[] }){
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState(null as string|null);

  async function load(){
    setLoading(true); setError(null);
    try{
      const payloadInventory = Array.isArray(inventory) ? inventory : [];
      const data = await apiRecommendFood({ inventory: payloadInventory, prefs: {}, topK: 5 }, token ?? undefined);
      setRecipes(data.recommendations || []);
    }catch(e:any){
      setError(e.message||String(e));
    }finally{ setLoading(false); }
  }

  // Fetch whenever the provided inventory changes or on mount
  useEffect(()=>{ load(); }, [JSON.stringify(inventory ?? [])]);

  if (loading) return <ActivityIndicator />;
  if (error) return (
    <View style={{padding:16}}>
      <Text style={{color:'red'}}>Error: {error}</Text>
      <Button title="Retry" onPress={load} />
    </View>
  );

  return (
    <ScrollView style={{padding:12}}>
      {recipes.map(r => (
        <View key={r.id} style={{borderWidth:1,borderColor:'#ddd',padding:12,marginBottom:12,borderRadius:8}}>
          <Text style={{fontSize:18,fontWeight:'700'}}>{r.title}</Text>
          <Text style={{color:'#666'}}>{(r.mealType||[]).join(', ')} • {Object.keys(r.diet || {}).filter((k) => (r.diet || {})[k]).join(', ')}</Text>
          <View style={{marginTop:8}}>
            <Text style={{fontWeight:'600'}}>Ingredients</Text>
            {r.ingredients.map((ing,i)=> (
              <Text key={i}>• {ing.qty ? `${ing.qty} ${ing.unit||''} ` : ''}{ing.name}{ing.optional? ' (optional)':''}</Text>
            ))}
          </View>
          <View style={{marginTop:8}}>
            <Text style={{fontWeight:'600'}}>Steps</Text>
            <Text>{r.stepsMd}</Text>
          </View>
          <View style={{marginTop:8}}>
            <Text style={{fontWeight:'600'}}>Per serving</Text>
            <Text>{r.perServing.kcal} kcal • {r.perServing.protein}g protein • {r.perServing.carbs}g carbs • {r.perServing.fat}g fat</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
