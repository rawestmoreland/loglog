import MapboxGL, { Camera, MapView } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { isEmpty } from 'lodash';
import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';

import { useLocation } from '~/context/locationContext';
import { useMapViewContext } from '~/context/mapViewContext';
import { useSesh } from '~/context/seshContext';
import {
  useFriendsPoopSeshHistory,
  useMyPoopSeshHistory,
  usePalPoopSeshHistory,
  usePublicPoopSeshHistory,
} from '~/hooks/api/usePoopSeshQueries';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const pixelSnapPoint = SCREEN_HEIGHT * 0.2;

const POOP_MARKER = require('~/assets/poo-pile.png');

export default function HomeScreen() {
  const { colors } = useColorScheme();

  const { poopsToView, palSelected } = useMapViewContext();

  const { setSelectedSesh } = useSesh();

  const { data: myHistory, isLoading: isLoadingMyHistory } = useMyPoopSeshHistory();
  const { data: publicHistory, isLoading: isLoadingPublicHistory } = usePublicPoopSeshHistory();
  const { data: friendsHistory, isLoading: isLoadingFriendsHistory } = useFriendsPoopSeshHistory();
  const { data: palHistory, isLoading: isLoadingPalHistory } = usePalPoopSeshHistory();

  const cameraRef = useRef<Camera>(null);
  const mapRef = useRef<MapView>(null);

  const { userLocation, isLoadingLocation, setUserLocation } = useLocation();

  const allHistory = useMemo(() => {
    const combined = [...(myHistory ?? []), ...(publicHistory ?? [])];
    const uniqueMap = new Map(combined.map((item) => [item.id, item]));
    return Array.from(uniqueMap.values());
  }, [myHistory, publicHistory, poopsToView]);

  const historyToMap = useMemo(() => {
    switch (poopsToView) {
      case 'yours':
        return myHistory;
      case 'friends':
        if (palSelected !== 'all') {
          return palHistory;
        }
        return friendsHistory;
      default:
        return allHistory;
    }
  }, [
    myHistory,
    publicHistory,
    friendsHistory,
    poopsToView,
    allHistory,
    palSelected,
    isLoadingPalHistory,
  ]);

  const handleClusterPress = (feature: any) => {
    if (feature.properties?.cluster) {
      if (cameraRef && cameraRef.current) {
        cameraRef.current?.setCamera({
          centerCoordinate: feature.geometry.coordinates,
          zoomLevel: 15,
          animationDuration: 1000,
        });
      }
    } else {
      setSelectedSesh(feature.properties);
    }
  };

  if (
    isLoadingLocation ||
    isLoadingMyHistory ||
    isLoadingPublicHistory ||
    isLoadingFriendsHistory
  ) {
    return (
      <View
        style={[StyleSheet.absoluteFillObject, styles.loadingContainer]}
        className="bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleCenterCamera = (location?: { lat: number; lon: number }) => {
    if (userLocation && cameraRef.current) {
      cameraRef.current?.setCamera({
        centerCoordinate: [location?.lon ?? userLocation.lon, location?.lat ?? userLocation.lat],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <MapboxGL.MapView
        ref={mapRef}
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
        <MapboxGL.Images
          images={{
            'poo-pile': POOP_MARKER,
          }}
        />
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={15}
          centerCoordinate={[userLocation.lon, userLocation.lat]}
          animationDuration={2000}
        />
        <MapboxGL.LocationPuck puckBearing="heading" puckBearingEnabled />
        <MapboxGL.ShapeSource
          id="poopSource"
          cluster
          clusterMaxZoomLevel={14}
          clusterRadius={50}
          onPress={(e) => handleClusterPress(e.features[0])}
          shape={{
            type: 'FeatureCollection',
            features:
              historyToMap
                ?.filter((poop) => !isEmpty(poop.coords) && poop.started && poop.ended)
                .map((poop) => ({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [poop.coords?.lon!, poop.coords?.lat!],
                  },
                  properties: {
                    ...poop,
                  },
                })) || [],
          }}>
          {/* White circle background for clusters */}
          <MapboxGL.CircleLayer
            id="clustersBackground"
            filter={['has', 'point_count']}
            style={{
              circleColor: 'white',
              circleRadius: 30,
              circleStrokeWidth: 2,
              circleStrokeColor: colors.primary,
            }}
          />
          {/* Poop emoji for clusters */}
          <MapboxGL.SymbolLayer
            id="clusteredPoints"
            filter={['has', 'point_count']}
            style={{
              iconImage: 'poo-pile',
              iconSize: 0.15,
              iconAllowOverlap: true,
              iconOffset: [0, -40], // Move the emoji up slightly
              textField: ['get', 'point_count_abbreviated'],
              textSize: 14,
              textColor: '#000',
              textOffset: [0, 1], // Move the text down below the emoji
            }}
          />
          <MapboxGL.SymbolLayer
            id="singlePoint"
            filter={['!', ['has', 'point_count']]}
            style={{
              iconImage: 'poo-pile',
              iconSize: 0.2,
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
      <FAB
        size="small"
        style={{
          position: 'absolute',
          top: SCREEN_HEIGHT - pixelSnapPoint - 80,
          right: 16,
          margin: 16,
          backgroundColor: colors.primary,
        }}
        icon="crosshairs-gps"
        color={COLORS.light.foreground}
        onPress={async () => {
          const currentLocation = await Location.getCurrentPositionAsync();
          setUserLocation({
            lat: currentLocation.coords.latitude,
            lon: currentLocation.coords.longitude,
          });
          handleCenterCamera({
            lat: currentLocation.coords.latitude,
            lon: currentLocation.coords.longitude,
          });
        }}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
