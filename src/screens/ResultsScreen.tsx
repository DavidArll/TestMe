/* // src/screens/ResultsScreen.tsx
import React, { useContext, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native'; // Added Platform
import styled from 'styled-components/native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ThemeContext, Theme } from '../context/ThemeContext';
import { Exam, Question, OptionValue, LangSpecificText } from '../types/exam';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system'; // Added FileSystem
import * as Sharing from 'expo-sharing'; // Added Sharing

// Assuming RootStackParamList is defined (e.g. in a central types file or AppNavigator)
export type RootStackParamList = {
    ExamList: undefined;
    Upload: undefined;
    ExamExecution: { examId: string };
    Results: { exam: Exam; userAnswers: Record<string, string | OptionValue>; duration: number };
};
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;
type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;

// Styled Components (assuming these are defined as in the previous step)
const StyledContainer = styled.ScrollView<{ backgroundColor: string }>`
  flex: 1;
  background-color: ${props => props.backgroundColor};
`;
const ContentPadding = styled.View`
  padding: 20px;
`;
const HeaderText = styled.Text<{ color: string }>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 8px;
  text-align: center;
`;
const InfoText = styled.Text<{ color: string }>`
  font-size: 16px;
  color: ${props => props.color};
  margin-bottom: 15px;
  text-align: center;
`;
const SectionTitleText = styled.Text<{ color: string; theme: Theme }>`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.color};
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.borderColor};
  padding-bottom: 5px;
`;
const QuestionBlock = styled.View<{ theme: Theme }>`
  margin-bottom: 20px;
  padding: 15px;
  background-color: ${props => props.theme.cardBackground};
  border-radius: 5px;
  border: 1px solid ${props => props.theme.borderColor};
`;
const QuestionTitleText = styled.Text<{ color: string }>`
  font-size: 17px;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 5px;
`;
const QuestionSubtitleText = styled.Text<{ color: string }>`
  font-size: 14px;
  font-style: italic;
  color: ${props => props.color};
  margin-bottom: 8px;
`;
const AnswerLabelText = styled.Text<{ color: string }>`
  font-size: 15px;
  font-weight: bold;
  color: ${props => props.color};
  margin-top: 8px;
`;
const AnswerText = styled.Text<{ color: string }>`
  font-size: 15px;
  color: ${props => props.color};
  margin-left: 10px;
  margin-bottom: 5px;
`;
const ResultIndicatorText = styled.Text<{ theme: Theme; isCorrect: boolean }>`
  font-size: 15px;
  font-weight: bold;
  color: ${props => props.isCorrect ? props.theme.accent : props.theme.danger};
  margin-left: 10px;
`;
const ScoreText = styled.Text<{ color: string }>`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.color};
  text-align: center;
  margin-vertical: 15px;
`;
const ButtonContainer = styled.View`
  margin-top: 20px;
  margin-bottom: 30px;
  flex-direction: row;
  justify-content: space-around;
`;
const StyledButton = styled.TouchableOpacity<{ theme: Theme; secondary?: boolean }>`
  background-color: ${props => props.secondary ? props.theme.cardBackground : props.theme.primary};
  padding: 12px 20px;
  border-radius: 5px;
  border: 1px solid ${props => props.secondary ? props.theme.primary : 'transparent'};
  align-items: center;
  min-width: 120px;
`;
const ButtonText = styled.Text<{ theme: Theme; secondary?: boolean; disabled?: boolean }>`
  color: ${props => {
    if (props.secondary) {
      return props.theme.primary; // For secondary button, text is primary color
    }
    if (props.disabled) {
      return props.theme.textMuted; // For disabled button, text is muted
    }
    // For primary, non-disabled button, text should contrast with theme.primary background
    // This logic is similar to other ButtonText components (e.g., UploadScreen)
    return (props.theme.primary === props.theme.background && props.theme.mode === 'dark')
           ? '#FFFFFF'
           : (props.theme.mode === 'dark' ? props.theme.background : '#FFFFFF');
  }};
  font-size: 16px;
  font-weight: bold;
`;

// Utility functions
const getLangSpecificText = (textObj: string | LangSpecificText | OptionValue | undefined, lang: string, fallbackLang?: string): string => {
    if (typeof textObj === 'string') return textObj;
    if (textObj && typeof textObj === 'object') {
        if (lang in textObj) return (textObj as LangSpecificText)[lang];
        if (fallbackLang && fallbackLang in textObj) return (textObj as LangSpecificText)[fallbackLang];
        const availableLangs = Object.keys(textObj);
        if (availableLangs.length > 0) return (textObj as LangSpecificText)[availableLangs[0]];
    }
    return typeof textObj === 'undefined' ? "N/A" : "Text not available";
};

const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ResultsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const route = useRoute<ResultsScreenRouteProp>();

  console.log('[ResultsScreen] Received route params:', JSON.stringify(route.params, null, 2));

  // Handle case where params might be undefined if navigated to incorrectly
  if (!route.params) {
    console.error('[ResultsScreen] Error: route.params is undefined!');
      return (
          <StyledContainer backgroundColor={theme.background}>
              <ContentPadding>
                <HeaderText color={theme.text}>Error</HeaderText>
                <InfoText color={theme.text}>No results data found. Please try taking an exam again.</InfoText>
                <StyledButton theme={theme} onPress={() => navigation.navigate('ExamList')}>
                    <ButtonText theme={theme}>Back to Exams</ButtonText>
                </StyledButton>
              </ContentPadding>
          </StyledContainer>
      );
  }

  const { exam, userAnswers, duration } = route.params; // Assuming params are guaranteed by navigation call (already checked by !route.params)

  console.log('[ResultsScreen] Destructured exam title:', JSON.stringify(exam?.title));
  console.log('[ResultsScreen] Destructured userAnswers keys:', JSON.stringify(userAnswers ? Object.keys(userAnswers) : null));
  console.log('[ResultsScreen] Destructured duration:', duration);

  // Add a specific check for critical data needed for rendering:
  if (!exam || !exam.questions || !userAnswers || typeof duration === 'undefined') {
      console.error('[ResultsScreen] Critical data missing after destructuring. Exam:', !!exam, 'Questions:', !!exam?.questions, 'UserAnswers:', !!userAnswers, 'Duration Defined:', typeof duration !== 'undefined');
      // Optionally, you could set an error state here to render a message to the user.
      // For now, the console error is the primary goal for debugging.
      // The existing UI might show minimal info or crash, this log helps identify why.
  }

  const primaryLang = exam.language?.primary || 'en';
  const secondaryLang = exam.language?.secondary;
  const isMultilingual = !!secondaryLang && primaryLang !== secondaryLang;

  const scoreData = useMemo(() => {
    if (!exam.includeAnswerKey) return null;
    let correctCount = 0;
    let scorableQuestions = 0;
    exam.questions.forEach(q => {
      if (q.answerKey !== undefined && q.answerKey !== null) {
        scorableQuestions++;
        const userAnswer = userAnswers[q.id.toString()];
        const correctAnswerPrimLang = getLangSpecificText(q.answerKey, primaryLang, secondaryLang);
        let userAnswerPrimLang = "";
        if (userAnswer !== undefined) {
            userAnswerPrimLang = getLangSpecificText(userAnswer, primaryLang, secondaryLang);
        }
        if (userAnswerPrimLang && correctAnswerPrimLang && userAnswerPrimLang.toLowerCase() === correctAnswerPrimLang.toLowerCase()) {
          correctCount++;
        }
      }
    });
    return { correct: correctCount, total: scorableQuestions };
  }, [exam, userAnswers, primaryLang, secondaryLang]);

  const getStatusForExport = (question: Question, userAnswerValue: string | OptionValue | undefined): string => {
    const isAnswerKeyAvailable = exam.includeAnswerKey && question.answerKey !== undefined && question.answerKey !== null;

    if (typeof userAnswers[question.id.toString()] === 'undefined') {
        return "Not Answered";
    }
    if (!isAnswerKeyAvailable) {
        return "Not Scored";
    }

    const userAnswerDisplay = getLangSpecificText(userAnswerValue, primaryLang);
    const correctAnswerDisplay = getLangSpecificText(question.answerKey!, primaryLang);

    if (correctAnswerDisplay.toLowerCase() === userAnswerDisplay.toLowerCase()) {
      return "Correct";
    }
    return "Incorrect";
  };

  const escapeCsvField = (field: any): string => {
    const stringField = String(field === null || typeof field === 'undefined' ? "" : field);
    if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n') || stringField.includes('\r')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const convertResultsToCsv = (data: any): string => {
    const csvRows: string[][] = [];

    csvRows.push([escapeCsvField('Exam Title:'), escapeCsvField(data.examTitle)]);
    csvRows.push([escapeCsvField('Exam Date:'), escapeCsvField(data.examDate)]);
    csvRows.push([escapeCsvField('Duration:'), escapeCsvField(data.durationFormatted)]);
    csvRows.push([escapeCsvField('Score:'), escapeCsvField(data.score)]);
    csvRows.push([]);

    const questionHeaders = ['Question No.', 'Question Text', 'User Answer', 'Correct Answer', 'Status'];
    csvRows.push(questionHeaders.map(escapeCsvField));

    data.questions.forEach((q: any) => {
      csvRows.push([
        escapeCsvField(q.questionNumber),
        escapeCsvField(q.questionText),
        escapeCsvField(q.userAnswer),
        escapeCsvField(q.correctAnswer),
        escapeCsvField(q.status),
      ]);
    });

    return csvRows.map(rowArray => rowArray.join(',')).join('\n');
  };

  const exportToFile = async (format: 'json' | 'csv') => {
    try {
      let contentString: string;
      let fileName: string;
      let mimeType: string;
      const safeExamTitle = exam.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const dateSuffix = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        // Create a deep copy of the original exam object to avoid modifying the state version
        const examCopy: Exam = JSON.parse(JSON.stringify(exam));

        // Add user answers to each question in the copy
        examCopy.questions.forEach(question => {
          const userAnswerValue = userAnswers[question.id.toString()];
          // Add the user's answer to the question object.
          // We store the raw userAnswerValue (which can be string or LangSpecificText for MCQs)
          // This preserves the original answer structure if it was complex.
          // @ts-ignore because we are dynamically adding a property
          question.userProvidedAnswer = userAnswerValue !== undefined ? userAnswerValue : null;
        });

        // Prepare the final export object
        const exportData = {
          ...examCopy, // Spread the modified exam copy (includes title, language, questions with answers)
          resultSummary: {
            examDate: new Date().toISOString(),
            durationFormatted: formatDuration(duration), // Assuming formatDuration is available
            durationMs: duration,
            score: scoreData ? `${scoreData.correct}/${scoreData.total}` : 'Not Scored',
            // Could also include a summary of statuses per question if desired, but keep simple for now
          }
        };

        contentString = JSON.stringify(exportData, null, 2);
        fileName = `${safeExamTitle}_results_${dateSuffix}.json`;
        mimeType = 'application/json';

      } else { // CSV format - current logic for CSV can remain or be adjusted if needed
          // For now, let's assume the existing CSV data structure is acceptable.
          // If CSV also needs to change significantly, that would be a separate detailed requirement.
          // The existing CSV preparation code:
          const csvOutputData = {
              examTitle: exam.title,
              examDate: new Date().toISOString(),
              durationFormatted: formatDuration(duration),
              durationMs: duration,
              score: scoreData ? `${scoreData.correct}/${scoreData.total}` : (exam.includeAnswerKey ? '0/0' : 'Not Scored'),
              questions: exam.questions.map((question, index) => {
                const userAnswerValue = userAnswers[question.id.toString()];
                return {
                  id: question.id.toString(),
                  questionNumber: index + 1,
                  questionText: getLangSpecificText(question.question, primaryLang, primaryLang),
                  userAnswer: getLangSpecificText(userAnswerValue, primaryLang, primaryLang) || "Not Answered",
                  correctAnswer: (exam.includeAnswerKey && question.answerKey) ? getLangSpecificText(question.answerKey, primaryLang, primaryLang) : 'N/A',
                  status: getStatusForExport(question, userAnswerValue), // Assuming getStatusForExport is available
                };
              }),
          };
          contentString = convertResultsToCsv(csvOutputData); // Assuming convertResultsToCsv is available
          fileName = `${safeExamTitle}_results_${dateSuffix}.csv`;
          mimeType = 'text/csv';
      }

      // Platform-specific export logic starts here
      if (Platform.OS === 'web') {
        // Web platform: Implement direct browser download
        try {
          const blob = new Blob([contentString], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a); // Append to body for compatibility
          a.click();
          document.body.removeChild(a); // Clean up the anchor element
          URL.revokeObjectURL(url); // Clean up the object URL
          console.log('Web download initiated for:', fileName);
          // Alert.alert('Download Started', `${fileName} should begin downloading shortly.`); // Optional: User feedback
        } catch (webDownloadError: any) {
          console.error("Web download error:", webDownloadError);
          Alert.alert("Download Error", `Failed to download file on web: ${webDownloadError.message}`);
        }
      } else {
        // Mobile platforms: Use FileSystem and Sharing logic
        try {
          const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') + fileName;
          if (!FileSystem.documentDirectory && !FileSystem.cacheDirectory) {
              console.error('File system directories are not available.');
              Alert.alert('Export Error', 'File system access is not available on this device.');
              return; // Exit if no valid directory
          }
          await FileSystem.writeAsStringAsync(fileUri, contentString, { encoding: FileSystem.EncodingType.UTF8 });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Share ${exam.title} Results` });
          } else {
            Alert.alert("Share Results", `Results file saved. Sharing not available on this device. You may find it at: ${fileUri}`);
          }
        } catch (mobileExportError: any) {
          console.error("Mobile Export Error: ", mobileExportError);
          Alert.alert("Export Error", `Failed to export results on mobile: ${mobileExportError.message}`);
        }
      }
      // The original outer try...catch is removed as specific catches are now in place.
      // If a more general catch is needed for logic outside web/mobile paths (e.g. data prep), it would be placed around that.
    } catch (error: any) { // This catch now primarily handles errors from data preparation stage if any
        console.error("General Export Preparation Error: ", error);
        Alert.alert("Export Preparation Error", `Failed to prepare data for export: ${error.message}`);
    }
  };

  const handleExportResults = () => {
    Alert.alert(
      "Export Results",
      "Choose the format for your results:",
      [
        { text: "JSON", onPress: () => exportToFile('json') },
        { text: "CSV", onPress: () => exportToFile('csv') },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleDone = () => {
    navigation.pop();
  };

  return (
    <StyledContainer backgroundColor={theme.background}>
      <ContentPadding>
        <HeaderText color={theme.text}>{exam.title} - Results</HeaderText>
        <InfoText color={theme.text}>Time taken: {formatDuration(duration)}</InfoText>

        {scoreData && scoreData.total > 0 && (
          <ScoreText color={theme.text}>
            Your Score: {scoreData.correct} / {scoreData.total}
          </ScoreText>
        )}
         {exam.includeAnswerKey === false && (
            <InfoText color={theme.textMuted || theme.text}>Answer key not included in this exam version.</InfoText>
        )}


        <SectionTitleText color={theme.text} theme={theme}>Detailed Answers</SectionTitleText>

        {exam.questions.map((question, index) => {
          const userAnswerValue = userAnswers[question.id.toString()];
          const userAnswerDisplay = userAnswerValue !== undefined ? getLangSpecificText(userAnswerValue, primaryLang, secondaryLang) : "No answer provided";

          let isCorrect = false;
          let correctAnswerDisplay: string | null = null;

          if (exam.includeAnswerKey && question.answerKey !== undefined && question.answerKey !== null) {
            correctAnswerDisplay = getLangSpecificText(question.answerKey, primaryLang, secondaryLang);
            if (userAnswerValue !== undefined) {
                const userAnswerPrimLang = getLangSpecificText(userAnswerValue, primaryLang, secondaryLang);
                if (correctAnswerDisplay && userAnswerPrimLang.toLowerCase() === correctAnswerDisplay.toLowerCase()) {
                    isCorrect = true;
                }
            }
          }

          const questionMainText = getLangSpecificText(question.question, primaryLang, secondaryLang);
          const questionSubText = isMultilingual ? getLangSpecificText(question.question, secondaryLang, primaryLang) : null;

          return (
            <QuestionBlock key={question.id.toString()} theme={theme}>
              <QuestionTitleText color={theme.text}>
                {index + 1}. {questionMainText}
              </QuestionTitleText>
              {isMultilingual && questionSubText && questionSubText !== questionMainText && (
                <QuestionSubtitleText color={theme.textMuted || theme.text}>
                  {questionSubText}
                </QuestionSubtitleText>
              )}

              <AnswerLabelText color={theme.text}>Your Answer:</AnswerLabelText>
              <AnswerText color={theme.textMuted || theme.text}>
                {userAnswerDisplay}
              </AnswerText>

              {exam.includeAnswerKey && correctAnswerDisplay && (
                <>
                  <AnswerLabelText color={theme.text}>Correct Answer:</AnswerLabelText>
                  <AnswerText color={theme.textMuted || theme.text}>{correctAnswerDisplay}</AnswerText>
                  {userAnswerValue !== undefined && (
                    <ResultIndicatorText theme={theme} isCorrect={isCorrect}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                    </ResultIndicatorText>
                  )}
                </>
              )}
            </QuestionBlock>
          );
        })}

        <ButtonContainer>
             <StyledButton theme={theme} onPress={handleExportResults} secondary>
                <ButtonText theme={theme} secondary>Export</ButtonText>
            </StyledButton>
            <StyledButton theme={theme} onPress={handleDone}>
                <ButtonText theme={theme}>Done</ButtonText>
            </StyledButton>
        </ButtonContainer>
      </ContentPadding>
    </StyledContainer>
  );
};

export default ResultsScreen; */

