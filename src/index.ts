import express, { Request, Response, Application } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { 
  DatabaseConfig, 
  PlayerScore, 
  TopPlayer, 
  InactivePlayer, 
  PopularGenre, 
  RecentPlayer, 
  FavoriteGame 
} from './types';

dotenv.config();


const PORT: number = parseInt(process.env.PORT || '3000', 10);

const dbConfig: DatabaseConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'game_studio',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

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
    
    res.status(200).json({
      success: true,
      data: result.rows as PlayerScore[],
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching players scores:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players scores'
    });
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
    
    res.status(200).json({
      success: true,
      data: result.rows as TopPlayer[],
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching top players:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top players'
    });
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
    
    res.status(200).json({
      success: true,
      data: result.rows as InactivePlayer[],
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching inactive players:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inactive players'
    });
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
    
    res.status(200).json({
      success: true,
      data: result.rows as PopularGenre[],
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching popular genres:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular genres'
    });
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
    
    res.status(200).json({
      success: true,
      data: result.rows as RecentPlayer[],
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching recent players:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent players'
    });
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
    
    res.status(200).json({
      success: true,
      data: result.rows as FavoriteGame[],
      count: result.rows.length
    });
  } catch (err) {
    console.error('Error fetching favorite games:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorite games'
    });
  }
});


app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
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