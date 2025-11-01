# Models Directory

Đặt các file model PyTorch (.pth) hoặc ONNX (.onnx) vào thư mục này.

## Supported Formats

- `.onnx` - ONNX Runtime models (Recommended)
- `.tflite` - TensorFlow Lite models
- `.pth` - PyTorch models (cần convert sang ONNX)

## Model Requirements

Để đảm bảo tương thích với app, model cần có:

1. **Input shape**: [1, 3, 640, 640] (NCHW format)
2. **Input type**: Float32
3. **Output format**: YOLO hoặc SSD detection format
4. **Classes**: Định nghĩa trong model metadata

## Example

```bash
# Đặt model vào thư mục này
assets/models/
├── durian_detection.onnx
├── fruit_classifier.onnx
└── README.md (this file)
```

## Usage

Sau khi đặt model vào thư mục, sử dụng ModelUtils để load:

```typescript
import { ModelUtils } from '../utils/ModelUtils';

// Load model from assets
const modelPath = await ModelUtils.copyModelToDocuments(
  require('./durian_detection.onnx'),
  'durian_detection.onnx'
);
```