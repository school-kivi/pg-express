import express, { Request, Response, Application } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { z } from 'zod';
import { 
  DatabaseConfigSchema, 
  PlayerScoreSchema, 
  TopPlayerSchema, 
  InactivePlayerSchema, 
  PopularGenreSchema, 
  RecentPlayerSchema, 
  FavoriteGameSchema,
  type DatabaseConfig,
} from './types';
import { sendValidatedResponse, sendErrorResponse, validateDatabaseRows } from './middleware/responseHelpers';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  DB_USER: z.string().default('postgres'),
  DB_HOST: z.string().default('localhost'),
  DB_DATABASE: z.string().default('game_studio'),
  DB_PASSWORD: z.string().default('password'),
  DB_PORT: z.string().default('5432').transform(Number),
});

const env = EnvSchema.parse(process.env);

const PORT: number = env.PORT;

const dbConfig: DatabaseConfig = DatabaseConfigSchema.parse({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_DATABASE,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
});

const app: Application = express();
const pool: Pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Database connection error:', err);
});


app.use(express.json());

// Task 1
app.get('/players-scores', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        p.name as player_name,
        g.title as game_title,
        s.score
      FROM players p
      JOIN scores s ON p.id = s.player_id
      JOIN games g ON s.game_id = g.id
      ORDER BY p.name, s.score DESC
    `;
    
    const result = await pool.query(query);
    const validatedData = validateDatabaseRows(PlayerScoreSchema, result.rows);
    
    sendValidatedResponse(res, z.array(PlayerScoreSchema), validatedData);
  } catch (err) {
    console.error('Error fetching players scores:', err);
    sendErrorResponse(res, 'Failed to fetch players scores');
  }
});

// Task 2
app.get('/top-players', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        p.name as player_name,
        SUM(s.score) as total_score
      FROM players p
      JOIN scores s ON p.id = s.player_id
      GROUP BY p.id, p.name
      ORDER BY total_score DESC
      LIMIT 3
    `;
    
    const result = await pool.query(query);
    const validatedData = validateDatabaseRows(TopPlayerSchema, result.rows);
    
    sendValidatedResponse(res, z.array(TopPlayerSchema), validatedData);
  } catch (err) {
    console.error('Error fetching top players:', err);
    sendErrorResponse(res, 'Failed to fetch top players');
  }
});

// Task 3
app.get('/inactive-players', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.email,
        p.joined_date
      FROM players p
      LEFT JOIN scores s ON p.id = s.player_id
      WHERE s.player_id IS NULL
      ORDER BY p.joined_date DESC
    `;
    
    const result = await pool.query(query);
    const validatedData = validateDatabaseRows(InactivePlayerSchema, result.rows);
    
    sendValidatedResponse(res, z.array(InactivePlayerSchema), validatedData);
  } catch (err) {
    console.error('Error fetching inactive players:', err);
    sendErrorResponse(res, 'Failed to fetch inactive players');
  }
});

// Task 4
app.get('/popular-genres', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        g.genre,
        COUNT(s.id) as times_played
      FROM games g
      JOIN scores s ON g.id = s.game_id
      GROUP BY g.genre
      ORDER BY times_played DESC
    `;
    
    const result = await pool.query(query);
    const validatedData = validateDatabaseRows(PopularGenreSchema, result.rows);
    
    sendValidatedResponse(res, z.array(PopularGenreSchema), validatedData);
  } catch (err) {
    console.error('Error fetching popular genres:', err);
    sendErrorResponse(res, 'Failed to fetch popular genres');
  }
});

// Task 5
app.get('/recent-players', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.email,
        p.joined_date,
        EXTRACT(DAY FROM (NOW() - p.joined_date)) as days_since_joined
      FROM players p
      WHERE p.joined_date >= NOW() - INTERVAL '30 days'
      ORDER BY p.joined_date DESC
    `;
    
    const result = await pool.query(query);
    const validatedData = validateDatabaseRows(RecentPlayerSchema, result.rows);
    
    sendValidatedResponse(res, z.array(RecentPlayerSchema), validatedData);
  } catch (err) {
    console.error('Error fetching recent players:', err);
    sendErrorResponse(res, 'Failed to fetch recent players');
  }
});

// Task 6
app.get('/favorite-games', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      WITH player_game_counts AS (
        SELECT 
          p.name as player_name,
          g.title as game_title,
          COUNT(s.id) as times_played,
          ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY COUNT(s.id) DESC) as rn
        FROM players p
        JOIN scores s ON p.id = s.player_id
        JOIN games g ON s.game_id = g.id
        GROUP BY p.id, p.name, g.id, g.title
      )
      SELECT 
        player_name,
        game_title,
        times_played
      FROM player_game_counts
      WHERE rn = 1
      ORDER BY player_name
    `;
    
    const result = await pool.query(query);
    const validatedData = validateDatabaseRows(FavoriteGameSchema, result.rows);
    
    sendValidatedResponse(res, z.array(FavoriteGameSchema), validatedData);
  } catch (err) {
    console.error('Error fetching favorite games:', err);
    sendErrorResponse(res, 'Failed to fetch favorite games');
  }
});


app.use((req: Request, res: Response) => {
  sendErrorResponse(res, 'Endpoint not found', 404);
});

// Some extra things i wanted to add :)
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`API is running on PORT ${PORT}`);
});

export default app;