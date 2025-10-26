 (async ()=>{
  const url = process.env.URL || 'http://localhost:4000/api/foodRecommendation/recommend';
  const token = process.env.TEST_TOKEN || 'eyJhbGciOiJI...';
  const sampleBody = {
    inventory: [
      { name: 'chicken breast', qty: 300, unit: 'g' },
      { name: 'pasta', qty: 500, unit: 'g' },
      { name: 'Beef Mince', qty: 500, unit: 'g' },
      { name: 'olive oil', qty: 1, unit: 'tbsp' },
      { name: 'banana', qty: 2, unit: 'pc' },
      { name: 'eggs', qty: 12, unit: 'pcs' }
    ],
    prefs: { proteinTarget: 80, kcalTarget: 650, mealType: 'lunch' },
    topK: 3,
    debug: true
  };

  try{
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 120000); // 120s timeout
    console.log('Starting request at', new Date().toISOString());
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
      body: JSON.stringify(sampleBody),
      signal: controller.signal
    });
    clearTimeout(timeout);
  const text = await res.text();
  console.log('Finished request at', new Date().toISOString());
    console.log('Status:', res.status);
    try{ console.log('Body:', JSON.stringify(JSON.parse(text), null, 2)); }
    catch(e){ console.log('Body raw:', text); }
  }catch(e){
    console.error('Request error:', e && e.message ? e.message : e);
  }
})();
