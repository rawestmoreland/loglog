import { useEffect, useState } from 'react';

import { Text } from './nativewindui/Text';
import { cn } from '~/lib/cn';

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

export const Timer = ({ startTime }: { startTime: Date }) => {
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsed(new Date().getTime() - startTime.getTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  return (
    <Text
      className={cn(
        elapsed && elapsed > 1000 * 60 * 10 ? 'font-semibold text-red-500' : 'font-normal'
      )}>
      Time elapsed: {elapsed ? formatElapsedTime(elapsed) : ''}
    </Text>
  );
};
