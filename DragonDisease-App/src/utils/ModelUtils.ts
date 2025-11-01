import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { modelService } from '../services/ModelService';

/**
 * Utility functions for model management
 */

export class ModelUtils {
  /**
   * Get documents directory path
   */
  private static getDocumentsDirectory(): string {
    // Use a type assertion to access documentDirectory
    const fs = FileSystem as any;
    return fs.documentDirectory || '';
  }

  /**
   * Copy model from assets to app documents directory
   */
  static async copyModelToDocuments(assetPath: string, fileName: string): Promise<string> {
    try {
      const asset = Asset.fromModule(assetPath);
      await asset.downloadAsync();
      
      const documentsDir = this.getDocumentsDirectory();
      if (!documentsDir) {
        throw new Error('Document directory not available');
      }
      const destinationPath = `${documentsDir}${fileName}`;
      
      // Copy file to documents directory
      await FileSystem.copyAsync({
        from: asset.localUri || asset.uri,
        to: destinationPath,
      });
      
      console.log(`Model copied to: ${destinationPath}`);
      return destinationPath;
    } catch (error) {
      console.error('Failed to copy model:', error);
      throw error;
    }
  }

  /**
   * Load model from URL and save to local storage
   */
  static async downloadAndLoadModel(modelUrl: string, fileName: string): Promise<boolean> {
    try {
      const documentsDir = this.getDocumentsDirectory();
      if (!documentsDir) {
        throw new Error('Document directory not available');
      }
      const localPath = `${documentsDir}${fileName}`;
      
      // Check if model already exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        console.log('Downloading model from:', modelUrl);
        
        const downloadResult = await FileSystem.downloadAsync(modelUrl, localPath);
        if (downloadResult.status !== 200) {
          throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
        
        console.log('Model downloaded to:', downloadResult.uri);
      } else {
        console.log('Model already exists at:', localPath);
      }
      
      // Load the model
      return await modelService.loadModel(localPath);
    } catch (error) {
      console.error('Failed to download and load model:', error);
      return false;
    }
  }

  /**
   * Get model file info
   */
  static async getModelInfo(fileName: string): Promise<any> {
    const documentsDir = this.getDocumentsDirectory();
    if (!documentsDir) {
      throw new Error('Document directory not available');
    }
    const modelPath = `${documentsDir}${fileName}`;
    return await FileSystem.getInfoAsync(modelPath);
  }

  /**
   * Delete model file
   */
  static async deleteModel(fileName: string): Promise<void> {
    try {
      const documentsDir = this.getDocumentsDirectory();
      if (!documentsDir) {
        throw new Error('Document directory not available');
      }
      const modelPath = `${documentsDir}${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(modelPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(modelPath);
        console.log('Model deleted:', modelPath);
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
      throw error;
    }
  }

  /**
   * List all model files in documents directory
   */
  static async listModels(): Promise<string[]> {
    try {
      const documentsDir = this.getDocumentsDirectory();
      if (!documentsDir) {
        throw new Error('Document directory not available');
      }
      const files = await FileSystem.readDirectoryAsync(documentsDir);
      
      // Filter for model files (assuming .onnx extension)
      return files.filter(file => file.endsWith('.onnx') || file.endsWith('.tflite'));
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }
}

/**
 * Example usage in a component:
 * 
 * useEffect(() => {
 *   const initModel = async () => {
 *     try {
 *       // Option 1: Load from assets
 *       const modelPath = await ModelUtils.copyModelToDocuments(
 *         require('../../assets/models/durian_model.onnx'),
 *         'durian_model.onnx'
 *       );
 *       await modelService.loadModel(modelPath);
 * 
 *       // Option 2: Download from URL
 *       // await ModelUtils.downloadAndLoadModel(
 *       //   'https://example.com/models/durian_model.onnx',
 *       //   'durian_model.onnx'
 *       // );
 *     } catch (error) {
 *       console.error('Model initialization failed:', error);
 *     }
 *   };
 *   
 *   initModel();
 * }, []);
 */