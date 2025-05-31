// src/screens/ExamExecutionScreen.tsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, Theme } from '../context/ThemeContext';
import { Exam, Question, OptionValue, LangSpecificText } from '../types/exam';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './ResultsScreen'; // Using RootStackParamList from ResultsScreen for now

type ExamExecutionScreenRouteProp = RouteProp<RootStackParamList, 'ExamExecution'>;
type ExamExecutionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExamExecution'>;


// Styled Components
const StyledContainer = styled.ScrollView<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
  /* padding: 20px; Moved to contentContainerStyle */
`;
const LoadingText = styled.Text<{ color: string }>`
    font-size: 18px;
    color: ${props => props.color};
    text-align: center;
    margin-top: 50px;
`;
const ProgressText = styled.Text<{ color: string }>`
  font-size: 16px;
  color: ${props => props.color};
  text-align: center;
  margin-bottom: 10px;
  padding-top: 10px; /* Added padding top */
`;
const QuestionText = styled.Text<{ color: string }>`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 10px;
  padding-horizontal: 20px; /* Added horizontal padding */
`;
const SubtitleText = styled.Text<{ color: string }>`
  font-size: 16px;
  font-style: italic;
  color: ${props => props.color};
  margin-bottom: 20px;
  padding-horizontal: 20px; /* Added horizontal padding */
`;
const OptionContainer = styled.TouchableOpacity<{ selected: boolean; theme: Theme }>`
  background-color: ${props => props.selected ? props.theme.primary : props.theme.cardBackground};
  padding: 15px;
  margin-vertical: 5px;
  margin-horizontal: 20px; /* Added horizontal margin */
  border-radius: 5px;
  border: 1px solid ${props => props.selected ? props.theme.primary : props.theme.borderColor};
`;
const OptionText = styled.Text<{ selected: boolean; theme: Theme }>`
  font-size: 18px;
  color: ${props => props.selected ? (props.theme.mode === 'dark' ? props.theme.text : props.theme.buttonText) : props.theme.text};
`;
const OptionSubtitleText = styled.Text<{ selected: boolean; theme: Theme }>`
  font-size: 14px;
  font-style: italic;
  color: ${props => props.selected ? (props.theme.mode === 'dark' ? props.theme.textMuted : props.theme.buttonText) : props.theme.textMuted || '#888'};
   margin-top: 4px;
`;

const TextInputStyled = styled.TextInput<{ theme: Theme }>`
  border: 1px solid ${props => props.theme.borderColor};
  background-color: ${props => props.theme.cardBackground};
  color: ${props => props.theme.text};
  padding: 10px;
  border-radius: 5px;
  font-size: 16px;
  min-height: 100px;
  text-align-vertical: top;
  margin-bottom: 20px;
  margin-horizontal: 20px; /* Added horizontal margin */
`;
const NavigationControlsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
  margin-bottom: 40px;
  padding-horizontal: 20px; /* Added horizontal padding */
`;
const NavButton = styled.TouchableOpacity<{ theme: Theme, disabled?: boolean }>`
  background-color: ${props => props.disabled ? props.theme.disabled : props.theme.primary};
  padding: 15px 25px;
  border-radius: 5px;
  opacity: ${props => props.disabled ? 0.6 : 1};
  min-width: 120px;
  align-items: center;
`;
const NavButtonText = styled.Text<{ theme: Theme, disabled?: boolean }>` /* Added disabled prop */
  color: ${props => props.disabled ? (props.theme.mode === 'dark' ? props.theme.textMuted : '#a0a0a0') : props.theme.buttonText};
  font-size: 16px;
  font-weight: bold;
`;


