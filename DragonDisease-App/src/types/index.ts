export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  className: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface PredictionResult {
  id: string;
  imageUri: string;
  detections: Detection[];
  timestamp: Date;
  modelUsed: string;
}

export interface ModelInfo {
  name: string;
  path: string;
  inputSize: {
    width: number;
    height: number;
  };
  classes: string[];
}

export type ScreenNames = 'Home' | 'Camera' | 'History' | 'LiveDetection';