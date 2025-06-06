import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { Toggle } from '~/components/nativewindui/Toggle';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import type { PoopSesh } from '~/lib/types';

type PublicToggleProps = {
  isLoading: boolean;
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
};

export function PublicToggle({ isLoading, activeSesh, updateActiveSesh }: PublicToggleProps) {
  const [isPublic, setIsPublic] = useState(activeSesh.is_public);
  const { pb } = usePocketBase();

  useEffect(() => {
    const updateActiveSesh = async () => {
      await pb?.collection('poop_seshes').update(activeSesh.id!, {
        is_public: isPublic,
      });
    };

    updateActiveSesh();
  }, [isPublic]);

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm">Public log?</Text>
      <Toggle value={isPublic} onValueChange={() => setIsPublic(!isPublic)} disabled={isLoading} />
    </View>
  );
}
