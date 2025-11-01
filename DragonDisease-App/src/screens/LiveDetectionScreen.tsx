import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Detection } from '../types';
import { modelService } from '../services/ModelService';

interface LiveDetectionScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LiveDetectionScreen: React.FC<LiveDetectionScreenProps> = ({ navigation }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, setPermission] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const frameCount = useRef(0);
  const lastFpsUpdate = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      setPermission(cameraPermission);
    })();

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const startDetection = async () => {
    if (!modelService.isModelLoaded()) {
      Alert.alert('Model Not Loaded', 'Please load a model first');
      return;
    }

    setIsDetecting(true);
    detectionInterval.current = setInterval(async () => {
      await performDetection();
    }, 100); // Detection every 100ms (10 FPS)
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    setDetections([]);
    setFps(0);
  };

  const performDetection = async () => {
    if (!cameraRef.current) return;

    try {
      // Take a picture for analysis
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: true,
      });

      if (photo) {
        // Update FPS counter
        frameCount.current++;
        const now = Date.now();
        if (now - lastFpsUpdate.current >= 1000) {
          setFps(frameCount.current);
          frameCount.current = 0;
          lastFpsUpdate.current = now;
        }

        // Perform detection (using mock data for now)
        const mockDetections: Detection[] = [];
        
        // Simulate random detections
        if (Math.random() > 0.7) {
          mockDetections.push({
            className: 'durian',
            confidence: 0.75 + Math.random() * 0.24,
            boundingBox: {
              x: Math.random() * (screenWidth - 200),
              y: Math.random() * (screenHeight - 300) + 100,
              width: 150 + Math.random() * 100,
              height: 150 + Math.random() * 100,
            },
          });
        }

        setDetections(mockDetections);
      }
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity
          onPress={async () => {
            const result = await Camera.requestCameraPermissionsAsync();
            setPermission(result);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Live Detection</Text>
        <View style={styles.fpsContainer}>
          <Text style={styles.fpsText}>{fps} FPS</Text>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        >
          {/* Overlay for bounding boxes */}
          <Svg
            style={StyleSheet.absoluteFillObject}
            width={screenWidth}
            height={screenHeight}
          >
            {detections.map((detection, index) => (
              <React.Fragment key={index}>
                <Rect
                  x={detection.boundingBox.x}
                  y={detection.boundingBox.y}
                  width={detection.boundingBox.width}
                  height={detection.boundingBox.height}
                  fill="none"
                  stroke="#00FF00"
                  strokeWidth="3"
                />
                <SvgText
                  x={detection.boundingBox.x}
                  y={detection.boundingBox.y - 10}
                  fontSize="16"
                  fontWeight="bold"
                  fill="#00FF00"
                >
                  {`${detection.className} ${(detection.confidence * 100).toFixed(1)}%`}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.detectionButton,
                isDetecting ? styles.detectionButtonActive : {}
              ]}
              onPress={isDetecting ? stopDetection : startDetection}
            >
              <Ionicons
                name={isDetecting ? "stop" : "play"}
                size={30}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {detections.length > 0 && (
            <View style={styles.detectionInfo}>
              <Text style={styles.detectionText}>
                {detections.length} object(s) detected
              </Text>
            </View>
          )}
        </CameraView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  fpsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fpsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 15,
  },
  detectionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  detectionButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  detectionInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  detectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});