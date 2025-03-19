import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, Stack } from 'expo-router';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Platform, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '~/components/nativewindui/Button';
import { Form, FormItem, FormSection } from '~/components/nativewindui/Form';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { AuthContext } from '~/context/authContext';

const LOGO_SOURCE = require('~/assets/logs.png');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

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

  const [focusedTextField, setFocusedTextField] = React.useState<'email' | 'password' | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signOut } = useContext(AuthContext);

  useEffect(() => {
    signOut();
  }, []);

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
          Alert.alert('There was an issue while signing in. Pleaase try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="ios:bg-card flex-1" style={{ paddingBottom: insets.bottom }}>
      <Stack.Screen
        options={{
          title: 'Log in',
          headerShadowVisible: false,
          headerLeft() {
            return (
              <Button variant="plain" className="ios:px-0" onPress={() => router.back()}>
                <Text className="text-primary">Cancel</Text>
              </Button>
            );
          },
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 175 })}
        bounces={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="ios:pt-12 pt-20">
        <View className="ios:px-12 flex-1 px-8">
          <View className="items-center pb-1">
            <Image
              source={LOGO_SOURCE}
              className="ios:h-12 ios:w-12 h-8 w-8"
              resizeMode="contain"
            />
            <Text variant="title1" className="ios:font-bold pb-1 pt-4 text-center">
              {Platform.select({ ios: 'Welcome back!', default: 'Log in' })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text className="ios:text-sm text-center text-muted-foreground">Welcome back!</Text>
            )}
          </View>
          <View className="ios:pt-4 pt-6">
            <Form className="gap-2">
              <FormSection className="ios:bg-background">
                <FormItem>
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <TextField
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder={Platform.select({ ios: 'Email', default: '' })}
                        label={Platform.select({ ios: undefined, default: 'Email' })}
                        onSubmitEditing={() => KeyboardController.setFocusTo('next')}
                        submitBehavior="submit"
                        autoCapitalize="none"
                        autoFocus
                        onFocus={() => setFocusedTextField('email')}
                        onBlur={() => setFocusedTextField(null)}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        returnKeyType="next"
                      />
                    )}
                  />
                </FormItem>
                <FormItem>
                  <Controller
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <TextField
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder={Platform.select({ ios: 'Password', default: '' })}
                        label={Platform.select({ ios: undefined, default: 'Password' })}
                        onFocus={() => setFocusedTextField('password')}
                        onBlur={() => setFocusedTextField(null)}
                        secureTextEntry
                        returnKeyType="done"
                        textContentType="password"
                        onSubmitEditing={form.handleSubmit(handleLogin)}
                      />
                    )}
                  />
                </FormItem>
              </FormSection>
              <View className="flex-row">
                <Link asChild href="/(auth)/(login)/forgot-password">
                  <Button disabled={isLoading} size="sm" variant="plain" className="px-0.5">
                    <Text className="text-sm text-primary">Forgot password?</Text>
                  </Button>
                </Link>
              </View>
            </Form>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView
        offset={{
          closed: 0,
          opened: Platform.select({ ios: insets.bottom + 30, default: insets.bottom }),
        }}>
        {Platform.OS === 'ios' ? (
          <View className=" px-12 py-4">
            <Button
              disabled={!form.formState.isValid || isLoading}
              size="lg"
              onPress={form.handleSubmit(handleLogin)}>
              <Text>{isLoading ? 'Signing in...' : 'Continue'}</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-row justify-between py-4 pl-6 pr-8">
            <Button
              disabled={isLoading}
              variant="plain"
              className="px-2"
              onPress={() => {
                router.replace('/(auth)/(create-account)');
              }}>
              <Text className="px-0.5 text-sm text-primary">Create Account</Text>
            </Button>
            <Button
              disabled={isLoading}
              onPress={() => {
                if (focusedTextField === 'email') {
                  KeyboardController.setFocusTo('next');
                  return;
                }
                KeyboardController.dismiss();
                form.handleSubmit(handleLogin)();
              }}>
              <Text className="text-sm">{focusedTextField === 'email' ? 'Next' : 'Submit'}</Text>
            </Button>
          </View>
        )}
      </KeyboardStickyView>
      {Platform.OS === 'ios' && (
        <Button
          disabled={isLoading}
          variant="plain"
          onPress={() => {
            router.replace('/(auth)/(create-account)');
          }}>
          <Text className="text-sm text-primary">Create Account</Text>
        </Button>
      )}
    </View>
  );
}
