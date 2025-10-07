// backend/utils/fatsecretClient.js
// FatSecret OAuth 1.0a client using Node's built-in fetch (Node 18+)
const crypto = require("crypto");
require("dotenv").config();

const FATSECRET_ENDPOINT = "https://platform.fatsecret.com/rest/server.api";

/* ---------- OAuth helpers ---------- */
function oauthParams() {
  return {
    oauth_consumer_key: process.env.FATSECRET_CONSUMER_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    format: "json",
  };
}
function pct(v) {
  return encodeURIComponent(v).replace(
    /[!*()']/g,
    (c) => "%" + c.charCodeAt(0).toString(16)
  );
}
function sign(params, method = "GET", url = FATSECRET_ENDPOINT) {
  const paramStr = Object.keys(params)
    .sort()
    .map((k) => `${pct(k)}=${pct(params[k])}`)
    .join("&");
  const base = [method.toUpperCase(), pct(url), pct(paramStr)].join("&");
  const key = `${pct(process.env.FATSECRET_CONSUMER_SECRET)}&`;
  const sig = crypto.createHmac("sha1", key).update(base).digest("base64");
  return { ...params, oauth_signature: sig };
}
async function call(extra) {
  const params = sign({ ...oauthParams(), ...extra });
  const qs = new URLSearchParams(params).toString();
  const url = `${FATSECRET_ENDPOINT}?${qs}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FatSecret ${extra.method} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/* ---------- Public API ---------- */
function searchFoods(search_expression, page_number = 0) {
  return call({ method: "foods.search", search_expression, page_number });
}
function getFood(food_id) {
  return call({ method: "food.get.v2", food_id });
}
function searchRecipesV3({
  search_expression = "",
  page_number = 0,
  max_results = 25,
  recipe_types,
  recipe_types_matchall,
}) {
  const extra = {
    method: "recipes.search.v3",
    page_number,
    max_results,
  };
  if (search_expression) extra.search_expression = search_expression;
  if (recipe_types) extra.recipe_types = recipe_types; // comma-separated
  if (typeof recipe_types_matchall !== "undefined")
    extra.recipe_types_matchall = recipe_types_matchall ? "true" : "false";
  return call(extra);
}
function getRecipe(recipe_id) {
  return call({ method: "recipe.get.v2", recipe_id });
}

module.exports = {
  searchFoods,
  getFood,
  searchRecipesV3,
  getRecipe,
};
