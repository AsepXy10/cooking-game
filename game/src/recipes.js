// Warung Kilat — recipe book.
// Every dish on the menu, every ingredient in the stall, and the rules for
// matching a finished plate against an order ticket. Pure data + helpers,
// no drawing and no game state in here.

// How long one portion spends in the wok, in seconds, before it is done.
// After the done window it starts to burn; stirring resets the burn clock.
export const INGREDIENTS = [
  { id: 'rice',    name: 'Nasi',    cook: 6 },
  { id: 'noodle',  name: 'Mie',     cook: 6 },
  { id: 'chicken', name: 'Ayam',    cook: 8 },
  { id: 'egg',     name: 'Telur',   cook: 4 },
  { id: 'veg',     name: 'Sayur',   cook: 5 },
  { id: 'sambal',  name: 'Sambal',  cook: 3 },
  { id: 'kecap',   name: 'Kecap',   cook: 2 },
  { id: 'cracker', name: 'Kerupuk', cook: 2 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id) || null;
}

// The menu. `day` is the first day the dish can be ordered: the stall
// starts with three dishes and the menu grows as the days go on.
export const RECIPES = [
  { id: 'nasi-telur',    name: 'Nasi Goreng Telur',   ing: ['rice', 'egg', 'kecap'],              price: 18, day: 1 },
  { id: 'nasi-ayam',     name: 'Nasi Goreng Ayam',    ing: ['rice', 'chicken', 'egg', 'sambal'],  price: 26, day: 1 },
  { id: 'mie-sayur',     name: 'Mie Goreng Sayur',    ing: ['noodle', 'veg', 'egg'],              price: 22, day: 1 },
  { id: 'mie-spesial',   name: 'Mie Goreng Spesial',  ing: ['noodle', 'chicken', 'veg', 'sambal'], price: 30, day: 2 },
  { id: 'nasi-kerupuk',  name: 'Nasi Goreng Kerupuk', ing: ['rice', 'chicken', 'cracker', 'sambal'], price: 28, day: 2 },
  { id: 'mie-ayam',      name: 'Mie Ayam Kilat',      ing: ['noodle', 'chicken', 'veg', 'kecap'],  price: 32, day: 3 },
];

export function recipeById(id) {
  return RECIPES.find((dish) => dish.id === id) || null;
}

export function unlockedRecipes(day) {
  return RECIPES.filter((dish) => dish.day <= day);
}

// True when the plate holds exactly the dish's ingredients, in any order.
export function plateMatchesDish(plateItems, dish) {
  if (plateItems.length !== dish.ing.length) return false;
  const wanted = [...dish.ing].sort();
  const served = [...plateItems].sort();
  return wanted.every((id, i) => served[i] === id);
}

// The dish a plate is, or null when the mix matches nothing on the menu.
export function dishOnPlate(plateItems) {
  return RECIPES.find((dish) => plateMatchesDish(plateItems, dish)) || null;
}
