import { z } from 'zod';

// Base schemas for database entities
export const PlayerSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  joined_date: z.date().optional(),
});

export const GameSchema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().min(1).max(200),
  genre: z.string().min(1).max(50),
  release_date: z.date().optional(),
});

export const ScoreSchema = z.object({
  id: z.number().int().positive().optional(),
  player_id: z.number().int().positive(),
  game_id: z.number().int().positive(),
  score: z.number().int().min(0),
  played_at: z.date().optional(),
});

export const DatabaseConfigSchema = z.object({
  user: z.string().min(1),
  host: z.string().min(1),
  database: z.string().min(1),
  password: z.string(),
  port: z.number().int().positive().optional(),
});

// Response schemas for API endpoints
export const PlayerScoreSchema = z.object({
  player_name: z.string(),
  game_title: z.string(),
  score: z.union([z.number(), z.string()]).pipe(z.coerce.number().int()),
});

export const TopPlayerSchema = z.object({
  player_name: z.string(),
  total_score: z.union([z.number(), z.string()]).pipe(z.coerce.number().int()),
});

export const InactivePlayerSchema = z.object({
  id: z.union([z.number(), z.string()]).pipe(z.coerce.number().int()),
  name: z.string(),
  email: z.string().email(),
  joined_date: z.union([z.date(), z.string()]).pipe(z.coerce.date()),
});

export const PopularGenreSchema = z.object({
  genre: z.string(),
  times_played: z.union([z.number(), z.string()]).pipe(z.coerce.number().int()),
});

export const RecentPlayerSchema = z.object({
  id: z.union([z.number(), z.string()]).pipe(z.coerce.number().int()),
  name: z.string(),
  email: z.string().email(),
  joined_date: z.union([z.date(), z.string()]).pipe(z.coerce.date()),
  days_since_joined: z.union([z.number(), z.string()]).pipe(z.coerce.number()),
});

export const FavoriteGameSchema = z.object({
  player_name: z.string(),
  game_title: z.string(),
  times_played: z.union([z.number(), z.string()]).pipe(z.coerce.number().int()),
});

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema).optional(),
    count: z.number().int().optional(),
    error: z.string().optional(),
  });

export type Player = z.infer<typeof PlayerSchema>;
export type Game = z.infer<typeof GameSchema>;
export type Score = z.infer<typeof ScoreSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type PlayerScore = z.infer<typeof PlayerScoreSchema>;
export type TopPlayer = z.infer<typeof TopPlayerSchema>;
export type InactivePlayer = z.infer<typeof InactivePlayerSchema>;
export type PopularGenre = z.infer<typeof PopularGenreSchema>;
export type RecentPlayer = z.infer<typeof RecentPlayerSchema>;
export type FavoriteGame = z.infer<typeof FavoriteGameSchema>;