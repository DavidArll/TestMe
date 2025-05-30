export const lightTheme = {
  mode: 'light' as 'light',  // Explicitly type mode
  background: '#FFFFFF',
  text: '#000000',
  primary: '#007AFF',
  accent: '#00C853',
  borderColor: '#DDDDDD',
  cardBackground: '#F8F8F8',
  danger: '#FF3B30',
  textMuted: '#6c757d',
  disabled: '#c0c0c0',
  // buttonText: '#FFFFFF', // Removed as per instruction, Theme interface makes it optional
};
export const darkTheme = {
  mode: 'dark' as 'dark', // Explicitly type mode
  background: '#000000',
  text: '#FFFFFF',
  primary: '#0A84FF',
  accent: '#30D158',
  borderColor: '#333333',
  cardBackground: '#1C1C1E',
  danger: '#FF453A',
  textMuted: '#adb5bd',
  disabled: '#555555',
  // buttonText: '#FFFFFF', // Removed as per instruction
};
