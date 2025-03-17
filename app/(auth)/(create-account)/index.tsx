import { router } from 'expo-router';
import * as React from 'react';
import { Image, Platform, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '~/components/nativewindui/Button';
import { Form, FormItem, FormSection } from '~/components/nativewindui/Form';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';

const LOGO_SOURCE = require('~/assets/logs.png');

export default function InfoScreen() {
  const insets = useSafeAreaInsets();
  const [focusedTextField, setFocusedTextField] = React.useState<'code-name' | null>(null);

  const [codeName, setCodeName] = React.useState('');

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
              {Platform.select({ ios: "What's your name?", default: 'Create your account' })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text className="ios:text-sm text-center text-muted-foreground">Welcome back!</Text>
            )}
          </View>
          <View className="ios:pt-4 pt-6">
            <Form className="gap-2">
              <FormSection className="ios:bg-background">
                <FormItem>
                  <TextField
                    value={codeName}
                    onChangeText={setCodeName}
                    placeholder={Platform.select({ ios: 'Code Name', default: '' })}
                    label={Platform.select({ ios: undefined, default: 'Code Name' })}
                    onFocus={() => setFocusedTextField('code-name')}
                    onBlur={() => setFocusedTextField(null)}
                    textContentType="givenName"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => {
                      router.push({
                        pathname: '/(auth)/(create-account)/credentials',
                        params: { codeName },
                      });
                    }}
                  />
                </FormItem>
              </FormSection>
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
              disabled={!codeName}
              size="lg"
              onPress={() => {
                router.push({
                  pathname: '/(auth)/(create-account)/credentials',
                  params: { codeName },
                });
              }}>
              <Text>Continue</Text>
            </Button>
          </View>
        ) : (
          <View className="flex-row justify-between py-4 pl-6 pr-8">
            <Button
              variant="plain"
              className="px-2"
              onPress={() => {
                router.replace('/(auth)/(login)');
              }}>
              <Text className="text-sm text-primary">Already have an account?</Text>
            </Button>
            <Button
              onPress={() => {
                if (focusedTextField === 'code-name') {
                  KeyboardController.setFocusTo('next');
                  return;
                }
                KeyboardController.dismiss();
                router.push('/(auth)/(create-account)/credentials');
              }}>
              <Text className="text-sm">Next</Text>
            </Button>
          </View>
        )}
      </KeyboardStickyView>
      {Platform.OS === 'ios' && (
        <Button
          variant="plain"
          onPress={() => {
            router.replace('/(auth)/(login)');
          }}>
          <Text className="text-sm text-primary">Already have an account?</Text>
        </Button>
      )}
    </View>
  );
}
