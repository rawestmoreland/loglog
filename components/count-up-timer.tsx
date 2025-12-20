import { Colors } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

const CountUpTimer = ({ startTime }: { startTime: string }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const scheme = useColorScheme() ?? 'light';

  useEffect(() => {
    // Convert startTime to a Date object if it's a timestamp string or number
    const actualStartTime = new Date(startTime).getTime();

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setElapsedTime(currentTime - actualStartTime);
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [startTime]); // Re-run effect if startTime changes

  const formattedTimeObject = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  // Format the elapsed time for display
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <XStack
      style={{
        borderRadius: 10,
        backgroundColor: Colors[scheme].primary as any,
      }}
      gap='$2'
      items='center'
      justify='center'
    >
      <YStack
        items='center'
        justify='center'
        height='$6'
        width='$6'
        style={[
          styles.numberContainer,
          { backgroundColor: Colors[scheme].primary as any },
        ]}
      >
        <Text fontWeight='bold' fontSize='$5'>
          {formattedTimeObject(elapsedTime).minutes}
        </Text>
        <Text fontSize='$1'>mins</Text>
      </YStack>
      <Text fontSize='$3' fontWeight='bold'>
        :
      </Text>
      <YStack
        items='center'
        justify='center'
        height='$6'
        width='$6'
        style={[
          styles.numberContainer,
          { backgroundColor: Colors[scheme].primary as any },
        ]}
      >
        <Text fontWeight='bold' fontSize='$5'>
          {formattedTimeObject(elapsedTime).seconds}
        </Text>
        <Text fontSize='$1'>secs</Text>
      </YStack>
    </XStack>
  );
};

const styles = StyleSheet.create({
  numberContainer: {
    borderRadius: 10,
  },
});

export default CountUpTimer;
