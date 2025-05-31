// src/screens/UploadScreen.tsx
import React, { useState, useContext } from 'react';
import { View, Alert, ActivityIndicator, Platform } from 'react-native';
import styled from 'styled-components/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext, Theme } from '../context/ThemeContext'; // Theme is imported
import { Exam } from '../types/exam';
import Ajv, { ErrorObject } from 'ajv';
import { examSchema } from '../lib/examSchema';

const UploadScreen = () => {
  const { theme } = useContext(ThemeContext); // theme is in scope here
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Define styled components that need this 'theme' here
  const Container = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
    background-color: ${theme.background};
  `;

  const TitleText = styled.Text`
    font-size: 24px;
    color: ${theme.text};
    margin-bottom: 20px;
  `;

  const StyledButton = styled.TouchableOpacity`
    background-color: ${theme.primary};
    padding: 15px 30px;
    border-radius: 5px;
    margin-bottom: 20px;
  `;

  // Corrected ButtonText definition using lexical theme
  const ButtonText = styled.Text`
    color: ${(props) => { // props here are the Text component's own props, not { theme: ... }
        // Logic for color based on the lexically available 'theme' object
        return (theme.primary === theme.background && theme.mode === 'dark')
               ? '#FFFFFF'
               : (theme.mode === 'dark' ? theme.background : '#FFFFFF');
    }};
    font-size: 16px;
    font-weight: bold;
  `;

  const StatusText = styled.Text`
    color: ${theme.text};
    margin-top: 10px;
  `;

  const handleFileUpload = async () => {
    setIsLoading(true);
    setStatusMessage('');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setStatusMessage('File selection cancelled.');
        setIsLoading(false);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        let fileContent: string | null = null;

        setStatusMessage('Reading file...');

        if (Platform.OS === 'web' && asset.file) {
          try {
            fileContent = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('Failed to read file as string.'));
                }
              };
              reader.onerror = () => {
                reject(reader.error || new Error('Unknown FileReader error'));
              };
              reader.readAsText(asset.file);
            });
          } catch (webReadError: any) {
            console.error("Web file read error:", webReadError);
            Alert.alert('Error Reading File', `Could not read the selected file on web: ${webReadError.message}`);
            setStatusMessage(`Error: ${webReadError.message}`);
            setIsLoading(false);
            return;
          }
        } else if (asset.uri) {
          try {
            fileContent = await FileSystem.readAsStringAsync(asset.uri);
          } catch (mobileReadError: any) {
            console.error("Mobile file read error:", mobileReadError);
            Alert.alert('Error Reading File', `Could not read the selected file: ${mobileReadError.message}`);
            setStatusMessage(`Error: ${mobileReadError.message}`);
            setIsLoading(false);
            return;
          }
        } else {
          Alert.alert('Error', 'Could not determine how to read the selected file. Asset information is missing.');
          setStatusMessage('Error: Could not read file.');
          setIsLoading(false);
          return;
        }

        if (fileContent === null) {
          Alert.alert('Error', 'File content could not be read.');
          setStatusMessage('Error: Failed to read file content.');
          setIsLoading(false);
          return;
        }

        setStatusMessage('Validating file structure...');
        const ajv = new Ajv({ allErrors: true });
        let parsedExamForValidation;
        try {
          parsedExamForValidation = JSON.parse(fileContent);
        } catch (parseError: any) {
          Alert.alert('Invalid JSON', 'The file is not a valid JSON file. Please check its syntax.\nError: ' + parseError.message);
          setStatusMessage('Error: Invalid JSON format.');
          setIsLoading(false);
          return;
        }

        const validate = ajv.compile<Exam>(examSchema);

        if (!validate(parsedExamForValidation)) {
          const errorMessages = validate.errors?.map((err: ErrorObject) => {
            let path = err.instancePath.substring(1).replace(/\//g, '.');
            if (path === '') path = 'Exam data (root)';
            else if (err.instancePath.startsWith('/questions')) path = `questions${err.instancePath.substring('/questions'.length).replace(/\//g, '.')}`;
            else path = path.replace(/^questions\.(\d+)\.(options|answerKey|question|type|id)$/, 'questions[$1].$2');
            return `${path}: ${err.message}`;
          }).join('\n');

          Alert.alert(
            'Invalid Exam File Structure',
            `The file does not match the required format. Please correct the following errors:\n\n${errorMessages}`
          );
          setStatusMessage('Error: Invalid file structure.');
          setIsLoading(false);
          return;
        }

        const validatedExam = parsedExamForValidation as Exam;

        for (let i = 0; i < validatedExam.questions.length; i++) {
            const question = validatedExam.questions[i];
            const questionIdentifier = typeof question.question === 'string' ? question.question : (question.question && Object.keys(question.question).length > 0 ? question.question[Object.keys(question.question)[0]] : `Question ${i+1}`) || `Question ${i+1}`;
            if (question.type === 'multiple-choice') {
                if (!question.options ||
                    (Array.isArray(question.options) && question.options.length === 0) ||
                    (typeof question.options === 'object' && !Array.isArray(question.options) && Object.keys(question.options).length === 0) ) {
                    Alert.alert('Invalid Question', `Question "${questionIdentifier}" (at index ${i}) is multiple-choice but has no options or empty options.`);
                    setStatusMessage('Error: Multiple-choice question missing options.');
                    setIsLoading(false);
                    return;
                }
            }
        }

        const examWithId: Exam = { ...validatedExam, id: Date.now().toString() };

        setStatusMessage('Saving exam...');
        const existingExamsRaw = await AsyncStorage.getItem('exams');
        const existingExams: Exam[] = existingExamsRaw ? JSON.parse(existingExamsRaw) : [];

        existingExams.push(examWithId);
        await AsyncStorage.setItem('exams', JSON.stringify(existingExams));

        setStatusMessage('Exam uploaded successfully!');
        Alert.alert('Success', 'Exam uploaded and saved!');
        navigation.navigate('ExamList');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload or parse the exam file.');
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <TitleText>Upload Exam File</TitleText>
      <StyledButton onPress={handleFileUpload} disabled={isLoading}>
        <ButtonText>Select JSON File</ButtonText>
      </StyledButton>
      {isLoading && <ActivityIndicator size="large" color={theme.primary} />}
      {statusMessage ? <StatusText>{statusMessage}</StatusText> : null}
    </Container>
  );
};

export default UploadScreen;
