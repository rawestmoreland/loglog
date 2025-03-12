import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Image, Platform, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useSignUp from './hook/useSignUp';

import { Button } from '~/components/nativewindui/Button';
import { Form, FormItem, FormSection } from '~/components/nativewindui/Form';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';

const LOGO_SOURCE = {
  uri: 'https://nativewindui.com/_next/image?url=/_next/static/media/logo.28276aeb.png&w=2048&q=75',
};

export default function CredentialsScreen() {
  const insets = useSafeAreaInsets();
  const [focusedTextField, setFocusedTextField] = React.useState<
    'email' | 'password' | 'confirm-password' | null
  >(null);

  const { codeName } = useLocalSearchParams();

  const { signUp } = useSignUp();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleCreateAccount = async () => {
    try {
      const response = await signUp({
        email,
        password,
        passwordConfirm: confirmPassword,
        codeName: codeName as string,
      });
      console.log('Create account response:', response);
    } catch (error) {
      console.error('Create account error:', error);
    }
  };

  return (
    <View className="ios:bg-card flex-1" style={{ paddingBottom: insets.bottom }}>
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 8 })}
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
              {Platform.select({ ios: 'Set up your credentials', default: 'Create Account' })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text className="ios:text-sm text-center text-muted-foreground">
                Set up your credentials
              </Text>
            )}
          </View>
          <View className="ios:pt-4 pt-6">
            <Form className="gap-2">
              <FormSection className="ios:bg-background">
                <FormItem>
                  <TextField
                    value={email}
                    onChangeText={setEmail}
                    placeholder={Platform.select({ ios: 'Email', default: '' })}
                    label={Platform.select({ ios: undefined, default: 'Email' })}
                    onSubmitEditing={() => KeyboardController.setFocusTo('next')}
                    submitBehavior="submit"
                    autoFocus
                    onFocus={() => setFocusedTextField('email')}
                    onBlur={() => setFocusedTextField(null)}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </FormItem>
                <FormItem>
                  <TextField
                    value={password}
                    onChangeText={setPassword}
                    placeholder={Platform.select({ ios: 'Password', default: '' })}
                    label={Platform.select({ ios: undefined, default: 'Password' })}
                    onSubmitEditing={() => KeyboardController.setFocusTo('next')}
                    onFocus={() => setFocusedTextField('password')}
                    onBlur={() => setFocusedTextField(null)}
                    submitBehavior="submit"
                    secureTextEntry
                    returnKeyType="next"
                    textContentType="newPassword"
                  />
                </FormItem>
                <FormItem>
                  <TextField
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={Platform.select({ ios: 'Confirm password', default: '' })}
                    label={Platform.select({ ios: undefined, default: 'Confirm password' })}
                    onFocus={() => setFocusedTextField('confirm-password')}
                    onBlur={() => setFocusedTextField(null)}
                    onSubmitEditing={async () => {
                      if (!email || !password || !confirmPassword) {
                        return;
                      }

                      if (password !== confirmPassword) {
                        return;
                      }

                      await handleCreateAccount();
                    }}
                    secureTextEntry
                    returnKeyType="done"
                    textContentType="newPassword"
                  />
                </FormItem>
              </FormSection>
            </Form>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        {Platform.OS === 'ios' ? (
          <View className=" px-12 py-4">
            <Button
              disabled={!email || !password || !confirmPassword || password !== confirmPassword}
              size="lg"
              onPress={async () => {
                if (!email || !password || !confirmPassword || password !== confirmPassword) {
                  return;
                }

                await handleCreateAccount();
              }}>
              <Text>Submit</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-row justify-end py-4 pl-6 pr-8">
            <Button
              onPress={async () => {
                if (focusedTextField !== 'confirm-password') {
                  KeyboardController.setFocusTo('next');
                  return;
                }

                if (!email || !password || !confirmPassword || password !== confirmPassword) {
                  return;
                }

                KeyboardController.dismiss();

                await handleCreateAccount();
              }}>
              <Text className="text-sm">
                {focusedTextField !== 'confirm-password' ? 'Next' : 'Submit'}
              </Text>
            </Button>
          </View>
        )}
      </KeyboardStickyView>
    </View>
  );
}
