/**
 * Flat placeholder illustrations for the cake counter. Each cake is a stack of
 * layers, top to bottom: [height, colour]. When a cake in cafe-data.json gets an
 * `image`, the photo replaces this art with no layout change.
 */
export interface CakeArt {
  width: number;
  layers: Array<[number, string]>;
}

const stripes = (a: string, b: string, top: string): Array<[number, string]> => [
  [10, top],
  [16, a],
  [6, b],
  [16, a],
  [6, b],
  [14, a],
];

export const CAKE_ART: Record<string, CakeArt> = {
  "Basque Cheese": { width: 124, layers: [[14, "#4a2716"], [46, "#f0d49b"]] },
  "Maple Pecan": { width: 124, layers: [[16, "#6e3f1e"], [20, "#9c5f2e"], [14, "#d9a066"]] },
  "English Lemon Gateau": { width: 108, layers: stripes("#f2d86b", "#fff6dc", "#fff6dc") },
  "Espresso Tiramisu": {
    width: 108,
    layers: [[8, "#5c3a26"], [16, "#f2e3c8"], [12, "#8f5f3d"], [16, "#f2e3c8"], [12, "#8f5f3d"]],
  },
  "Red Velvet": { width: 108, layers: stripes("#a3253a", "#fbf6ee", "#fbf6ee") },
  "Matcha Red Bean": {
    width: 108,
    layers: [[8, "#f6f2e6"], [16, "#8ea65e"], [8, "#6e2e2b"], [16, "#8ea65e"], [8, "#f6f2e6"], [12, "#8ea65e"]],
  },
  "Earl Grey Lavender": { width: 108, layers: stripes("#c2b6cf", "#fbf8f2", "#ffffff") },
  "Blackout Chocolate": { width: 108, layers: stripes("#4a2c1e", "#241510", "#241510") },
  "Raspberry Lychee Rose": {
    width: 108,
    layers: [[10, "#e1546e"], [18, "#f6e4e6"], [8, "#f2b8c1"], [18, "#f6e4e6"], [8, "#c9a27a"]],
  },
};

export const FALLBACK_ART: CakeArt = { width: 110, layers: [[12, "#f2d4b0"], [40, "#e8b98a"]] };
