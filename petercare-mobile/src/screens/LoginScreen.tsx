import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  // --- STATE ---
  // viewMode controls what UI we show: 'login', 'forgot', or 'reset'
  const [viewMode, setViewMode] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState(''); // Updated to reflect OTP usage
  const [newPassword, setNewPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  // --- FUNCTIONS ---

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
        await login(email, password);
        Alert.alert('Success!', 'Welcome to the Stable!');
    } catch (error: any) {
      Alert.alert('Login Failed', 'Invalid email or password.');
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', {
        email: email.toLowerCase().trim(),
      });

      Alert.alert('Email Sent', 'If an account exists, a reset code has been sent to your email.');
      setViewMode('reset');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request reset. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode || !newPassword) {
      Alert.alert('Error', 'Please enter both the OTP code and your new password.');
      return;
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      Alert.alert('Weak Password', 'Your new password must be at least 8 characters and contain a number.');
      return;
    }

    setIsLoading(true);
    try {
      // We map your local otpCode state to the 'token' field your NestJS backend expects
      await apiClient.post('/auth/reset-password', {
        token: otpCode.trim(), 
        newPassword: newPassword,
      });

      Alert.alert('Success!', 'Your password has been reset. You can now sign in.');
      
      // Clear out the temporary fields and go back to login mode
      setPassword('');
      setOtpCode('');
      setNewPassword('');
      setViewMode('login');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password. Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERERS ---

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StableHands</Text>
      
      {/* 1. LOGIN VIEW */}
      {viewMode === 'login' && (
        <>
          <Text style={styles.subtitle}>Sign in to access the stable</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setViewMode('forgot')} style={styles.linkContainer}>
            <Text style={styles.fadedText}>Forgot your password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.linkContainerTop}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 2. FORGOT PASSWORD VIEW */}
      {viewMode === 'forgot' && (
        <>
          <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setViewMode('login')} style={styles.linkContainerTop}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 3. RESET PASSWORD VIEW */}
      {viewMode === 'reset' && (
        <>
          <Text style={styles.subtitle}>Enter the code sent to your email and a new password</Text>
          
          <TextInput
            style={styles.input}
            placeholder="OTP Code"
            value={otpCode}
            onChangeText={setOtpCode}
            autoCapitalize="none"
            keyboardType="number-pad" // Prompts the number-only keyboard
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Reset Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setViewMode('login')} style={styles.linkContainerTop}>
            <Text style={styles.linkText}>Cancel and return to Login</Text>
          </TouchableOpacity>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 54, 
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 15, 
    alignItems: 'center'
  },
  linkContainerTop: {
    marginTop: 20, 
    alignItems: 'center'
  },
  linkText: {
    color: '#3498DB', 
    fontSize: 16
  },
  fadedText: {
    color: '#7F8C8D', 
    fontSize: 14
  }
});