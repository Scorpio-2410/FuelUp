Food Recommendations API — quick reference

Summary
- Endpoint: POST /api/foodRecommendation/recommend
- Purpose: Send user's pantry/inventory and receive generated recipe recommendations (AI) ranked by fit.
- Auth: Bearer JWT required (same as other protected endpoints). For dev you can set body.debug=true or ?debug=1 to receive extra debug info.

Request body (JSON)
{
  "inventory": [
    { "name": "chicken breast", "qty": 200, "unit": "g" },
    { "name": "rice", "qty": 150, "unit": "g" }
  ],
  "prefs": { "proteinTarget": 50, "kcalTarget": 700, "mealType": "lunch" },
  "topK": 3,
  "debug": true   // optional: request debug info in response
}

Success response (200) JSON
{
  "recommendations": [
    {
      "id": "recipe-1",
      "title": "Chicken Rice Bowl",
      "mealType": ["lunch"],
      "diet": { "vegetarian": false },
      "ingredients": [ { "name":"chicken breast","qty":200,"unit":"g","optional":false }, ... ],
      "stepsMd": "1. ...\n2. ...",
      "perServing": { "kcal":650, "protein":45, "carbs":70, "fat":15, "servings":1 }
    }
  ],
  "rationale": "...",
  // debug is only present when requested (debug=true or NODE_ENV=development)
  "debug": {
    "attempts": [ { "raw": "<raw AI output>" } ],
    "fatsecret_matches": { "chicken breast": [ {id, name}, ... ] },
    "fatsecret_nutrition": { ... },
    "contributions": { "recipe-1": [ { name, grams, kcal, protein, carbs, fat } ] }
  }
}

Errors
- 400: invalid request (e.g., inventory not array)
- 401: missing/invalid JWT
- 500: server error

Frontend fetch example (JS)
const res = await fetch('/api/foodRecommendation/recommend', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ inventory, prefs, topK: 3, debug: true })
});
const data = await res.json();

Rendering guidance (sample UI mapping)
- recommendations: render as a list of cards. Each card shows:
  - title
  - mealType (badge)
  - diet tags
  - ingredients: show qty + unit (prefer grams) and optional flag
  - steps: render `stepsMd` as simple markdown / paragraphs
  - macros: perServing.kcal, protein, carbs, fat; show per serving
- debug (dev only): show a collapsible panel with fatsecret_matches and contributions for troubleshooting

Notes / Tips
- Provide ingredient quantities when calling the endpoint for the most accurate macros (prefer grams).
- If FatSecret integration isn't configured, the AI will still generate recipes but macros will be model estimates (not database-backed). To enable FatSecret, set FATSECRET_CONSUMER_KEY and FATSECRET_CONSUMER_SECRET in the backend environment.
- The endpoint is rate/CPU intensive when calling OpenAI; consider adding client-side debounce and server-side rate limiting for production.

Contact
- Backend: controllers/foodRecommendationController.js
- FatSecret client: utils/fatsecretClient.js
