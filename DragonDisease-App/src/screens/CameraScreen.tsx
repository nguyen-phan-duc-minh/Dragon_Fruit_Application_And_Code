import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraComponent } from '../components/CameraComponent';
import { PredictionResult } from '../types';
import { modelService } from '../services/ModelService';
import { databaseService } from '../services/DatabaseService';

interface CameraScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageCaptured = (imageUri: string) => {
    setCapturedImages(prev => [...prev, imageUri]);
    // Auto-analyze the image
    analyzeImage(imageUri);
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      // Try to use actual model service if available
      let predictionResult: PredictionResult;
      
      if (modelService.isModelLoaded()) {
        predictionResult = await modelService.predict(imageUri);
      } else {
        // Fallback to mock prediction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        predictionResult = {
          id: Date.now().toString(),
          imageUri,
          detections: [
            {
              className: 'Durian',
              confidence: 0.89,
              boundingBox: { x: 100, y: 150, width: 200, height: 180 }
            }
          ],
          timestamp: new Date(),
          modelUsed: 'durian_detection_v1.onnx'
        };
      }
      
      // Save to database
      await databaseService.savePrediction(predictionResult);
      
      setPredictions(prev => [...prev, predictionResult]);
      Alert.alert('Analysis Complete', `Found ${predictionResult.detections.length} objects`);
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImages = () => {
    setCapturedImages([]);
    setPredictions([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Camera</Text>
        <TouchableOpacity onPress={clearImages} style={styles.clearButton}>
          <Ionicons name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraComponent onImageCaptured={handleImageCaptured} />
      </View>

      {capturedImages.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Captured Images ({capturedImages.length})
          </Text>
          
          {isAnalyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Analyzing image...</Text>
            </View>
          )}
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {capturedImages.map((imageUri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.thumbnail} />
                {predictions[index] && (
                  <View style={styles.predictionInfo}>
                    <Text style={styles.predictionText}>
                      {predictions[index].detections.length} objects detected
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  cameraContainer: {
    flex: 1,
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
    maxHeight: 200,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  predictionInfo: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  predictionText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
});