// src/lib/fpl.ts
export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  team: string;       // Club name, e.g. "MCI"
  position: Position; // 'GK' | 'DEF' | 'MID' | 'FWD'
  price: number;      // in millions, e.g. 12.5
}

export const BUDGET_START = 100.0;

export const SQUAD_LIMITS: Record<Position, number> = {
  GK: 2,
  DEF: 5,
  MID: 5,
  FWD: 3,
};

export const TOTAL_SQUAD = Object.values(SQUAD_LIMITS).reduce((a, b) => a + b, 0); // 15

export const CLUB_CAP = 3; // Max from the same real club

export function formatMoney(n: number) {
  return `£${n.toFixed(1)}m`;
}

export function remainingBudget(selected: Player[]) {
  const spent = selected.reduce((sum, p) => sum + p.price, 0);
  return BUDGET_START - spent;
}

export function countBy<T extends string>(items: { [K in T]: string }[], key: T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const v = (item as any)[key] as string;
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
}
