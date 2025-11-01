import * as SQLite from 'expo-sqlite';
import { PredictionResult, Detection } from '../types';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('durianapp.db');
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create predictions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        imageUri TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        modelUsed TEXT NOT NULL
      );
    `);

    // Create detections table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        predictionId TEXT NOT NULL,
        className TEXT NOT NULL,
        confidence REAL NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        FOREIGN KEY (predictionId) REFERENCES predictions (id)
      );
    `);

    console.log('Database tables created successfully');
  }

  async savePrediction(prediction: PredictionResult): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'INSERT INTO predictions (id, imageUri, timestamp, modelUsed) VALUES (?, ?, ?, ?)',
        [
          prediction.id,
          prediction.imageUri,
          prediction.timestamp.getTime(),
          prediction.modelUsed,
        ]
      );

      // Save detections
      for (const detection of prediction.detections) {
        await this.db.runAsync(
          `INSERT INTO detections 
           (predictionId, className, confidence, x, y, width, height) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            prediction.id,
            detection.className,
            detection.confidence,
            detection.boundingBox.x,
            detection.boundingBox.y,
            detection.boundingBox.width,
            detection.boundingBox.height,
          ]
        );
      }

      console.log('Prediction saved successfully:', prediction.id);
    } catch (error) {
      console.error('Failed to save prediction:', error);
      throw error;
    }
  }

  async getAllPredictions(): Promise<PredictionResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const predictions = await this.db.getAllAsync(
        'SELECT * FROM predictions ORDER BY timestamp DESC'
      ) as any[];

      const results: PredictionResult[] = [];

      for (const pred of predictions) {
        const detections = await this.db.getAllAsync(
          'SELECT * FROM detections WHERE predictionId = ?',
          [pred.id]
        ) as any[];

        const predictionResult: PredictionResult = {
          id: pred.id,
          imageUri: pred.imageUri,
          timestamp: new Date(pred.timestamp),
          modelUsed: pred.modelUsed,
          detections: detections.map((det: any) => ({
            className: det.className,
            confidence: det.confidence,
            boundingBox: {
              x: det.x,
              y: det.y,
              width: det.width,
              height: det.height,
            },
          })),
        };

        results.push(predictionResult);
      }

      return results;
    } catch (error) {
      console.error('Failed to get predictions:', error);
      throw error;
    }
  }

  async getPredictionById(id: string): Promise<PredictionResult | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const prediction = await this.db.getFirstAsync(
        'SELECT * FROM predictions WHERE id = ?',
        [id]
      ) as any;

      if (!prediction) return null;

      const detections = await this.db.getAllAsync(
        'SELECT * FROM detections WHERE predictionId = ?',
        [id]
      ) as any[];

      return {
        id: prediction.id,
        imageUri: prediction.imageUri,
        timestamp: new Date(prediction.timestamp),
        modelUsed: prediction.modelUsed,
        detections: detections.map((det: any) => ({
          className: det.className,
          confidence: det.confidence,
          boundingBox: {
            x: det.x,
            y: det.y,
            width: det.width,
            height: det.height,
          },
        })),
      };
    } catch (error) {
      console.error('Failed to get prediction by id:', error);
      throw error;
    }
  }

  async deletePrediction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM detections WHERE predictionId = ?', [id]);
      await this.db.runAsync('DELETE FROM predictions WHERE id = ?', [id]);
      console.log('Prediction deleted successfully:', id);
    } catch (error) {
      console.error('Failed to delete prediction:', error);
      throw error;
    }
  }

  async clearAllPredictions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM detections');
      await this.db.runAsync('DELETE FROM predictions');
      console.log('All predictions cleared successfully');
    } catch (error) {
      console.error('Failed to clear predictions:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalPredictions: number;
    totalDetections: number;
    averageConfidence: number;
    mostDetectedClass: string | null;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const totalPredictions = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM predictions'
      ) as any;

      const totalDetections = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM detections'
      ) as any;

      const avgConfidence = await this.db.getFirstAsync(
        'SELECT AVG(confidence) as avg FROM detections'
      ) as any;

      const mostDetected = await this.db.getFirstAsync(
        `SELECT className, COUNT(*) as count 
         FROM detections 
         GROUP BY className 
         ORDER BY count DESC 
         LIMIT 1`
      ) as any;

      return {
        totalPredictions: totalPredictions.count,
        totalDetections: totalDetections.count,
        averageConfidence: avgConfidence.avg || 0,
        mostDetectedClass: mostDetected?.className || null,
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('Database closed');
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();