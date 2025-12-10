import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
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
import { useThemeColor } from '@/hooks/use-theme-color';
import { Button as TamaguiButton } from 'tamagui';

import useSignUp from './hook/useSignUp';

const LOGO_SOURCE = require('@/assets/images/loggie.png');

const signUpSchema = z
  .object({
    email: z.email('A valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    codeName: z.string().min(1, 'Code name is required'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['passwordConfirm'],
      });
    }
  });

export default function CredentialsScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'foreground');
  const mutedForeground = useThemeColor({}, 'mutedForeground');

  const { codeName } = useLocalSearchParams();

  const [focusedTextField, setFocusedTextField] = React.useState<
    'email' | 'password' | 'confirm-password' | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      codeName: (codeName as string) || '',
    },
  });

  const { signUp } = useSignUp();

  useEffect(() => {
    if (codeName) {
      form.setValue('codeName', codeName as string);
    }
  }, [codeName, form]);

  const handleCreateAccount = async (data: z.infer<typeof signUpSchema>) => {
    if (!form.formState.isValid) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        codeName: data.codeName,
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(
          'There was an issue while creating your account. Please try again.'
        );
      } else {
        Alert.alert(
          'There was an issue while creating your account. Please try again.'
        );
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
          title: 'Create Account',
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
              {Platform.select({
                ios: 'Set up your credentials',
                default: 'Create Account',
              })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text style={[styles.subtitle, { color: mutedForeground }]}>
                Set up your credentials
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
                      onSubmitEditing={() =>
                        KeyboardController.setFocusTo('next')
                      }
                      onFocus={() => setFocusedTextField('password')}
                      onBlur={() => setFocusedTextField(null)}
                      secureTextEntry
                      returnKeyType='next'
                      textContentType='newPassword'
                    />
                  )}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              {Platform.OS !== 'ios' && (
                <Text style={[styles.label, { color: mutedForeground }]}>
                  Confirm Password
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
                  name='passwordConfirm'
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={Platform.select({
                        ios: 'Confirm password',
                        default: '',
                      })}
                      placeholderTextColor={mutedForeground}
                      onFocus={() => setFocusedTextField('confirm-password')}
                      onBlur={() => setFocusedTextField(null)}
                      secureTextEntry
                      returnKeyType='done'
                      textContentType='newPassword'
                      onSubmitEditing={form.handleSubmit(handleCreateAccount)}
                    />
                  )}
                />
              </View>
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
              onPress={form.handleSubmit(handleCreateAccount)}
            >
              {isLoading ? 'Creating account...' : 'Continue'}
            </TamaguiButton>
          </View>
        ) : (
          <View style={styles.androidButtonContainer}>
            <TamaguiButton
              disabled={isLoading}
              onPress={() => {
                if (focusedTextField === 'email') {
                  KeyboardController.setFocusTo('next');
                  return;
                }
                if (focusedTextField === 'password') {
                  KeyboardController.setFocusTo('next');
                  return;
                }
                KeyboardController.dismiss();
                form.handleSubmit(handleCreateAccount)();
              }}
            >
              {focusedTextField === 'confirm-password' ? 'Submit' : 'Next'}
            </TamaguiButton>
          </View>
        )}
      </KeyboardStickyView>
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
  buttonContainer: {
    paddingHorizontal: Platform.select({ ios: 48, default: 32 }),
  },
  androidButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
