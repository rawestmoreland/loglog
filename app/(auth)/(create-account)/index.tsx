import { router } from "expo-router";
import * as React from "react";
import { Alert, Image, Platform, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardController,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TextInput } from "@/components/ui/text-input";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Button as TamaguiButton, YStack } from "tamagui";

const LOGO_SOURCE = require("@/assets/images/loggie.png");

export default function InfoScreen() {
  const backgroundColor = useThemeColor({}, "background");
  const mutedForeground = useThemeColor({}, "mutedForeground");

  const insets = useSafeAreaInsets();
  const [focusedTextField, _] = React.useState<"code-name" | null>(null);

  const [codeName, setCodeName] = React.useState("");

  return (
    <View
      style={{
        display: "flex",
        flex: 1,
        paddingBottom: insets.bottom,
        backgroundColor,
      }}
    >
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 8 })}
        bounces={true}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Platform.select({ ios: 52, default: 64 }),
        }}
      >
        <View
          style={{
            paddingHorizontal: Platform.select({ ios: 48, default: 32 }),
            flex: 1,
          }}
        >
          <View style={{ alignItems: "center", paddingBottom: 4 }}>
            <Image
              source={LOGO_SOURCE}
              style={{
                height: Platform.select({ ios: 48, default: 32 }),
                width: Platform.select({ ios: 48, default: 32 }),
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
            <Text
              style={{
                fontWeight: Platform.select({ ios: "bold", default: "normal" }),
                paddingBottom: 4,
                paddingTop: 16,
                textAlign: "center",
              }}
            >
              {Platform.select({
                ios: "What's your code name?",
                default: "Create your account",
              })}
            </Text>
            {Platform.OS !== "ios" && (
              <Text
                style={{
                  fontSize: 12,
                  textAlign: "center",
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
            <View style={{ gap: 8 }}>
              <View style={{ backgroundColor }}>
                <TextInput
                  value={codeName}
                  onChangeText={setCodeName}
                  placeholder={Platform.select({
                    ios: "Code Name",
                    default: "",
                  })}
                  onSubmitEditing={() => {
                    router.push({
                      pathname: "/(auth)/(create-account)/credentials",
                      params: { codeName },
                    });
                  }}
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
        {Platform.OS === "ios"
          ? (
            <View style={{ paddingHorizontal: 48, paddingVertical: 16 }}>
              <YStack gap={8}>
                <TamaguiButton
                  onPress={() => {
                    if (!codeName) {
                      Alert.alert("Please enter a code name");
                      return;
                    }
                    router.push({
                      pathname: "/(auth)/(create-account)/credentials",
                      params: { codeName },
                    });
                  }}
                >
                  Continue
                </TamaguiButton>
                <TamaguiButton
                  style={{ paddingHorizontal: 8 }}
                  onPress={() => {
                    router.replace("/(auth)/(login)");
                  }}
                  themeInverse
                >
                  Already have an account?
                </TamaguiButton>
              </YStack>
            </View>
          )
          : (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 16,
                paddingHorizontal: 24,
              }}
            >
              <TamaguiButton
                onPress={() => {
                  router.replace("/(auth)/(login)");
                }}
              >
                Already have an account?
              </TamaguiButton>
              <TamaguiButton
                onPress={() => {
                  if (focusedTextField === "code-name") {
                    KeyboardController.setFocusTo("next");
                    return;
                  }
                  KeyboardController.dismiss();
                  router.push("/(auth)/(create-account)/credentials");
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
