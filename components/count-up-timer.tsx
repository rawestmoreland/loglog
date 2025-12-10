import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'tamagui';

const CountUpTimer = ({ startTime }: { startTime: string }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Convert startTime to a Date object if it's a timestamp string or number
    const actualStartTime = new Date(startTime).getTime();

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setElapsedTime(currentTime - actualStartTime);
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [startTime]); // Re-run effect if startTime changes

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
    <View>
      <Text>Elapsed Time: {formatTime(elapsedTime)}</Text>
    </View>
  );
};

export default CountUpTimer;
