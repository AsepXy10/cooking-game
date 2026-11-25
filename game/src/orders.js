// Warung Kilat — order tickets on the board.
// Tickets arrive over the shift, wait with a patience bar, and pay the dish
// price plus a tip for fast service. A ticket that waits too long walks out
// angry and breaks the serving combo.

import { unlockedRecipes, plateMatchesDish, recipeById } from './recipes.js';

let nextTicketId = 1;

export function newTicketQueue() {
  return { tickets: [], spawnIn: 2.5 };
}

// How many tickets can wait at once, and how patient they are, by day.
export function dayTicketRules(day) {
  return {
    maxTickets: day === 1 ? 2 : day === 2 ? 3 : 4,
    patienceMin: day === 1 ? 55 : day === 2 ? 48 : 42,
    patienceMax: day === 1 ? 75 : day === 2 ? 65 : 58,
    spawnEvery: day === 1 ? 9 : day === 2 ? 8 : 7,
  };
}

// Pick a dish the stall can cook today. Later days favour the dearer dishes
// a little, so the menu feels like it is growing.
export function pickDishForTicket(day, random) {
  const menu = unlockedRecipes(day);
  const roll = random();
  const index = roll < 0.45
    ? Math.floor(random() * Math.min(3, menu.length))
    : Math.floor(random() * menu.length);
  return menu[index];
}

export function spawnTicket(queue, day, random) {
  const rules = dayTicketRules(day);
  if (queue.tickets.length >= rules.maxTickets) return null;
  const dish = pickDishForTicket(day, random);
  const patience = rules.patienceMin + random() * (rules.patienceMax - rules.patienceMin);
  const ticket = {
    id: nextTicketId++,
    dishId: dish.id,
    patience,
    patienceMax: patience,
    price: dish.price,
  };
  queue.tickets.push(ticket);
  return ticket;
}

// Advance spawns and patience. Returns the tickets that just walked out.
export function tickTickets(queue, day, dt, random, rushActive) {
  const rules = dayTicketRules(day);
  queue.spawnIn -= dt;
  if (queue.spawnIn <= 0) {
    spawnTicket(queue, day, random);
    queue.spawnIn = rules.spawnEvery * (rushActive ? 0.45 : 1);
  }
  const walkedOut = [];
  for (const ticket of queue.tickets) {
    ticket.patience -= dt;
    if (ticket.patience <= 0) walkedOut.push(ticket);
  }
  if (walkedOut.length > 0) {
    queue.tickets = queue.tickets.filter((t) => t.patience > 0);
  }
  return walkedOut;
}

// The oldest ticket this plate can satisfy, or null.
export function matchingTicket(queue, plateItems) {
  for (const ticket of queue.tickets) {
    const dish = recipeById(ticket.dishId);
    if (dish && plateMatchesDish(plateItems, dish)) return ticket;
  }
  return null;
}

// Serve a ticket: coins = price + a tip for the patience left + a combo
// bonus of 2 coins per combo step. The tip rewards fast service — a ticket
// served with most of its patience left pays up to half its price again —
// so the player is always choosing between the quick small win and the
// bigger dish still cooking. Returns the payout breakdown.
export function serveTicket(queue, ticket, combo) {
  queue.tickets = queue.tickets.filter((t) => t.id !== ticket.id);
  const speed = Math.max(0, ticket.patience / ticket.patienceMax);
  const tip = Math.round(ticket.price * 0.5 * speed) + combo * 2;
  return { price: ticket.price, tip, total: ticket.price + tip, speed };
}