// src/screens/ResultsScreen.tsx
import React, { useContext, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import styled from 'styled-components/native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { ThemeContext, Theme } from '../context/ThemeContext';
import { Exam, Question, OptionValue, LangSpecificText } from '../types/exam';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StackNavigationProp } from '@react-navigation/stack';

// Define RootStackParamList if not already globally defined for type safety
// Ensure this matches the navigator's param list
export type ResultsScreenParams = {
  exam: Exam;
  userAnswers: Record<string, string | OptionValue>;
  duration: number;
};

type RootStackParamList = {
  Upload: undefined;
  ExamList: undefined;
  ExamExecution: { examId: string };
  Results: ResultsScreenParams;
};

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;
type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;

// Utility function (ensure this is robust and handles undefined/null textObj)
const getLangSpecificText = (textObj: string | LangSpecificText | undefined | null, lang: string, fallbackLang?: string): string => {
  if (typeof textObj === 'string') return textObj;
  if (textObj && typeof textObj === 'object' && !Array.isArray(textObj)) {
      const typedTextObj = textObj as LangSpecificText; // Type assertion
      if (typedTextObj[lang]) return typedTextObj[lang];
      if (fallbackLang && typedTextObj[fallbackLang]) return typedTextObj[fallbackLang];
      const availableLangs = Object.keys(typedTextObj);
      if (availableLangs.length > 0) return typedTextObj[availableLangs[0]];
  }
  return "N/A"; // Default fallback if textObj is undefined, null, or not processable
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ResultsScreen = () => {
  const { theme } = useContext(ThemeContext);
  const route = useRoute<ResultsScreenRouteProp>();
  const navigation = useNavigation<ResultsScreenNavigationProp>();

  // Styled Components (defined within the component to access theme directly via lexical scope)
  const StyledContainer = styled.ScrollView`
    flex: 1;
    background-color: ${theme.background};
  `;

  const ContentPadding = styled.View`
    padding: 20px;
  `;

  const HeaderText = styled.Text`
    font-size: 24px;
    font-weight: bold;
    color: ${theme.text};
    margin-bottom: 8px;
    text-align: center;
  `;

  const InfoText = styled.Text`
    font-size: 16px;
    color: ${theme.text};
    margin-bottom: 15px;
    text-align: center;
  `;

  const ScoreText = styled.Text`
    font-size: 18px;
    font-weight: bold;
    color: ${theme.text};
    text-align: center;
    margin-vertical: 15px;
  `;

  const SectionTitleText = styled.Text`
    font-size: 20px;
    font-weight: bold;
    color: ${theme.text};
    margin-top: 20px;
    margin-bottom: 10px;
    border-bottom-width: 1px;
    border-bottom-color: ${theme.borderColor};
    padding-bottom: 5px;
  `;

  const QuestionBlock = styled.View`
    margin-bottom: 20px;
    padding: 15px;
    background-color: ${theme.cardBackground};
    border-radius: 5px;
    border: 1px solid ${theme.borderColor};
  `;

  const QuestionTitleText = styled.Text`
    font-size: 17px;
    font-weight: bold;
    color: ${theme.text};
    margin-bottom: 5px;
  `;

  const QuestionSubtitleText = styled.Text`
    font-size: 14px;
    font-style: italic;
    color: ${theme.textMuted || theme.text}; 
    margin-bottom: 8px;
  `;

  const AnswerLabelText = styled.Text`
    font-size: 15px;
    font-weight: bold;
    color: ${theme.text};
    margin-top: 8px;
  `;

  const AnswerText = styled.Text`
    font-size: 15px;
    color: ${theme.textMuted || theme.text};
    margin-left: 10px; 
    margin-bottom: 5px;
  `;

  const ResultIndicatorText = styled.Text<{ isCorrect: boolean }>`
    font-size: 15px;
    font-weight: bold;
    color: ${props => props.isCorrect ? theme.accent : theme.danger};
    margin-left: 10px;
  `;
  
  const ButtonContainer = styled.View`
    margin-top: 20px;
    margin-bottom: 30px;
    flex-direction: row;
    justify-content: space-around;
  `;

  const StyledButton = styled.TouchableOpacity`
    background-color: ${props => (props as any).secondary ? theme.cardBackground : theme.primary};
    padding: 12px 20px;
    border-radius: 5px;
    border: 1px solid ${props => (props as any).secondary ? theme.primary : 'transparent'};
    align-items: center;
    min-width: 120px;
  `;

  const ButtonText = styled.Text<{ secondary?: boolean; disabled?: boolean }>`
    color: ${props => {
      if (props.secondary) {
        return theme.primary;
      }
      if (props.disabled) {
        return theme.textMuted;
      }
      return (theme.primary === theme.background && theme.mode === 'dark') 
             ? '#FFFFFF' 
             : (theme.mode === 'dark' ? theme.background : '#FFFFFF');
    }};
    font-size: 16px;
    font-weight: bold;
  `;

  const showAlert = (title: string, message: string, buttons?:any[]) => {
    console.log(`Alert: Title: "${title}", Message: "${message}"`);
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      // For web, if buttons are provided, we can try to simulate them or log them
      if (buttons && buttons.length > 0) {
        console.log("Alert buttons (web would require custom modal for these):", buttons.map(b => b.text).join(', '));
        // Simulate the first button press if it's not 'Cancel' for testing purposes
        // This is a hack for testing the flow without a custom web modal for alerts
        const primaryAction = buttons.find(b => b.style !== 'cancel');
        if (primaryAction && primaryAction.onPress) {
          primaryAction.onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  if (!route.params) {
      console.error('[ResultsScreen] Error: route.params is undefined!');
      return (
          <StyledContainer>
            <ContentPadding>
              <HeaderText>Error</HeaderText>
              <InfoText>No results data found. Please try taking an exam again.</InfoText>
            </ContentPadding>
          </StyledContainer>
      );
  }

  const { exam, userAnswers, duration } = route.params;
  const primaryLang = exam?.language?.primary || 'en';
  const secondaryLang = exam?.language?.secondary;
  const isMultilingual = !!secondaryLang && primaryLang !== secondaryLang;

  if (!exam || !exam.questions) {
    console.error('[ResultsScreen] Critical data missing: Exam or questions undefined.');
    return (
      <StyledContainer>
        <ContentPadding>
          <HeaderText>Error</HeaderText>
          <InfoText>Could not load exam results. Data is missing.</InfoText>
        </ContentPadding>
      </StyledContainer>
    );
  }

  const scoreData = useMemo(() => {
    if (!exam.includeAnswerKey) return null;
    let correctCount = 0;
    let scorableQuestions = 0;
    exam.questions.forEach(q => {
      if (q.answerKey) {
        scorableQuestions++;
        const userAnswer = userAnswers[q.id.toString()];
        const correctAnswerPrimLang = getLangSpecificText(q.answerKey, primaryLang);
        let userAnswerPrimLang = getLangSpecificText(userAnswer, primaryLang);

        if (userAnswerPrimLang !== "N/A" && correctAnswerPrimLang.toLowerCase() === userAnswerPrimLang.toLowerCase()) {
          correctCount++;
        }
      }
    });
    return { correct: correctCount, total: scorableQuestions };
  }, [exam, userAnswers, primaryLang]);

  const getStatusForQuestion = (question: Question): string => {
    const userAnswerValue = userAnswers[question.id.toString()];
    if (typeof userAnswerValue === 'undefined' || getLangSpecificText(userAnswerValue, primaryLang) === "N/A") {
        return "Not Answered";
    }
    if (!exam.includeAnswerKey || !question.answerKey) {
        return "Not Scored";
    }
    const userAnswerDisplay = getLangSpecificText(userAnswerValue, primaryLang);
    const correctAnswerDisplay = getLangSpecificText(question.answerKey, primaryLang);
    if (correctAnswerDisplay.toLowerCase() === userAnswerDisplay.toLowerCase()) {
      return "Correct";
    }
    return "Incorrect";
  };

  const exportToFile = async (format: 'json' | 'csv') => {
    console.log(`[ResultsScreen] Attempting to export to ${format}`);
    let contentString: string;
    let fileName: string;
    let mimeType: string;

    const examCopyToExport = JSON.parse(JSON.stringify(exam));
    examCopyToExport.questions.forEach((q: Question) => {
        const userAnswerValue = userAnswers[q.id.toString()];
        // @ts-ignore
        q.userProvidedAnswer = userAnswerValue !== undefined ? userAnswerValue : null;
    });

    const fullExportData = {
        ...examCopyToExport,
        resultSummary: {
          examDate: new Date().toISOString(),
          durationFormatted: formatDuration(duration),
          durationMs: duration,
          score: scoreData ? `${scoreData.correct}/${scoreData.total}` : 'Not Scored',
        }
    };

    if (format === 'json') {
      contentString = JSON.stringify(fullExportData, null, 2);
      const safeExamTitle = exam.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const dateSuffix = new Date().toISOString().split('T')[0];
      fileName = `${safeExamTitle}_results_${dateSuffix}.json`;
      mimeType = 'application/json';
    } else { // csv
        const csvPreparedQuestions = exam.questions.map((question, index) => {
            const userAnswerValue = userAnswers[question.id.toString()];
            return {
                id: question.id.toString(),
                questionNumber: index + 1,
                questionText: getLangSpecificText(question.question, primaryLang, primaryLang),
                userAnswer: getLangSpecificText(userAnswerValue, primaryLang, primaryLang) || "Not Answered",
                correctAnswer: (exam.includeAnswerKey && question.answerKey) ? getLangSpecificText(question.answerKey, primaryLang, primaryLang) : 'N/A',
                status: getStatusForExport(question, userAnswerValue),
            };
        });
        const csvOutputData = {
            examTitle: exam.title,
            examDate: new Date().toISOString(),
            durationFormatted: formatDuration(duration),
            durationMs: duration,
            score: scoreData ? `${scoreData.correct}/${scoreData.total}` : 'Not Scored',
            questions: csvPreparedQuestions
        };
        contentString = convertResultsToCsv(csvOutputData);
        const safeExamTitle = exam.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const dateSuffix = new Date().toISOString().split('T')[0];
        fileName = `${safeExamTitle}_results_${dateSuffix}.csv`;
        mimeType = 'text/csv';
    }

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([contentString], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a); 
        a.click();
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
        console.log('Web download initiated for:', fileName);
      } catch (webDownloadError: any) {
        console.error("Web download error:", webDownloadError);
        showAlert("Download Error", `Failed to download file on web: ${webDownloadError.message}`);
      }
    } else {
      try {
        const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') + fileName;
        if (!FileSystem.documentDirectory && !FileSystem.cacheDirectory) {
            console.error('File system directories are not available.');
            showAlert('Export Error', 'File system access is not available on this device.');
            return; 
        }
        await FileSystem.writeAsStringAsync(fileUri, contentString, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Share ${exam.title} Results` });
        } else {
          showAlert("Share Results", `Results file saved. Sharing not available. Path: ${fileUri}`);
        }
      } catch (mobileExportError: any) {
        console.error("Mobile Export Error: ", mobileExportError);
        showAlert("Export Error", `Failed to export results on mobile: ${mobileExportError.message}`);
      }
    }
  };

  const handleExportResults = () => {
    if (Platform.OS === 'web') {
        // For web, window.alert doesn't support multiple choice buttons well.
        // We can offer two separate buttons or a simple prompt then export.
        // For now, let's just have two distinct alerts and then call export.
        // This is a simplification for the test; a real app might use a custom modal.
        const choseJSON = window.confirm("Export as JSON?");
        if (choseJSON) {
            exportToFile('json');
        } else {
            const choseCSV = window.confirm("Export as CSV?");
            if (choseCSV) {
                exportToFile('csv');
            }
        }
    } else {
        showAlert(
          "Export Results",
          "Choose the format for your results:",
          [
            { text: "JSON", onPress: () => exportToFile('json') },
            { text: "CSV", onPress: () => exportToFile('csv') },
            { text: "Cancel", style: "cancel" },
          ]
        );
    }
  };

  const handleDone = () => {
    if (navigation.canGoBack()) {
        navigation.pop(); 
    } else {
        navigation.navigate('ExamList');
    }
  };

  // Moved styled components definitions inside the component to ensure `theme` is in scope
  // This was a key fix for UploadScreen and might be relevant if any styled component here
  // was defined outside and tried to access theme implicitly rather than via props.
  // However, the previous analysis showed ResultsScreen used prop-based theme for its module-level styled components.
  // For this iteration, I'm including the full definitions within the component scope
  // to ensure maximum consistency with the now-working UploadScreen pattern, in case that's the subtle issue.

  return (
    <StyledContainer>
      <ContentPadding>
        <HeaderText>{exam.title || "Results"} - Results</HeaderText>
        <InfoText>Time taken: {formatDuration(duration)}</InfoText>

        {scoreData && (
          <ScoreText>
            Your Score: {scoreData.correct} / {scoreData.total}
          </ScoreText>
        )}

        <SectionTitleText>Detailed Answers</SectionTitleText>

        {exam.questions.map((question, index) => {
          const userAnswerValue = userAnswers[question.id.toString()];
          const userAnswerDisplay = getLangSpecificText(userAnswerValue, primaryLang);
          
          let isCorrect = false;
          let correctAnswerDisplay: string | null = null;

          if (exam.includeAnswerKey && question.answerKey) {
            correctAnswerDisplay = getLangSpecificText(question.answerKey, primaryLang);
            if (userAnswerDisplay !== "N/A" && correctAnswerDisplay.toLowerCase() === userAnswerDisplay.toLowerCase()) {
              isCorrect = true;
            }
          }

          const questionMainText = getLangSpecificText(question.question, primaryLang);
          const questionSubText = isMultilingual && secondaryLang && typeof question.question === 'object' ? getLangSpecificText(question.question, secondaryLang, primaryLang) : null;

          return (
            <QuestionBlock key={question.id.toString()}>
              <QuestionTitleText>
                {index + 1}. {questionMainText}
              </QuestionTitleText>
              {isMultilingual && questionSubText && questionSubText !== questionMainText && (
                <QuestionSubtitleText>
                  {questionSubText}
                </QuestionSubtitleText>
              )}

              <AnswerLabelText>Your Answer:</AnswerLabelText>
              <AnswerText>
                {userAnswerDisplay || "No answer provided"} 
              </AnswerText>

              {exam.includeAnswerKey && correctAnswerDisplay && (
                <>
                  <AnswerLabelText>Correct Answer:</AnswerLabelText>
                  <AnswerText>{correctAnswerDisplay}</AnswerText>
                  {(userAnswerDisplay !== "N/A" && userAnswerDisplay !== "") && (
                    <ResultIndicatorText isCorrect={isCorrect}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </ResultIndicatorText>
                  )}
                </>
              )}
            </QuestionBlock>
          );
        })}
        
        <ButtonContainer>
             <StyledButton onPress={handleExportResults} secondary>
                <ButtonText secondary>Export</ButtonText>
            </StyledButton>
            <StyledButton onPress={handleDone}>
                <ButtonText>Done</ButtonText>
            </StyledButton>
        </ButtonContainer>
      </ContentPadding>
    </StyledContainer>
  );
};

export default ResultsScreen;