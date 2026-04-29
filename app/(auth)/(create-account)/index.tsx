import { router } from 'expo-router';
import * as React from 'react';
import { Image, Platform, Text, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextInput } from '@/components/ui/text-input';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Button as TamaguiButton, YStack } from 'tamagui';

const LOGO_SOURCE = require('@/assets/images/loggie_prod.png');

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

function validateUsername(value: string): string | null {
  if (!value) return 'Please enter a username';
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 20) return 'Username must be at most 20 characters';
  if (!USERNAME_REGEX.test(value))
    return 'Start with a letter. Letters, numbers, and underscores only.';
  return null;
}

export default function InfoScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const textColor = useThemeColor({}, 'foreground');
  const borderColor = useThemeColor({}, 'border');
  const destructive = useThemeColor({}, 'destructive');

  const insets = useSafeAreaInsets();

  const [codeName, setCodeName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleChangeText = (value: string) => {
    // Strip a leading @ if the user types one
    const stripped = value.startsWith('@') ? value.slice(1) : value;
    setCodeName(stripped);
    if (error) setError(null);
  };

  const handleContinue = () => {
    const validationError = validateUsername(codeName.trim());
    if (validationError) {
      setError(validationError);
      return;
    }
    router.push({
      pathname: '/(auth)/(create-account)/credentials',
      params: { codeName: codeName.trim() },
    });
  };

  return (
    <View
      style={{
        display: 'flex',
        flex: 1,
        paddingBottom: insets.bottom,
        backgroundColor,
      }}
    >
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 8 })}
        bounces={false}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingTop: Platform.select({ ios: 48, default: 64 }),
        }}
      >
        <View
          style={{
            paddingHorizontal: Platform.select({ ios: 48, default: 32 }),
            flex: 1,
          }}
        >
          <View style={{ alignItems: 'center', paddingBottom: 4 }}>
            <Image
              source={LOGO_SOURCE}
              style={{
                height: Platform.select({ ios: 48, default: 32 }),
                width: Platform.select({ ios: 48, default: 32 }),
                borderRadius: 8,
              }}
              resizeMode='contain'
            />
            <Text
              style={{
                fontWeight: Platform.select({ ios: 'bold', default: 'normal' }),
                paddingBottom: 4,
                paddingTop: 16,
                textAlign: 'center',
              }}
            >
              {Platform.select({
                ios: "What's your username?",
                default: 'Create your account',
              })}
            </Text>
            {Platform.OS !== 'ios' && (
              <Text
                style={{
                  fontSize: 12,
                  textAlign: 'center',
                  color: mutedForeground,
                }}
              >
                Welcome back!
              </Text>
            )}
          </View>
          <View
            style={{ paddingTop: Platform.select({ ios: 16, default: 24 }) }}
          >
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: error ? destructive : borderColor,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: Platform.select({ ios: 12, default: 4 }),
                  backgroundColor,
                }}
              >
                <Text style={{ color: mutedForeground, fontSize: 16 }}>@</Text>
                <TextInput
                  value={codeName}
                  onChangeText={handleChangeText}
                  placeholder={Platform.select({
                    ios: 'username',
                    default: '',
                  })}
                  autoCapitalize='none'
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    borderWidth: 0,
                    paddingHorizontal: 4,
                    paddingVertical: 0,
                    color: textColor,
                  }}
                  onSubmitEditing={handleContinue}
                />
              </View>
              {error ? (
                <Text style={{ color: destructive, fontSize: 12 }}>
                  {error}
                </Text>
              ) : (
                <Text style={{ color: mutedForeground, fontSize: 12 }}>
                  3–20 characters. Letters, numbers, and underscores only.
                </Text>
              )}
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
          <View style={{ paddingHorizontal: 48, paddingVertical: 16 }}>
            <YStack gap={8}>
              <TamaguiButton onPress={handleContinue}>Continue</TamaguiButton>
              <TamaguiButton
                style={{ paddingHorizontal: 8 }}
                onPress={() => {
                  router.replace('/(auth)/(login)');
                }}
                themeInverse
              >
                Already have an account?
              </TamaguiButton>
            </YStack>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 24,
            }}
          >
            <TamaguiButton
              onPress={() => {
                router.replace('/(auth)/(login)');
              }}
            >
              Already have an account?
            </TamaguiButton>
            <TamaguiButton
              onPress={() => {
                KeyboardController.dismiss();
                handleContinue();
              }}
            >
              Next
            </TamaguiButton>
          </View>
        )}
      </KeyboardStickyView>
    </View>
  );
}
