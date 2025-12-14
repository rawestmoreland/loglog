import { Heading, Text, YStack } from 'tamagui';

export function NoConnectionView() {
  return (
    <YStack gap='$4' mb='$4' items='center' justify='center'>
      <Heading>No network connection</Heading>
      <Text>Please check your internet connection and try again.</Text>
    </YStack>
  );
}
