Quick frontend integration guide

1) Where to call
- POST /api/foodRecommendation/recommend
- Use the same JWT you use for other authenticated endpoints.

2) Request shape
{
  inventory: [{ name, qty?, unit? }],
  prefs: { kcalTarget?, proteinTarget?, mealType? },
  topK: 3,
  debug: true // optional
}

3) Response shape (important fields)
- recommendations: array of recipes
  - id, title
  - ingredients: [{ name, qty, unit, optional }]
  - stepsMd: markdown string with steps
  - perServing: { kcal, protein, carbs, fat, servings }
- debug (dev only): fatsecret_matches, fatsecret_nutrition, contributions

4) Rendering notes
- Render ingredients in a list showing qty + unit; prefer grams for accuracy.
- Render steps with a lightweight markdown parser or split on newlines.
- Show macros prominently on each card.

5) Example (React Native)
- See `frontend/components/Meal/FoodRecommendations.tsx` for a minimal example component.

7) Quick dev tips — supplying a JWT for testing

- If you are already logged in inside the app, the API helper will read the token from secure storage automatically and no extra steps are needed.
- For local testing you can pass a token prop directly to the component:

```tsx
// provide a valid token (string) you obtained from POST /api/users/login
<FoodRecommendations token={TEST_JWT} />  // import from `../components/Meal/FoodRecommendations`
```

- Alternatively, call the login helper in code or the JS console to get a token and store it using the existing helper:

```ts
import { apiLogin, storeToken } from '../constants/api';
const { token } = await apiLogin({ identifier: 'you@example.com', password: 'hunter2' });
await storeToken(token);
// reload component — apiRecommendFood will now include auth header automatically
```

6) UX tips
- Debounce calls from user input (don’t call on every keystroke).
- Show a loading state while waiting for AI; consider a progress spinner and estimated wait time.
- On error, fallback to showing cached suggestions or the fallback bank.

