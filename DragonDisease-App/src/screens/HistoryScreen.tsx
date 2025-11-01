import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { PredictionResult } from '../types';
import { databaseService } from '../services/DatabaseService';

interface HistoryScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statistics, setStatistics] = useState({
    totalPredictions: 0,
    totalDetections: 0,
    averageConfidence: 0,
    mostDetectedClass: null as string | null,
  });

  useEffect(() => {
    loadPredictions();
    loadStatistics();
  }, []);

  const loadPredictions = async () => {
    try {
      const data = await databaseService.getAllPredictions();
      setPredictions(data);
    } catch (error) {
      console.error('Failed to load predictions:', error);
      Alert.alert('Error', 'Failed to load prediction history');
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await databaseService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPredictions();
    await loadStatistics();
    setRefreshing(false);
  }, []);

  const deletePrediction = async (id: string) => {
    Alert.alert(
      'Delete Prediction',
      'Are you sure you want to delete this prediction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deletePrediction(id);
              await loadPredictions();
              await loadStatistics();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete prediction');
            }
          },
        },
      ]
    );
  };

  const clearAllPredictions = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all prediction history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.clearAllPredictions();
              await loadPredictions();
              await loadStatistics();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear predictions');
            }
          },
        },
      ]
    );
  };

  const openPredictionDetail = (prediction: PredictionResult) => {
    setSelectedPrediction(prediction);
    setModalVisible(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderPredictionItem = ({ item }: { item: PredictionResult }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => openPredictionDetail(item)}
    >
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
      <View style={styles.predictionInfo}>
        <Text style={styles.predictionTitle}>
          {item.detections.length} object(s) detected
        </Text>
        <Text style={styles.predictionDate}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.predictionModel}>Model: {item.modelUsed}</Text>
        {item.detections.length > 0 && (
          <Text style={styles.predictionClasses}>
            Classes: {item.detections.map(d => d.className).join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deletePrediction(item.id)}
      >
        <Ionicons name="trash" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPredictionDetail = () => {
    if (!selectedPrediction) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Prediction Detail</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: selectedPrediction.imageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            
            {/* Bounding boxes overlay */}
            <Svg
              style={StyleSheet.absoluteFillObject}
              width="100%"
              height="100%"
              viewBox={`0 0 ${screenWidth} ${screenHeight * 0.6}`}
            >
              {selectedPrediction.detections.map((detection, index) => (
                <React.Fragment key={index}>
                  <Rect
                    x={detection.boundingBox.x}
                    y={detection.boundingBox.y}
                    width={detection.boundingBox.width}
                    height={detection.boundingBox.height}
                    fill="none"
                    stroke="#00FF00"
                    strokeWidth="2"
                  />
                  <SvgText
                    x={detection.boundingBox.x}
                    y={detection.boundingBox.y - 5}
                    fontSize="14"
                    fontWeight="bold"
                    fill="#00FF00"
                  >
                    {`${detection.className} ${(detection.confidence * 100).toFixed(1)}%`}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>

          <View style={styles.detailInfo}>
            <Text style={styles.detailTitle}>Detection Results</Text>
            <Text style={styles.detailText}>
              Date: {formatDate(selectedPrediction.timestamp)}
            </Text>
            <Text style={styles.detailText}>
              Model: {selectedPrediction.modelUsed}
            </Text>
            <Text style={styles.detailText}>
              Objects Detected: {selectedPrediction.detections.length}
            </Text>
            
            {selectedPrediction.detections.map((detection, index) => (
              <View key={index} style={styles.detectionItem}>
                <Text style={styles.detectionClass}>{detection.className}</Text>
                <Text style={styles.detectionConfidence}>
                  {(detection.confidence * 100).toFixed(1)}% confidence
                </Text>
                <Text style={styles.detectionBounds}>
                  Position: ({detection.boundingBox.x.toFixed(0)}, {detection.boundingBox.y.toFixed(0)})
                  Size: {detection.boundingBox.width.toFixed(0)}×{detection.boundingBox.height.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={clearAllPredictions} style={styles.clearButton}>
          <Ionicons name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.totalPredictions}</Text>
            <Text style={styles.statLabel}>Predictions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.totalDetections}</Text>
            <Text style={styles.statLabel}>Detections</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {(statistics.averageConfidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Avg Confidence</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {statistics.mostDetectedClass || 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Top Class</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={predictions}
        renderItem={renderPredictionItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="image-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No predictions yet</Text>
            <Text style={styles.emptySubtext}>
              Take some photos to see your detection history
            </Text>
          </View>
        }
      />

      {renderPredictionDetail()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
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
  statsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  list: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  predictionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  predictionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  predictionModel: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  predictionClasses: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
  },
  deleteButton: {
    padding: 10,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  imageContainer: {
    height: screenHeight * 0.6,
    backgroundColor: '#000',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  detailInfo: {
    flex: 1,
    padding: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  detectionItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  detectionClass: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detectionConfidence: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 2,
  },
  detectionBounds: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});