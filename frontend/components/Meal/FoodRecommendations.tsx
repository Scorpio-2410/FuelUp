import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Button, ScrollView } from 'react-native';
import { apiRecommendFood } from '../../constants/api';

// Dark-themed small recommendation renderer used inside the recommend modal
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

  useEffect(()=>{ load(); }, [JSON.stringify(inventory ?? [])]);

  if (loading) return <View style={{ padding: 20 }}><ActivityIndicator color="#fff" /></View>;
  if (error) return (
    <View style={{padding:16}}>
      <Text style={{color:'#ff6b6b'}}>Error: {error}</Text>
      <Button title="Retry" onPress={load} />
    </View>
  );

  return (
    <ScrollView style={{padding:12}} contentContainerStyle={{ paddingBottom: 80 }}>
      {recipes.map(r => (
        <View key={r.id} style={{backgroundColor:'#0f1720',borderWidth:1,borderColor:'#263244',padding:12,marginBottom:12,borderRadius:8}}>
          <Text style={{fontSize:18,fontWeight:'700',color:'#fff'}}>{r.title}</Text>
          <Text style={{color:'#9ca3af',marginTop:2}}>{(r.mealType||[]).join(', ')} • {Object.keys(r.diet || {}).filter((k) => (r.diet || {})[k]).join(', ')}</Text>
          <View style={{marginTop:8}}>
            <Text style={{fontWeight:'600',color:'#fff'}}>Ingredients</Text>
            {r.ingredients.map((ing,i)=> (
              <Text key={i} style={{color:'#d1d5db'}}>• {ing.qty ? `${ing.qty} ${ing.unit||''} ` : ''}{ing.name}{ing.optional? ' (optional)':''}</Text>
            ))}
          </View>
          <View style={{marginTop:8}}>
            <Text style={{fontWeight:'600',color:'#fff'}}>Steps</Text>
            <Text style={{color:'#d1d5db'}}>{r.stepsMd}</Text>
          </View>
          <View style={{marginTop:8}}>
            <Text style={{fontWeight:'600',color:'#fff'}}>Per serving</Text>
            <Text style={{color:'#d1d5db'}}>{r.perServing.kcal} kcal • {r.perServing.protein}g protein • {r.perServing.carbs}g carbs • {r.perServing.fat}g fat</Text>
          </View>
        </View>
      ))}
      {recipes.length === 0 && (
        <View style={{ padding: 20 }}>
          <Text style={{ color: '#9ca3af' }}>No recommendations found for that inventory.</Text>
        </View>
      )}
    </ScrollView>
  );
}
