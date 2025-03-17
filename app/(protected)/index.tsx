import MapboxGL from '@rnmapbox/maps';
import React, { useMemo } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';

import { Text } from '~/components/nativewindui/Text';
import { useAuth } from '~/context/authContext';
import { useLocation } from '~/context/locationContext';
import { useMyPoopSeshHistory, usePublicPoopSeshHistory } from '~/hooks/api/usePoopSeshQueries';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';
export default function HomeScreen() {
  const { colors } = useColorScheme();
  const { signOut } = useAuth();

  const { data: history, isLoading: isLoadingHistory } = useMyPoopSeshHistory();
  const { data: publicHistory, isLoading: isLoadingPublicHistory } = usePublicPoopSeshHistory();

  const { userLocation, isLoadingLocation } = useLocation();

  const allHistory = useMemo(() => {
    const combined = [...(history ?? []), ...(publicHistory ?? [])];
    const uniqueMap = new Map(combined.map((item) => [item.id, item]));
    return Array.from(uniqueMap.values());
  }, [history, publicHistory]);

  if (isLoadingLocation || isLoadingHistory || isLoadingPublicHistory) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <MapboxGL.MapView
        style={styles.map}
        logoEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        compassEnabled={false}
        projection="globe"
        styleURL="mapbox://styles/westmorelandcreative/cm7t35gm4003k01s06j3ubktu"
        onLongPress={() => console.log('long press')}
        onPress={() => Keyboard.dismiss()}>
        <MapboxGL.Camera
          zoomLevel={15}
          centerCoordinate={[userLocation.lon, userLocation.lat]}
          animationDuration={2000}
        />
        <MapboxGL.LocationPuck puckBearing="heading" puckBearingEnabled />
        {allHistory?.map((poop) => (
          <MapboxGL.PointAnnotation
            key={poop.id}
            id={poop.id!}
            coordinate={[poop.location.coordinates.lon, poop.location.coordinates.lat]}>
            <Text className="text-2xl">💩</Text>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
      <FAB
        style={[styles.fab, { backgroundColor: colors.primary }]}
        icon="logout"
        color={COLORS.light.foreground}
        onPress={signOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  fab: {
    position: 'absolute',
    top: 48,
    right: 16,
    margin: 16,
  },
});
