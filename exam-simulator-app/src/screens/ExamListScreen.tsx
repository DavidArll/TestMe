// src/screens/ExamListScreen.tsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons
import { ThemeContext, Theme } from '../context/ThemeContext'; // Import Theme
import { Exam } from '../types/exam';
import { RootStackParamList } from '../navigation/AppNavigator'; // Import for navigation prop typing

// Styled Components
const Container = styled.View<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
  /* padding: 10px; removed to allow HeaderView to span full width before padding content */
`;

const HeaderView = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 10px; /* Increased padding */
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.borderColor || '#ccc'};
`;

const TitleText = styled.Text<{ color: string }>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color};
`;

const AddNewButton = styled.TouchableOpacity`
  background-color: ${props => props.theme.primary};
  padding: 10px 15px;
  border-radius: 5px;
  margin-left: 5px; /* Added margin-left */
`;

const ButtonText = styled.Text<{ theme: Theme }>`
  color: ${props => (props.theme.primary === props.theme.background && props.theme.mode === 'dark') 
                     ? '#FFFFFF' 
                     : (props.theme.mode === 'dark' ? props.theme.background : '#FFFFFF')};
  font-size: 16px;
  font-weight: bold;
`;

const ExamItemContainer = styled.TouchableOpacity<{ borderColor: string, cardBackgroundColor: string }>`
  background-color: ${props => props.cardBackgroundColor};
  padding: 15px;
  margin: 8px 10px; /* Added horizontal margin */
  border-radius: 5px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${props => props.borderColor};
`;

const ExamTitle = styled.Text<{ color: string }>`
  font-size: 18px;
  color: ${props => props.color};
  flex: 1; 
  margin-right: 10px; /* Added margin to prevent text touching icon */
`;

const EmptyListText = styled.Text<{ color: string }>`
  text-align: center;
  margin-top: 50px;
  font-size: 18px;
  color: ${props => props.color};
  padding-horizontal: 20px; /* Added padding for better text wrapping */
`;

const DeleteButtonView = styled.TouchableOpacity`
  padding: 5px; 
`;


const ExamListScreen = () => {
  const { theme, toggleTheme } = useContext(ThemeContext); // Added toggleTheme
  const navigation = useNavigation<any>(); // Using any for now, can be typed with StackNavigationProp
  const isFocused = useIsFocused();

  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const examsJson = await AsyncStorage.getItem('exams');
      if (examsJson) {
        setExams(JSON.parse(examsJson));
      } else {
        setExams([]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load exams.');
      console.error(e);
      setExams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadExams();
    }
  }, [isFocused, loadExams]);

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
              const updatedExams = exams.filter(exam => exam.id !== examId);
              setExams(updatedExams);
              await AsyncStorage.setItem('exams', JSON.stringify(updatedExams));
              // Alert.alert('Success', 'Exam deleted.'); // Optional: can be noisy
            } catch (e) {
              Alert.alert('Error', 'Failed to delete exam.');
              console.error(e);
              loadExams(); 
            }
          },
        },
      ]
    );
  };
  
  const renderItem = ({ item }: { item: Exam }) => (
    <ExamItemContainer 
        onPress={() => handleSelectExam(item)} 
        theme={theme} 
        borderColor={theme.borderColor}
        cardBackgroundColor={theme.cardBackground} // Pass cardBackground
    >
      <ExamTitle color={theme.text} numberOfLines={1} ellipsizeMode="tail">{item.title}</ExamTitle>
      <DeleteButtonView onPress={() => handleDeleteExam(item.id)}>
        <MaterialIcons name="delete-outline" size={24} color={theme.danger || 'red'} />
      </DeleteButtonView>
    </ExamItemContainer>
  );

  if (isLoading && !exams.length) { 
    return (
      <Container backgroundColor={theme.background} style={{justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={theme.primary} />
      </Container>
    );
  }

  return (
    <Container backgroundColor={theme.background}>
      <HeaderView theme={theme}>
        <TitleText color={theme.text}>My Exams</TitleText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={toggleTheme} style={{ paddingHorizontal: 10, paddingVertical: 5 }}>
                <MaterialCommunityIcons 
                  name={theme.mode === 'dark' ? "weather-sunny" : "weather-night"} 
                  size={26} 
                  color={theme.text} 
                />
              </TouchableOpacity>
              <AddNewButton onPress={() => navigation.navigate('Upload')}>
                  <ButtonText theme={theme}>Add New</ButtonText> 
              </AddNewButton>
            </View>
      </HeaderView>
      <FlatList
        data={exams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<EmptyListText color={theme.text}>No exams found. Tap "Add New" to upload an exam.</EmptyListText>}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 5, paddingBottom: 10 }} // Added padding top/bottom
        refreshing={isLoading} 
        onRefresh={loadExams} 
      />
    </Container>
  );
};

export default ExamListScreen;
