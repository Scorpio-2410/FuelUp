// tmp_test_fatsecret.js
// Quick test for FatSecret client. Usage:
//   node tmp_test_fatsecret.js
// It will check for FATSECRET_CONSUMER_KEY / FATSECRET_CONSUMER_SECRET in env and run a sample search.

require('dotenv').config();
const fatsecret = require('./utils/fatsecretClient');

(async ()=>{
  try{
    const key = process.env.FATSECRET_CONSUMER_KEY;
    const secret = process.env.FATSECRET_CONSUMER_SECRET;
    console.log('FATSECRET_CONSUMER_KEY present?', !!key);
    console.log('FATSECRET_CONSUMER_SECRET present?', !!secret);
    if (!key || !secret){
      console.log('\nMissing FatSecret credentials in environment. Please add FATSECRET_CONSUMER_KEY and FATSECRET_CONSUMER_SECRET to your .env or environment.\n');
      process.exit(0);
    }

    const queries = ['chicken breast','olive oil','banana','eggs','pasta'];
    for (const q of queries){
      try{
        console.log('\nSearching for:', q);
        const res = await fatsecret.searchFoods(q, 0);
        console.log('searchFoods result keys:', Object.keys(res || {}));
        const foods = (res && res.foods && res.foods.food) || [];
        if (!foods || foods.length === 0){
          console.log('No results for', q);
          continue;
        }
        const first = Array.isArray(foods) ? foods[0] : foods;
        console.log('First match:', { id: first.food_id, name: first.food_name });
        // fetch detail
        const detail = await fatsecret.getFood(first.food_id);
        console.log('Detail keys:', Object.keys(detail || {}));
      }catch(e){
        console.error('Search failed for', q, e && e.message ? e.message : e);
      }
    }
  }catch(e){
    console.error('FatSecret test failed:', e && e.message ? e.message : e);
  }
})();