const ExamExecutionScreen = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<ExamExecutionScreenNavigationProp>();
  const route = useRoute<ExamExecutionScreenRouteProp>();
  const { examId } = route.params;

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | OptionValue>>({});
  const [selectedOption, setSelectedOption] = useState<OptionValue | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const loadExamDetails = async () => {
      setIsLoading(true);
      try {
        const examsJson = await AsyncStorage.getItem('exams');
        if (!examsJson) throw new Error('No exams found in storage.');
        const allExams: Exam[] = JSON.parse(examsJson);
        const foundExam = allExams.find(e => e.id === examId);
        if (foundExam) {
          setExam(foundExam);
          setUserAnswers({});
          startTimeRef.current = Date.now();
        } else {
          Alert.alert('Error', 'Exam not found.');
          navigation.goBack();
        }
      } catch (e: any) {
        Alert.alert('Error', `Failed to load exam details: ${e.message}`);
        console.error(e);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    loadExamDetails();
  }, [examId, navigation]);

  useEffect(() => {
    if (exam && exam.questions && exam.questions[currentQuestionIndex]) {
      const currentQ = exam.questions[currentQuestionIndex];
      const existingAnswer = userAnswers[currentQ.id.toString()];

      if (currentQ.type === 'multiple-choice') {
        setSelectedOption(existingAnswer ? existingAnswer : null);
        setOpenAnswer('');
      } else if (currentQ.type === 'open-ended') {
        setOpenAnswer(existingAnswer as string || '');
        setSelectedOption(null);
      }
    } else {
        setSelectedOption(null);
        setOpenAnswer('');
    }
  }, [currentQuestionIndex, exam, userAnswers]);

  const currentQuestion = exam?.questions[currentQuestionIndex];

  const getLangSpecificText = (textObj: string | LangSpecificText | OptionValue, lang: string, fallbackLang?: string): string => {
    if (typeof textObj === 'string') return textObj;
    if (textObj && typeof textObj === 'object') {
        if (textObj[lang]) return textObj[lang];
        if (fallbackLang && textObj[fallbackLang]) return textObj[fallbackLang];
        const availableLangs = Object.keys(textObj);
        if (availableLangs.length > 0) return textObj[availableLangs[0]];
    }
    return "Text not available";
  };

  const handleSelectOption = (optionValue: OptionValue) => {
    setSelectedOption(optionValue);
    if (currentQuestion) {
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id.toString()]: optionValue }));
    }
  };

  const handleOpenAnswerChange = (text: string) => {
    setOpenAnswer(text);
     if (currentQuestion) {
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id.toString()]: text }));
    }
  };

  const handleNextQuestion = () => {
    if (!exam || !currentQuestion) return;
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinishExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishExam = () => {
    if (!exam || !startTimeRef.current) return;
    const duration = Date.now() - startTimeRef.current;

    console.log('[ExamExecutionScreen] Finishing exam. Data to pass:');
    console.log('Exam Title:', JSON.stringify(exam?.title)); // Log title
    console.log('Exam Questions (sample):', JSON.stringify(exam?.questions?.slice(0, 2))); // Log first 2 questions
    console.log('User Answers:', JSON.stringify(userAnswers));
    console.log('Duration (ms):', duration);

    if (!exam || typeof userAnswers === 'undefined' || typeof duration === 'undefined') {
      Alert.alert('Debug Error', 'Missing data before navigating to Results. Check console.');
      return; // Prevent navigation if critical data is missing
    }

    navigation.replace('Results', { exam, userAnswers, duration }); // Use replace to prevent going back to exam
  };

  if (isLoading || !exam) {
    return <StyledContainer backgroundColor={theme.background} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}><LoadingText color={theme.text}>Loading Exam...</LoadingText></StyledContainer>;
  }
  if (!currentQuestion) {
     return <StyledContainer backgroundColor={theme.background} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}><LoadingText color={theme.text}>Error: Question not found.</LoadingText></StyledContainer>;
  }

  const isMultilingual = !!exam.language?.secondary && exam.language?.primary !== exam.language?.secondary;
  const primaryLang = exam.language?.primary || 'en'; // Default to 'en' if not specified
  const secondaryLang = exam.language?.secondary;

  const questionMainText = getLangSpecificText(currentQuestion.question, primaryLang);
  const questionSubText = isMultilingual && secondaryLang ? getLangSpecificText(currentQuestion.question, secondaryLang, primaryLang) : null;

  return (
    <StyledContainer backgroundColor={theme.background} contentContainerStyle={{ paddingBottom: 20 }}>
      <ProgressText color={theme.text}>
        Question {currentQuestionIndex + 1} of {exam.questions.length}
      </ProgressText>

      <QuestionText color={theme.text}>
        {questionMainText}
      </QuestionText>
      {isMultilingual && questionSubText && questionSubText !== questionMainText && (
        <SubtitleText color={theme.textMuted || '#666'}>
          {questionSubText}
        </SubtitleText>
      )}

      {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
        <View>
          {(currentQuestion.options as OptionValue[]).map((optionItem: OptionValue, index: number) => {
            const optionMainText = getLangSpecificText(optionItem, primaryLang);
            const optionSubText = isMultilingual && secondaryLang ? getLangSpecificText(optionItem, secondaryLang, primaryLang) : null;

            let isSelected = false;
            if(selectedOption){
                const selectedOptionMainText = getLangSpecificText(selectedOption, primaryLang);
                isSelected = selectedOptionMainText === optionMainText;
            }

            return (
              <OptionContainer
                key={index}
                selected={isSelected}
                onPress={() => handleSelectOption(optionItem)}
                theme={theme}
              >
                <OptionText selected={isSelected} theme={theme}>
                    {optionMainText}
                </OptionText>
                {isMultilingual && optionSubText && optionSubText !== optionMainText && (
                     <OptionSubtitleText selected={isSelected} theme={theme}>
                        {optionSubText}
                     </OptionSubtitleText>
                )}
              </OptionContainer>
            );
          })}
        </View>
      )}

      {currentQuestion.type === 'open-ended' && (
        <TextInputStyled
          value={openAnswer}
          onChangeText={handleOpenAnswerChange}
          placeholder="Type your answer here..."
          placeholderTextColor={theme.textMuted || '#999'}
          multiline
          numberOfLines={4}
          theme={theme}
        />
      )}

      <NavigationControlsContainer>
        <NavButton theme={theme} onPress={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
          <NavButtonText theme={theme} disabled={currentQuestionIndex === 0}>Previous</NavButtonText>
        </NavButton>
        <NavButton theme={theme} onPress={handleNextQuestion}>
          <NavButtonText theme={theme}>
            {currentQuestionIndex === exam.questions.length - 1 ? 'Finish' : 'Next'}
          </NavButtonText>
        </NavButton>
      </NavigationControlsContainer>
    </StyledContainer>
  );
};

export default ExamExecutionScreen;
