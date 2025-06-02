// src/screens/LoginScreen.tsx
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

const LoginScreen = () => {
  const { theme } = useContext(ThemeContext)!;
  const { login, isLoading: authLoading } = useContext(AuthContext)!;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Password for UI, not used by mock login logic

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Username cannot be empty.');
      return;
    }
    // In a real app, you'd also validate password
    const success = await login(username, password);
    if (success) {
      // Navigation to UserDashboard or Home will be handled by AppNavigator based on auth state
      // For now, explicit navigation might be needed if AppNavigator isn't fully dynamic yet
      // navigation.navigate('Home'); or navigation.navigate('UserDashboard');
    } else {
      Alert.alert('Login Failed', 'Invalid username or password.');
    }
  };

  return (
    <Container backgroundColor={theme.background}>
      <Title color={theme.text}>Login</Title>
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
      <StyledButton theme={theme} onPress={handleLogin} disabled={authLoading}>
        {authLoading ? <ActivityIndicator color="#fff" /> : <ButtonText theme={theme}>Login</ButtonText>}
      </StyledButton>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <LinkText color={theme.primary}>Don't have an account? Register</LinkText>
      </TouchableOpacity>
       <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{marginTop: 10}}>
        <LinkText color={theme.textMuted || '#888'}>Back to Home</LinkText>
      </TouchableOpacity>
    </Container>
  );
};

export default LoginScreen;
