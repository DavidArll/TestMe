// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Alert } from 'react-native'; // Added Platform, Alert
import styled from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused, NavigationProp } from '@react-navigation/native';
import { ThemeContext, Theme } from '../context/ThemeContext'; // Ensure Theme is imported
import { AuthContext } from '../auth/AuthContext';
import { Exam } from '../types/exam';
import { RootStackParamList } from '../navigation/AppNavigator'; // Adjust path as needed

const Container = styled.View<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;

const HeaderView = styled.View<{ theme: Theme }>` // Added theme prop type
  padding: 15px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.borderColor};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const TitleText = styled.Text<{ color: string }>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color};
`;

const AuthButton = styled.TouchableOpacity<{ theme: Theme }>` // Added theme prop type
  padding: 8px 12px;
  border-radius: 5px;
  background-color: ${props => props.theme.primary};
`;

const AuthButtonText = styled.Text<{ theme: Theme }>`
  color: ${props => (props.theme.primary === props.theme.background && props.theme.mode === 'dark') 
                   ? '#FFFFFF' 
                   : (props.theme.mode === 'dark' ? props.theme.background : '#FFFFFF')};
  font-size: 14px;
  font-weight: bold;
`;

const ExamItemContainer = styled.TouchableOpacity<{ borderColor: string, theme: Theme }>`
  background-color: ${props => props.theme.cardBackground};
  padding: 15px;
  margin-vertical: 8px;
  margin-horizontal: 15px;
  border-radius: 5px;
  border: 1px solid ${props => props.borderColor};
`;

const ExamTitle = styled.Text<{ color: string }>`
  font-size: 18px;
  color: ${props => props.color};
`;

const EmptyListText = styled.Text<{ color: string }>`
  text-align: center;
  margin-top: 50px;
  font-size: 18px;
  color: ${props => props.color};
  padding: 20px;
`;

const HomeScreen: React.FC = () => {
  const { theme } = useContext(ThemeContext)!;
  const { isAuthenticated, currentUser } = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [publicExams, setPublicExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      // Simple browser alert for web. In a real app, use a modal or toast.
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadPublicExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const examsJson = await AsyncStorage.getItem('exams');
      if (examsJson) {
        const allExams: Exam[] = JSON.parse(examsJson);
        const filteredExams = allExams.filter(exam => exam.isPublic);
        setPublicExams(filteredExams);
      } else {
        setPublicExams([]);
      }
    } catch (e) {
      console.error('Failed to load public exams:', e);
      showAlert('Error Loading Exams', 'Could not retrieve public exams. Please try again later.');
      setPublicExams([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed showAlert from dependencies as it's stable if defined outside or correctly memoized

  useEffect(() => {
    if (isFocused) {
      loadPublicExams();
    }
  }, [isFocused, loadPublicExams]);


  const handleSelectExam = (exam: Exam) => {
    navigation.navigate('ExamExecution', { examId: exam.id });
  };

  const renderExamItem = ({ item }: { item: Exam }) => (
    <ExamItemContainer 
      onPress={() => handleSelectExam(item)}
      theme={theme} 
      borderColor={theme.borderColor || theme.accent} // Fallback for borderColor
    >
      <ExamTitle color={theme.text}>{item.title}</ExamTitle>
    </ExamItemContainer>
  );

  return (
    <Container backgroundColor={theme.background}>
      <HeaderView theme={theme}>
        <TitleText color={theme.text}>Public Exams</TitleText>
        {!isAuthenticated && (
          <AuthButton theme={theme} onPress={() => navigation.navigate('Login')}>
            <AuthButtonText theme={theme}>Login/Register</AuthButtonText>
          </AuthButton>
        )}
        {isAuthenticated && currentUser && (
            <AuthButton theme={theme} onPress={() => navigation.navigate('UserDashboard')}>
                <AuthButtonText theme={theme}>My Dashboard</AuthButtonText>
            </AuthButton>
        )}
      </HeaderView>
      
      {isLoading && publicExams.length === 0 ? (
        <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 20, flex: 1}}/>
      ) : (
        <FlatList
          data={publicExams}
          renderItem={renderExamItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<EmptyListText color={theme.text}>No public exams available at the moment. Check back later!</EmptyListText>}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadPublicExams} colors={[theme.primary]} tintColor={theme.primary}/>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </Container>
  );
};

export default HomeScreen;
