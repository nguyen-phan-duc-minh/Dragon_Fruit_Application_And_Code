import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenNames } from '../types';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: ScreenNames) => void;
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Durian Detection App</Text>
        <Text style={styles.subtitle}>AI-Powered Fruit Recognition</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.card, styles.primaryCard]}
          onPress={() => navigation.navigate('Camera')}
        >
          <Ionicons name="camera" size={60} color="#fff" />
          <Text style={styles.cardTitle}>Take Photo</Text>
          <Text style={styles.cardSubtitle}>Capture or select images for analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.secondaryCard]}
          onPress={() => navigation.navigate('LiveDetection')}
        >
          <Ionicons name="videocam" size={60} color="#fff" />
          <Text style={styles.cardTitle}>Live Detection</Text>
          <Text style={styles.cardSubtitle}>Real-time object detection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.tertiaryCard]}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="time" size={60} color="#fff" />
          <Text style={styles.cardTitle}>History</Text>
          <Text style={styles.cardSubtitle}>View past predictions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by PyTorch & ONNX</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  secondaryCard: {
    backgroundColor: '#34C759',
  },
  tertiaryCard: {
    backgroundColor: '#FF9500',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});