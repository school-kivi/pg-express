import { z } from 'zod';
import { Response } from 'express';

export const sendValidatedResponse = <T extends z.ZodType>(
  res: Response,
  schema: T,
  data: unknown,
  statusCode: number = 200
): void => {
  try {
    const validatedData = schema.parse(data);
    res.status(statusCode).json({
      success: true,
      data: validatedData,
      count: Array.isArray(validatedData) ? validatedData.length : undefined,
    });
  } catch (error) {
    console.error('Response validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Invalid response data format',
    });
  }
};

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: unknown
): void => {
  const response: { success: boolean; error: string; details?: unknown } = {
    success: false,
    error: message,
  };
  
  if (details) {
    response.details = details;
  }
  
  res.status(statusCode).json(response);
};

export const validateDatabaseConfig = () => {
  const configSchema = z.object({
    DB_USER: z.string().default('postgres'),
    DB_HOST: z.string().default('localhost'),
    DB_DATABASE: z.string().default('game_studio'),
    DB_PASSWORD: z.string().default('password'),
    DB_PORT: z.string().default('5432').transform(Number),
    PORT: z.string().default('3000').transform(Number),
  });

  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.error('Environment configuration validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
};

export const validateDatabaseRows = <T extends z.ZodType>(
  schema: T,
  rows: unknown[]
): z.infer<T>[] => {
  return rows.map((row, index) => {
    try {
      return schema.parse(row);
    } catch (error) {
      console.error(`Row ${index} validation failed:`, error);
      throw new Error(`Invalid data format in row ${index}`);
    }
  });
};