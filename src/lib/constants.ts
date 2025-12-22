// Valence type definition
export interface Valence {
  id: string;
  name: string;
  category: "Technical" | "Tactical" | "Physical" | "Mental";
}

export const VALENCES: Valence[] = [
  { id: "v1", name: "Short Pass", category: "Technical" },
  { id: "v2", name: "Finishing", category: "Technical" },
  { id: "v3", name: "Dribbling (1v1)", category: "Technical" },
  { id: "v4", name: "Defensive Transition", category: "Tactical" },
  { id: "v5", name: "Offensive Transition", category: "Tactical" },
  { id: "v6", name: "Positioning", category: "Tactical" },
  { id: "v7", name: "Intensity", category: "Physical" },
  { id: "v8", name: "Focus", category: "Mental" },
];
