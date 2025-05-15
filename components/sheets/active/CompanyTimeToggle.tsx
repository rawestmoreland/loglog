import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { Toggle } from '~/components/nativewindui/Toggle';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import type { PoopSesh } from '~/lib/types';

type CompanyTimeToggleProps = {
  isLoading: boolean;
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
};

export function CompanyTimeToggle({
  isLoading,
  activeSesh,
  updateActiveSesh,
}: CompanyTimeToggleProps) {
  const [isCompanyTime, setIsCompanyTime] = useState(activeSesh.company_time);
  const { pb } = usePocketBase();

  useEffect(() => {
    const updateActiveSesh = async () => {
      await pb?.collection('poop_seshes').update(activeSesh.id!, {
        company_time: isCompanyTime,
      });
    };

    updateActiveSesh();
  }, [isCompanyTime]);

  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text>Company Time?</Text>
      <Toggle
        value={isCompanyTime}
        onValueChange={() => setIsCompanyTime(!isCompanyTime)}
        disabled={isLoading}
      />
    </View>
  );
}
