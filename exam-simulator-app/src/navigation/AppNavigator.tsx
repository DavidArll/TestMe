import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import UploadScreen from '../screens/UploadScreen';
import ExamListScreen from '../screens/ExamListScreen'; // Make sure this screen exists
import ExamExecutionScreen from '../screens/ExamExecutionScreen';
import ResultsScreen from '../screens/ResultsScreen';

export type RootStackParamList = {
  Upload: undefined; // Changed from UploadScreen
  ExamList: undefined; // Changed from ExamListScreen
  ExamExecution: undefined; // Changed from ExamExecutionScreen
  Results: undefined; // Changed from ResultsScreen
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Upload">
        <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload Exam' }} />
        <Stack.Screen name="ExamList" component={ExamListScreen} options={{ title: 'My Exams' }} />
        <Stack.Screen name="ExamExecution" component={ExamExecutionScreen} options={{ title: 'Exam' }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
