import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, Stack } from 'expo-router';
import * as React from 'react';
import { useContext, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { TextInput } from '@/components/ui/text-input';
import { AuthContext } from '@/context/authContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Button as TamaguiButton } from 'tamagui';

const LOGO_SOURCE = require('@/assets/images/loggie.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'foreground');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const primaryColor = useThemeColor({}, 'primary');

  const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [focusedTextField, setFocusedTextField] = React.useState<
    'email' | 'password' | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useContext(AuthContext);

  const handleLogin = async (data: z.infer<typeof signInSchema>) => {
    if (!form.formState.isValid) {
      return;
    }

    setIsLoading(true);

    try {
      await signIn(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Failed to authenticate.') {
          Alert.alert('Incorrect username or password.');
        } else {
          Alert.alert(
            'There was an issue while signing in. Pleaase try again.'
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Platform.select({
            ios: cardBackground,
            default: backgroundColor,
          }),
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: 'Log in',
          headerShadowVisible: false,
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 175 })}
        bounces={false}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={LOGO_SOURCE}
              style={styles.logo}
              resizeMode='contain'
            />
            <Text style={[styles.title, { color: textColor }]}>
              {Platform.select({ ios: 'Welcome back!', default: 'Log in' })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text style={[styles.subtitle, { color: mutedForeground }]}>
                Welcome back!
              </Text>
            )}
          </View>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              {Platform.OS !== 'ios' && (
                <Text style={[styles.label, { color: mutedForeground }]}>
                  Email
                </Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: Platform.select({
                      ios: cardBackground,
                      default: backgroundColor,
                    }),
                  },
                ]}
              >
                <Controller
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={Platform.select({
                        ios: 'Email',
                        default: '',
                      })}
                      placeholderTextColor={mutedForeground}
                      onSubmitEditing={() =>
                        KeyboardController.setFocusTo('next')
                      }
                      autoCapitalize='none'
                      autoFocus
                      onFocus={() => setFocusedTextField('email')}
                      onBlur={() => setFocusedTextField(null)}
                      keyboardType='email-address'
                      textContentType='emailAddress'
                      returnKeyType='next'
                    />
                  )}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              {Platform.OS !== 'ios' && (
                <Text style={[styles.label, { color: mutedForeground }]}>
                  Password
                </Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: Platform.select({
                      ios: cardBackground,
                      default: backgroundColor,
                    }),
                  },
                ]}
              >
                <Controller
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={Platform.select({
                        ios: 'Password',
                        default: '',
                      })}
                      placeholderTextColor={mutedForeground}
                      onFocus={() => setFocusedTextField('password')}
                      onBlur={() => setFocusedTextField(null)}
                      secureTextEntry
                      returnKeyType='done'
                      textContentType='password'
                      onSubmitEditing={form.handleSubmit(handleLogin)}
                    />
                  )}
                />
              </View>
            </View>
            <View style={styles.forgotPasswordContainer}>
              <Link asChild href='/(auth)/(login)/forgot-password'>
                <TamaguiButton chromeless disabled={isLoading}>
                  Forgot password?
                </TamaguiButton>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView
        offset={{
          closed: 0,
          opened: Platform.select({
            ios: insets.bottom + 30,
            default: insets.bottom,
          }),
        }}
      >
        {Platform.OS === 'ios' ? (
          <View style={[styles.buttonContainer, { paddingBottom: 8 }]}>
            <TamaguiButton
              disabled={!form.formState.isValid || isLoading}
              onPress={form.handleSubmit(handleLogin)}
            >
              {isLoading ? 'Signing in...' : 'Continue'}
            </TamaguiButton>
          </View>
        ) : (
          <View style={styles.androidButtonContainer}>
            <TamaguiButton
              disabled={isLoading}
              onPress={() => {
                router.replace('/(auth)/(create-account)');
              }}
            >
              Create Account
            </TamaguiButton>
            <TamaguiButton
              disabled={isLoading}
              onPress={() => {
                if (focusedTextField === 'email') {
                  KeyboardController.setFocusTo('next');
                  return;
                }
                KeyboardController.dismiss();
                form.handleSubmit(handleLogin)();
              }}
            >
              {focusedTextField === 'email' ? 'Next' : 'Submit'}
            </TamaguiButton>
          </View>
        )}
      </KeyboardStickyView>
      {Platform.OS === 'ios' && (
        <View style={[styles.buttonContainer, { paddingBottom: 24 }]}>
          <TamaguiButton
            disabled={isLoading}
            themeInverse
            onPress={() => {
              router.replace('/(auth)/(create-account)');
            }}
          >
            Create Account
          </TamaguiButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.select({ ios: 48, default: 80 }),
  },
  content: {
    paddingHorizontal: Platform.select({ ios: 48, default: 32 }),
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  logo: {
    height: Platform.select({ ios: 48, default: 32 }),
    width: Platform.select({ ios: 48, default: 32 }),
    borderRadius: 8,
  },
  title: {
    fontSize: Platform.select({ ios: 34, default: 24 }),
    fontWeight: Platform.select({ ios: 'bold', default: 'normal' }),
    paddingBottom: 4,
    paddingTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  formContainer: {
    paddingTop: Platform.select({ ios: 16, default: 24 }),
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: Platform.select({ ios: 10, default: 8 }),
    paddingVertical: Platform.select({ ios: 12, default: 8 }),
    paddingHorizontal: Platform.select({ ios: 16, default: 12 }),
  },
  input: {
    fontSize: Platform.select({ ios: 17, default: 16 }),
    padding: 0,
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  buttonContainer: {
    paddingHorizontal: Platform.select({ ios: 48, default: 32 }),
  },
  androidButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  iosCreateAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 16,
  },
  createAccountText: {
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: Platform.select({ ios: 0, default: 16 }),
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 17,
  },
});
