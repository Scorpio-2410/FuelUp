// tmp_post_recommend.js
// Simple test script to POST to the food recommendation endpoint.
// Usage (cmd.exe):
//   set TEST_TOKEN=your_jwt_here
//   node tmp_post_recommend.js
// If TEST_TOKEN is not set, script will run without Authorization (expect 401 if auth required).

const url = process.env.URL || 'http://localhost:4000/api/foodRecommendation/recommend';
// Use TEST_TOKEN env if present, otherwise fall back to a local test token (developer convenience)
const token = process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE1LCJ1c2VybmFtZSI6InRlc3RlcjEiLCJpYXQiOjE3NjEyMDc2MzMsImV4cCI6MTc2MTgxMjQzM30.kSjXgpVtkJHFez3P7s2CQ9gN9fuyBzAeI3JF_fniYxI';

const sampleBody = {
  inventory: [
    { name: 'chicken breast', qty: 300, unit: 'g' },
    { name: 'pasta', qty: 500, unit: 'g' },
    { name: 'Beef Mince', qty: 500, unit: 'g' },
    { name: 'olive oil', qty: 1, unit: 'tbsp' },
    { name: 'banana', qty: 2, unit: 'pc' },
    { name: 'eggs', qty: 12, unit: 'pcs' }
  ],
  prefs: { proteinTarget: 30,
    kcalTarget: 650,
    proteinTarget: 80,
    mealType: "lunch",
    exclude: ["mushroom"]},
  topK: 10
};
// request debug info in response
sampleBody.debug = true;

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(sampleBody)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    try {
      const parsed = JSON.parse(text);
      console.log('Body (pretty JSON):', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Body (raw):', text);
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
})();
