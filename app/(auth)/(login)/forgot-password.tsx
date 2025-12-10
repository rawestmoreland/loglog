import { useThemeColor } from '@/hooks/use-theme-color';
import { Stack, router } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { usePocketBase } from '@/lib/pocketbaseConfig';

const LOGO_SOURCE = require('@/assets/images/loggie.png');

export default function ForgotPasswordScreen() {
  const { pb } = usePocketBase();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'foreground');
  const mutedForeground = useThemeColor({}, 'mutedForeground');

  const form = useForm<{ email: string }>({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: { email: string }) => {
    if (!pb) return;

    const { email } = data;

    try {
      await pb?.collection('users').requestPasswordReset(email);

      Alert.alert(
        'Check your inbox',
        "We've sent you a password reset link. Check your email.",
        [
          {
            text: 'OK',
            onPress: () => {
              KeyboardController.dismiss();
              router.replace('/');
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'An unknown error occurred',
        [{ text: 'OK' }]
      );
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
          title: 'Forgot Password',
          headerShadowVisible: false,
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 8 })}
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
                ios: "What's your email?",
                default: 'Forgot password',
              })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text style={[styles.subtitle, { color: mutedForeground }]}>
                What&apos;s your email?
              </Text>
            )}
          </View>
          <View style={styles.formContainer}>
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
                name='email'
                control={form.control}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={Platform.select({
                      ios: 'Email',
                      default: '',
                    })}
                    placeholderTextColor={mutedForeground}
                    onSubmitEditing={() => form.handleSubmit(onSubmit)()}
                    autoFocus
                    keyboardType='email-address'
                    textContentType='emailAddress'
                    autoCapitalize='none'
                    returnKeyType='done'
                    style={[styles.input, { color: textColor }]}
                  />
                )}
              />
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        {Platform.OS === 'ios' ? (
          <View style={styles.buttonContainer}>
            <Button size='lg' onPress={form.handleSubmit(onSubmit)}>
              Submit
            </Button>
          </View>
        ) : (
          <View style={styles.androidButtonContainer}>
            <Button
              variant='ghost'
              size='sm'
              onPress={() => {
                router.replace('/(auth)/(create-account)');
              }}
            >
              Create Account
            </Button>
            <Button size='sm' onPress={() => form.handleSubmit(onSubmit)()}>
              Submit
            </Button>
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
  inputContainer: {
    borderRadius: Platform.select({ ios: 10, default: 8 }),
    paddingVertical: Platform.select({ ios: 12, default: 8 }),
    paddingHorizontal: Platform.select({ ios: 16, default: 12 }),
    marginBottom: 8,
  },
  input: {
    fontSize: Platform.select({ ios: 17, default: 16 }),
    padding: 0,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  buttonContainer: {
    paddingHorizontal: Platform.select({ ios: 48, default: 32 }),
    paddingVertical: 16,
  },
  androidButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
