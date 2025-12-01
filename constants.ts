import { Drill, Player, Team, Valence } from "./types";
import { Position } from "./types";

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

export const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "Lucas Silva", number: 10, position: Position.ALA_LEFT, photoUrl: "https://picsum.photos/200/200?random=1", dominantLeg: "Right", category: "U-15" },
  { id: "p2", name: "Matheus Costa", number: 5, position: Position.FIXO, photoUrl: "https://picsum.photos/200/200?random=2", dominantLeg: "Right", category: "U-15" },
  { id: "p3", name: "Gabriel Jesus", number: 9, position: Position.PIVO, photoUrl: "https://picsum.photos/200/200?random=3", dominantLeg: "Left", category: "U-15" },
  { id: "p4", name: "Rafael Santos", number: 1, position: Position.GOALKEEPER, photoUrl: "https://picsum.photos/200/200?random=4", dominantLeg: "Right", category: "U-15" },
  { id: "p5", name: "Enzo Ferrari", number: 7, position: Position.ALA_RIGHT, photoUrl: "https://picsum.photos/200/200?random=5", dominantLeg: "Right", category: "U-15" },
  { id: "p6", name: "Bruno Guimaraes", number: 8, position: Position.UNIVERSAL, photoUrl: "https://picsum.photos/200/200?random=6", dominantLeg: "Both", category: "U-15" },
];

export const MOCK_TEAMS: Team[] = [
  { id: "t1", name: "Tigers Academy U-15", category: "U-15", players: MOCK_PLAYERS },
  { id: "t2", name: "Lions Junior U-11", category: "U-11", players: [] },
];

export const MOCK_DRILLS: Drill[] = [
  {
    id: "d1",
    title: "3v2 Counter Attack",
    description: "High intensity counter-attack drill focusing on quick decision making and exploiting numerical superiority.",
    durationMin: 15,
    difficulty: "Intermediate",
    tags: ["Transition", "Shooting", "Passing"]
  },
  {
    id: "d2",
    title: "Rondo 4v1 Pressure",
    description: "Keep away game in a small square. 4 attackers vs 1 defender. Focus on one-touch passing and movement.",
    durationMin: 10,
    difficulty: "Beginner",
    tags: ["Passing", "Vision", "Warmup"]
  }
];
