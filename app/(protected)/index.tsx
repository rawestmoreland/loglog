import MapboxGL from '@rnmapbox/maps';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { AuthContext, useAuth } from '~/context/authContext';
import { useLocation } from '~/context/locationContext';
import { useSesh } from '~/context/seshContext';
import { useMyPoopSeshHistory, usePublicPoopSeshHistory } from '~/hooks/api/usePoopSeshQueries';

export default function HomeScreen() {
  const { user } = useAuth();
  const { signOut } = useContext(AuthContext);

  const { activeSesh, isLoadingActiveSesh, startSesh, endSesh } = useSesh();

  const { data: history, isLoading: isLoadingHistory } = useMyPoopSeshHistory();
  const { data: publicHistory, isLoading: isLoadingPublicHistory } = usePublicPoopSeshHistory();

  const { userLocation, isLoadingLocation } = useLocation();

  if (isLoadingLocation || isLoadingHistory || isLoadingPublicHistory) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.page}>
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
          zoomLevel={15}
          centerCoordinate={[userLocation.lon, userLocation.lat]}
          animationDuration={2000}
        />
        <MapboxGL.LocationPuck puckBearing="heading" puckBearingEnabled />
        {publicHistory?.map((poop) => (
          <MapboxGL.PointAnnotation
            key={poop.id}
            id={poop.id!}
            coordinate={[poop.location.coordinates.lon, poop.location.coordinates.lat]}>
            <Text className="text-2xl">💩</Text>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'red',
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
    bottom: 16,
    right: 16,
    margin: 16,
  },
});
