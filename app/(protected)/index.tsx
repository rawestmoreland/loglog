import MapboxGL, { Camera } from '@rnmapbox/maps';
import { isEmpty } from 'lodash';
import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';

import { Text } from '~/components/nativewindui/Text';
import { useLocation } from '~/context/locationContext';
import { useSesh } from '~/context/seshContext';
import { useMyPoopSeshHistory, usePublicPoopSeshHistory } from '~/hooks/api/usePoopSeshQueries';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

export default function HomeScreen() {
  const { colors } = useColorScheme();

  const { setSelectedSesh } = useSesh();

  const { data: history, isLoading: isLoadingHistory } = useMyPoopSeshHistory();
  const { data: publicHistory, isLoading: isLoadingPublicHistory } = usePublicPoopSeshHistory();

  const mapRef = useRef<Camera>(null);

  const { userLocation, isLoadingLocation } = useLocation();

  const allHistory = useMemo(() => {
    const combined = [...(history ?? []), ...(publicHistory ?? [])];
    const uniqueMap = new Map(combined.map((item) => [item.id, item]));
    return Array.from(uniqueMap.values());
  }, [history, publicHistory]);

  if (isLoadingLocation || isLoadingHistory || isLoadingPublicHistory) {
    return <Text>Loading...</Text>;
  }

  const handleCenterCamera = () => {
    if (userLocation && mapRef.current) {
      mapRef.current?.setCamera({
        centerCoordinate: [userLocation.lon, userLocation.lat],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  };

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
        onLongPress={() => console.log('long press')}>
        <MapboxGL.Camera
          ref={mapRef}
          zoomLevel={15}
          centerCoordinate={[userLocation.lon, userLocation.lat]}
          animationDuration={2000}
        />
        <MapboxGL.LocationPuck puckBearing="heading" puckBearingEnabled />
        {allHistory
          ?.filter((poop) => !isEmpty(poop.location?.coordinates) && poop.started && poop.ended)
          .map((poop) => {
            return (
              <MapboxGL.PointAnnotation
                key={poop.id}
                id={poop.id!}
                onSelected={() => setSelectedSesh(poop)}
                coordinate={[poop.location?.coordinates.lon!, poop.location?.coordinates.lat!]}>
                <Text className="text-2xl">💩</Text>
              </MapboxGL.PointAnnotation>
            );
          })}
      </MapboxGL.MapView>
      <FAB
        size="small"
        style={{
          position: 'absolute',
          bottom: 160,
          right: 16,
          margin: 16,
          backgroundColor: colors.primary,
        }}
        icon="crosshairs-gps"
        color={COLORS.light.foreground}
        onPress={handleCenterCamera}
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
  callout: {
    padding: 16,
    borderRadius: 8,
    minWidth: 200,
    maxWidth: 200,
    transform: [{ translateX: -75 }, { translateY: 75 }],
  },
  fab: {
    position: 'absolute',
    top: 48,
    right: 16,
    margin: 16,
  },
});
