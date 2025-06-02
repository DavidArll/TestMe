// src/screens/RegisterScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import styled from 'styled-components/native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthContext, ThemeContext, Theme } from '../context'; // Using context index file
import { RootStackParamList } from '../navigation/AppNavigator'; // Adjust path as needed

// Re-use styled components or define them similarly to LoginScreen
const Container = styled.View<{ backgroundColor: string }>`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: ${props => props.backgroundColor};
`;

const Title = styled.Text<{ color: string }>`
  font-size: 28px;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 30px;
`;

const Input = styled.TextInput<{ theme: Theme }>`
  width: 100%;
  background-color: ${props => props.theme.cardBackground};
  color: ${props => props.theme.text};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 16px;
  border-width: 1px;
  border-color: ${props => props.theme.borderColor};
`;

const StyledButton = styled.TouchableOpacity<{ theme: Theme, disabled?: boolean }>`
  background-color: ${props => props.disabled ? props.theme.disabled : props.theme.primary};
  padding: 15px;
  border-radius: 8px;
  width: 100%;
  align-items: center;
  margin-bottom: 15px;
  opacity: ${props => props.disabled ? 0.7 : 1};
`;

const ButtonText = styled.Text<{ theme: Theme }>`
  color: ${props => (props.theme.primary === props.theme.background && props.theme.mode === 'dark') 
                   ? '#FFFFFF' 
                   : (props.theme.mode === 'dark' ? props.theme.background : '#FFFFFF')};
  font-size: 16px;
  font-weight: bold;
`;

const LinkText = styled.Text<{ color: string }>`
  color: ${props => props.color};
  margin-top: 20px;
`;

const RegisterScreen = () => {
  const { theme } = useContext(ThemeContext)!;
  const { register, isLoading: authLoading } = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Username and password cannot be empty.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }
    // In a real app, password would be hashed before sending to a backend
    const success = await register(username, password);
    if (success) {
      // Navigation to UserDashboard or Home will be handled by AppNavigator based on auth state
      // navigation.navigate('Home'); or navigation.navigate('UserDashboard');
    } else {
      Alert.alert('Registration Failed', 'Username might already be taken or another error occurred.');
    }
  };

  return (
    <Container backgroundColor={theme.background}>
      <Title color={theme.text}>Register</Title>
      <Input
        theme={theme}
        placeholder="Username"
        placeholderTextColor={theme.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <Input
        theme={theme}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Input
        theme={theme}
        placeholder="Confirm Password"
        placeholderTextColor={theme.textMuted}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <StyledButton theme={theme} onPress={handleRegister} disabled={authLoading}>
        {authLoading ? <ActivityIndicator color="#fff" /> : <ButtonText theme={theme}>Register</ButtonText>}
      </StyledButton>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <LinkText color={theme.primary}>Already have an account? Login</LinkText>
      </TouchableOpacity>
    </Container>
  );
};

export default RegisterScreen;
