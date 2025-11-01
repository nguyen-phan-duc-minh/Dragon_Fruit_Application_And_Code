import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';

import { HomeScreen } from './src/screens/HomeScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { LiveDetectionScreen } from './src/screens/LiveDetectionScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { databaseService } from './src/services/DatabaseService';
import { ScreenNames } from './src/types';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize database when app starts
    databaseService.initializeDatabase().catch(console.error);
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Durian Detection' }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{ title: 'Camera' }}
          />
          <Stack.Screen 
            name="LiveDetection" 
            component={LiveDetectionScreen}
            options={{ title: 'Live Detection' }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ title: 'History' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
