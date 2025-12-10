import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button as TamaguiButton } from 'tamagui';

const LOGO_SOURCE = require('@/assets/images/loggie.png');

const GOOGLE_SOURCE = {
  uri: 'https://www.pngall.com/wp-content/uploads/13/Google-Logo.png',
};

export default function AuthIndexScreen() {
  const router = useRouter();
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            justifyContent: 'flex-end',
            flex: 1,
            gap: 16,
            paddingHorizontal: 32,
            paddingVertical: 16,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Image
              source={LOGO_SOURCE}
              style={{
                height: Platform.select({ ios: 48, default: 32 }),
                width: Platform.select({ ios: 48, default: 32 }),
                borderRadius: 8,
              }}
              resizeMode='contain'
            />
          </View>
          <View
            style={{
              paddingBottom: Platform.select({ ios: 20, default: 8 }),
              paddingTop: Platform.select({ ios: 8, default: 4 }),
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: 24,
              }}
            >
              Brace Yourself
            </Text>
            <Text
              style={{
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: 24,
              }}
            >
              for What&apos;s Next
            </Text>
          </View>
          <TamaguiButton
            onPress={() => {
              router.push('/(auth)/(create-account)');
            }}
          >
            Sign up free
          </TamaguiButton>
          {/* <Button
            variant="secondary"
            className="ios:border-foreground/60"
            size={Platform.select({ ios: 'lg', default: 'md' })}
            onPress={() => {
              alertRef.current?.alert({
                title: 'Suggestion',
                message: 'Use @react-native-google-signin/google-signin',
                buttons: [{ text: 'OK', style: 'cancel' }],
              });
            }}>
            <Image
              source={GOOGLE_SOURCE}
              className="absolute left-4 h-4 w-4"
              resizeMode="contain"
            />
            <Text className="ios:text-foreground">Continue with Google</Text>
          </Button> */}
          {/* {Platform.OS === 'ios' && (
            <Button
              variant="secondary"
              className="ios:border-foreground/60"
              size={Platform.select({ ios: 'lg', default: 'md' })}
              onPress={() => {
                alertRef.current?.alert({
                  title: 'Suggestion',
                  message: 'Use expo-apple-authentication',
                  buttons: [{ text: 'OK', style: 'cancel' }],
                });
              }}>
              <Text className="ios:text-foreground absolute left-4 text-[22px]"></Text>
              <Text className="ios:text-foreground">Continue with Apple</Text>
            </Button>
          )} */}
          <TamaguiButton
            onPress={() => {
              router.push('/(auth)/(login)');
            }}
            themeInverse
          >
            Log in
          </TamaguiButton>
        </View>
      </SafeAreaView>
    </>
  );
}
