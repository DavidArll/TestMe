// src/screens/ResultsScreen.tsx
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
      const resultsExportData = {
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
            questionText: getLangSpecificText(question.question, primaryLang),
            userAnswer: getLangSpecificText(userAnswerValue, primaryLang, secondaryLang) || "Not Answered",
            correctAnswer: (exam.includeAnswerKey && question.answerKey) ? getLangSpecificText(question.answerKey, primaryLang) : 'N/A',
            status: getStatusForExport(question, userAnswerValue),
          };
        }),
      };

      let contentString: string;
      let fileName: string;
      let mimeType: string;

      const safeExamTitle = exam.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const dateSuffix = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        contentString = JSON.stringify(resultsExportData, null, 2);
        fileName = `${safeExamTitle}_results_${dateSuffix}.json`;
        mimeType = 'application/json';
      } else {
        contentString = convertResultsToCsv(resultsExportData);
        fileName = `${safeExamTitle}_results_${dateSuffix}.csv`;
        mimeType = 'text/csv';
      }

      const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, contentString, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Share ${exam.title} Results` });
      } else {
        Alert.alert("Share Results", `Results saved to: ${fileUri}\n\nSharing is not available on this device, but you can find the file in your app's documents directory if your OS allows.`);
      }
    } catch (error: any) {
      console.error("Export Error: ", error);
      Alert.alert("Export Error", `Failed to export results: ${error.message}`);
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

export default ResultsScreen;
