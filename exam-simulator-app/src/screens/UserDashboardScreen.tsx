// src/screens/UserDashboardScreen.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert, // Added Alert
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform // Added Platform
} from 'react-native';
import styled from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused, NavigationProp } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons
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

const ActionButton = styled.TouchableOpacity<{ theme: Theme }>` // Added theme prop type
  padding: 8px 12px;
  border-radius: 5px;
  background-color: ${props => props.theme.primary};
  margin-left: 10px;
`;

const ButtonText = styled.Text<{ theme: Theme }>`
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
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ExamTitle = styled.Text<{ color: string }>`
  font-size: 18px;
  color: ${props => props.color};
  flex: 1; 
`;

const DeleteButtonView = styled.TouchableOpacity`
  padding: 5px;
`;

const EmptyListText = styled.Text<{ color: string }>`
  text-align: center;
  margin-top: 50px;
  font-size: 18px;
  color: ${props => props.color};
  padding: 20px;
`;

const UserDashboardScreen: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext)!;
  const { currentUser, logout, isLoading: authLoading } = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();

  const [userExams, setUserExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const loadUserExams = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const examsJson = await AsyncStorage.getItem('exams');
      if (examsJson) {
        const allExams: Exam[] = JSON.parse(examsJson);
        const filteredExams = allExams.filter(exam => exam.userId === currentUser.id);
        setUserExams(filteredExams);
      } else {
        setUserExams([]);
      }
    } catch (e) {
      console.error('Failed to load user exams:', e);
      showAlert('Error Loading Exams', 'Could not retrieve your exams. Please try again later.');
      setUserExams([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Removed primaryLang, showAlert from dependencies

  useEffect(() => {
    if (isFocused && currentUser) {
      loadUserExams();
    }
    if (!currentUser && !authLoading && isFocused) { // If user logs out or no user and screen is focused
        navigation.navigate('Home');
    }
  }, [isFocused, currentUser, loadUserExams, authLoading, navigation]);

  const handleSelectExam = (exam: Exam) => {
    navigation.navigate('ExamExecution', { examId: exam.id });
  };

  const handleDeleteExam = (examId: string) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically update UI
              setUserExams(prevExams => prevExams.filter(exam => exam.id !== examId));
              
              // Update the global list in AsyncStorage
              const allExamsJson = await AsyncStorage.getItem('exams');
              let allExams: Exam[] = allExamsJson ? JSON.parse(allExamsJson) : [];
              allExams = allExams.filter(exam => exam.id !== examId);
              await AsyncStorage.setItem('exams', JSON.stringify(allExams));
              // No need for showAlert success here, UI update is enough
            } catch (e) {
              showAlert('Error', 'Failed to delete exam. Please try refreshing.');
              console.error(e);
              loadUserExams(); // Revert optimistic update by reloading
            }
          },
        },
      ]
    );
  };

  const renderExamItem = ({ item }: { item: Exam }) => (
    <ExamItemContainer 
        onPress={() => handleSelectExam(item)}
        theme={theme} 
        borderColor={theme.borderColor || theme.accent} // Fallback for borderColor
    >
      <View style={{flex: 1, marginRight: 8}}>
        <ExamTitle color={theme.text} numberOfLines={1} ellipsizeMode="tail">{item.title}</ExamTitle>
        <Text style={{color: theme.textMuted, fontSize: 12}}>Status: {item.isPublic ? 'Public' : 'Private'}</Text>
      </View>
      <DeleteButtonView onPress={() => handleDeleteExam(item.id)}>
        <MaterialIcons name="delete-outline" size={24} color={theme.danger || 'red'} />
      </DeleteButtonView>
    </ExamItemContainer>
  );

  // This condition handles initial loading of auth state AND if user becomes null (logged out)
  if (authLoading || !currentUser) { 
    return (
        <Container backgroundColor={theme.background}>
            <ActivityIndicator size="large" color={theme.primary} style={{flex: 1}} />
        </Container>
    );
  }

  return (
    <Container backgroundColor={theme.background}>
      <HeaderView theme={theme}>
        <TitleText color={theme.text}>My Dashboard</TitleText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={toggleTheme} style={{ paddingHorizontal: 10 }}>
                <MaterialCommunityIcons 
                    name={theme.mode === 'dark' ? "weather-sunny" : "weather-night"} 
                    size={26} 
                    color={theme.text} 
                />
            </TouchableOpacity>
            <ActionButton theme={theme} onPress={() => navigation.navigate('Upload')}>
                <ButtonText theme={theme}>Upload Exam</ButtonText>
            </ActionButton>
            <ActionButton theme={theme} onPress={logout} style={{backgroundColor: theme.danger}}>
                <ButtonText theme={theme}>Logout</ButtonText>
            </ActionButton>
        </View>
      </HeaderView>
      
      {isLoading && userExams.length === 0 ? ( // Show loader if loading exams and list is empty
         <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 20, flex:1}}/>
      ) : (
        <FlatList
          data={userExams}
          renderItem={renderExamItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={<EmptyListText color={theme.text}>You haven't uploaded any exams yet. Tap "Upload Exam" to get started!</EmptyListText>}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadUserExams} colors={[theme.primary]} tintColor={theme.primary}/>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </Container>
  );
};

export default UserDashboardScreen;
