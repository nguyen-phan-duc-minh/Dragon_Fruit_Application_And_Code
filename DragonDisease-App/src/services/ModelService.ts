import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Detection, ModelInfo, PredictionResult } from '../types';

export class ModelService {
  private session: InferenceSession | null = null;
  private modelInfo: ModelInfo | null = null;
  private isLoaded = false;

  async loadModel(modelPath: string): Promise<boolean> {
    try {
      console.log('Loading ONNX model from:', modelPath);
      
      // Check if model file exists
      const fileInfo = await FileSystem.getInfoAsync(modelPath);
      if (!fileInfo.exists) {
        throw new Error(`Model file not found at: ${modelPath}`);
      }

      // Load the ONNX model
      this.session = await InferenceSession.create(modelPath);
      
      // Set model info (you should adjust these based on your actual model)
      this.modelInfo = {
        name: 'Durian Detection Model',
        path: modelPath,
        inputSize: { width: 640, height: 640 },
        classes: ['durian', 'background'] // Adjust based on your model classes
      };

      this.isLoaded = true;
      console.log('Model loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load model:', error);
      this.isLoaded = false;
      return false;
    }
  }

  async preprocessImage(imageUri: string): Promise<Tensor> {
    try {
      if (!this.modelInfo) {
        throw new Error('Model not loaded');
      }

      // Resize image to model input size
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: this.modelInfo.inputSize.width,
              height: this.modelInfo.inputSize.height,
            },
          },
        ],
        { 
          format: SaveFormat.JPEG,
          compress: 1,
        }
      );

      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
        encoding: 'base64' as any,
      });

      // Convert base64 to tensor (this is a simplified version)
      // In a real implementation, you'd need to properly decode the image
      // and convert it to the format expected by your model (e.g., RGB float32)
      const imageData = this.base64ToFloat32Array(base64);
      
      const tensor = new Tensor('float32', imageData, [
        1, 
        3, 
        this.modelInfo.inputSize.height, 
        this.modelInfo.inputSize.width
      ]);

      return tensor;
    } catch (error) {
      console.error('Failed to preprocess image:', error);
      throw error;
    }
  }

  private base64ToFloat32Array(base64: string): Float32Array {
    // This is a simplified conversion
    // In practice, you'd need proper image decoding and normalization
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert to Float32Array and normalize (0-255 -> 0-1)
    const float32Array = new Float32Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      float32Array[i] = bytes[i] / 255.0;
    }

    return float32Array;
  }

  async predict(imageUri: string): Promise<PredictionResult> {
    try {
      if (!this.session || !this.modelInfo || !this.isLoaded) {
        throw new Error('Model not loaded');
      }

      console.log('Starting prediction for image:', imageUri);

      // Preprocess image
      const inputTensor = await this.preprocessImage(imageUri);

      // Run inference
      const feeds = { input: inputTensor }; // Adjust input name based on your model
      const results = await this.session.run(feeds);

      // Process outputs (this depends on your model's output format)
      const detections = this.processModelOutput(results);

      const predictionResult: PredictionResult = {
        id: Date.now().toString(),
        imageUri,
        detections,
        timestamp: new Date(),
        modelUsed: this.modelInfo.name,
      };

      console.log('Prediction completed:', predictionResult);
      return predictionResult;
    } catch (error) {
      console.error('Prediction failed:', error);
      throw error;
    }
  }

  private processModelOutput(results: any): Detection[] {
    // This is a mock implementation
    // You'll need to adjust this based on your model's actual output format
    // Common formats include YOLO, SSD, etc.
    
    const detections: Detection[] = [];
    
    // Mock detection for demonstration
    if (Math.random() > 0.3) { // 70% chance of detection
      detections.push({
        className: 'durian',
        confidence: 0.85 + Math.random() * 0.14, // 0.85-0.99
        boundingBox: {
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
          width: Math.random() * 200 + 150,
          height: Math.random() * 200 + 150,
        },
      });
    }

    return detections;
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  getModelInfo(): ModelInfo | null {
    return this.modelInfo;
  }

  async unloadModel(): Promise<void> {
    if (this.session) {
      await this.session.release();
      this.session = null;
    }
    this.modelInfo = null;
    this.isLoaded = false;
    console.log('Model unloaded');
  }
}

// Singleton instance
export const modelService = new ModelService();