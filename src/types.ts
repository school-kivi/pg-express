interface Player {
  id?: number;
  name: string;
  email: string;
  joined_date?: Date;
}

interface Game {
  id?: number;
  title: string;
  genre: string;
  release_date?: Date;
}

interface Score {
  id?: number;
  player_id: number;
  game_id: number;
  score: number;
  played_at?: Date;
}

interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port?: number;
}

// Response types for API endpoints
interface PlayerScore {
  player_name: string;
  game_title: string;
  score: number;
}

interface TopPlayer {
  player_name: string;
  total_score: number;
}

interface InactivePlayer {
  id: number;
  name: string;
  email: string;
  joined_date: Date;
}

interface PopularGenre {
  genre: string;
  times_played: number;
}

interface RecentPlayer {
  id: number;
  name: string;
  email: string;
  joined_date: Date;
  days_since_joined: number;
}

interface FavoriteGame {
  player_name: string;
  game_title: string;
  times_played: number;
}

export { 
  Player, 
  Game, 
  Score, 
  DatabaseConfig,
  PlayerScore,
  TopPlayer,
  InactivePlayer,
  PopularGenre,
  RecentPlayer,
  FavoriteGame
};