import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from './nativewindui/Button';
import { Text } from './nativewindui/Text';
import { TextField } from './nativewindui/TextField';

const formatElapsedTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (remainingMinutes > 0 || hours > 0) parts.push(`${remainingMinutes}m`);
  parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

const Timer = ({ startTime }: { startTime: Date }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsed(new Date().getTime() - startTime.getTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  return <Text className="mb-4 text-lg">Time elapsed: {formatElapsedTime(elapsed)}</Text>;
};

const poopSchema = z.object({
  notes: z.string().optional(),
});

export function PoopLogger({
  poopStarted,
  poopEnded,
  setPoopStarted,
  setPoopEnded,
  handleEndPoop,
  poopForm,
}: {
  poopStarted: Date | null;
  poopEnded: Date | null;
  setPoopStarted: (date: Date | null) => void;
  setPoopEnded: (date: Date | null) => void;
  handleEndPoop: () => void;
  poopForm: UseFormReturn<z.infer<typeof poopSchema>>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      className="px-4"
      bottomOffset={8}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={{ paddingBottom: insets.bottom }}>
      {poopStarted && !poopEnded ? (
        <Timer startTime={poopStarted} />
      ) : poopEnded ? (
        <View className="w-full gap-2">
          <Text className="text-foreground">
            Elapsed time: {formatElapsedTime(poopEnded.getTime() - poopStarted!.getTime())}
          </Text>
          <View className="w-full items-center justify-center rounded-lg border bg-card p-1 shadow">
            <Text className="text-foreground">
              {(() => {
                const elapsedMs = poopEnded.getTime() - poopStarted!.getTime();
                const minutes = Math.floor(elapsedMs / 60000);

                if (minutes < 2) {
                  return 'Quick and efficient! In and out like a ninja. 🥷';
                } else if (minutes < 5) {
                  return 'A respectable duration. Just long enough to check some messages. 📱';
                } else if (minutes < 10) {
                  return 'Taking your time, eh? Hope you had a good scroll session! 📜';
                } else if (minutes < 20) {
                  return 'Wow, that was quite the throne session! You probably finished a whole article. 📚';
                } else {
                  return "Legend has it you're still there... Oh wait, you finally emerged! 🏆";
                }
              })()}
            </Text>
          </View>
          <Text className="mb-2">Start time: {poopStarted?.toLocaleTimeString()}</Text>
          <Text className="mb-4">End time: {poopEnded?.toLocaleTimeString()}</Text>
        </View>
      ) : (
        <Text className="mb-4 text-lg">Ready to start your poop session?</Text>
      )}
      {(!!poopStarted || !!poopEnded) && (
        <View>
          <Controller
            control={poopForm.control}
            name="notes"
            render={({ field }) => (
              <TextField
                className="w-full rounded-lg border bg-card"
                label="Revelations"
                placeholder="So much time to ponder life's mysteries..."
                numberOfLines={4}
                multiline
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
        </View>
      )}
      {!!poopStarted && !poopEnded && (
        <Button className="bg-foreground" onPress={handleEndPoop}>
          <Text className="text-background">End poop sesh</Text>
        </Button>
      )}
      {!poopStarted && (
        <Button className="bg-foreground" onPress={() => setPoopStarted(new Date())}>
          <Text className="text-background">Start a poop sesh</Text>
        </Button>
      )}
      {poopEnded && (
        <Button
          className="mt-4 flex-row items-baseline bg-foreground"
          onPress={() => {
            setPoopStarted(null);
            setPoopEnded(null);
            poopForm.setValue('notes', '');
          }}>
          <Text className="text-background">Log your log</Text>
          <Ionicons name="save-outline" color="white" size={16} className="text-background" />
        </Button>
      )}
    </KeyboardAwareScrollView>
  );
}
