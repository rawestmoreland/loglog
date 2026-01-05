import { useAuth } from '@/context/authContext';
import { useLocation } from '@/context/locationContext';
import { useMapViewContext } from '@/context/mapViewContext';
import { useNetwork } from '@/context/networkContext';
import { useSesh } from '@/context/seshContext';
import { useToilet } from '@/context/toiletContext';
import { useFollowing } from '@/hooks/api/usePoopPalsQueries';
import {
  usePalPoopSeshHistory,
  usePublicPoopSeshHistory,
} from '@/hooks/api/usePoopSeshQueries';
import { useAverageToiletRatings } from '@/hooks/api/useToiletRatingsQueries';
import { useThemeColor } from '@/hooks/use-theme-color';
import MapboxGL from '@rnmapbox/maps';
import { MapPinOff, WifiOff } from '@tamagui/lucide-icons';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const POOP_MARKER = require('@/assets/images/poo-pile.png');
const TOILET_MARKER = require('@/assets/images/toilet.png');

export default function ProtectedIndexScreen() {
  const { isConnected, isNetworkInitialized } = useNetwork();

  const primary = useThemeColor({}, 'primary');

  const { pooProfile } = useAuth();

  const { poopsToView, palSelected, registerRecenterCallback } =
    useMapViewContext();
  const { data: following, isLoading: isLoadingFollowing } = useFollowing();

  const { setSelectedSesh } = useSesh();
  const { setSelectedToilet } = useToilet();

  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [cameraCenter, setCameraCenter] = useState<{
    lon: number;
    lat: number;
  } | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number | null>(null);

  const [viewportBounds, setViewportBounds] = useState<{
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
  } | null>(null);

  const { userLocation, hasLocation } = useLocation();

  const { data: publicHistory } = usePublicPoopSeshHistory();

  const { data: averageToiletRatings } = useAverageToiletRatings();

  const { data: palHistory } = usePalPoopSeshHistory();

  const myHistory = useMemo(() => {
    if (!viewportBounds || !publicHistory || !pooProfile) {
      return [];
    }

    return publicHistory.filter((poop) => poop.poo_profile === pooProfile.id);
  }, [viewportBounds, publicHistory, pooProfile]);

  const friendsHistory = useMemo(() => {
    if (isLoadingFollowing || !following?.length || !publicHistory?.length) {
      return [];
    }

    const followingIds = following.map((friend) => friend.following);

    return publicHistory.filter((poop) =>
      followingIds.includes(poop.poo_profile!)
    );
  }, [isLoadingFollowing, following, publicHistory]);

  const allHistory = useMemo(() => {
    const combined = [...(myHistory ?? []), ...(publicHistory ?? [])];
    const uniqueMap = new Map(combined.map((item) => [item.id, item]));
    return Array.from(uniqueMap.values());
  }, [myHistory, publicHistory]);

  const historyToMap = useMemo(() => {
    switch (poopsToView) {
      case 'yours':
        return myHistory;
      case 'friends':
        if (!!palSelected) {
          return palHistory;
        }
        return friendsHistory;
      default:
        return allHistory;
    }
  }, [
    poopsToView,
    palSelected,
    palHistory,
    myHistory,
    friendsHistory,
    allHistory,
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
      if (poopsToView === 'toilets') {
        setSelectedToilet(feature.properties);
      } else {
        setSelectedSesh(feature.properties);
      }
    }
  };

  const handleRecenterCamera = useCallback(() => {
    if (cameraRef.current && userLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.lon, userLocation.lat],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
  }, [userLocation]);

  useEffect(() => {
    registerRecenterCallback(handleRecenterCamera);
  }, [registerRecenterCallback, handleRecenterCamera]);

  return (
    <View style={styles.container}>
      {!isNetworkInitialized ||
      typeof isConnected === 'undefined' ||
      typeof hasLocation === 'undefined' ? (
        <ActivityIndicator size='large' color={String(primary)} />
      ) : isConnected && hasLocation ? (
        <MapboxGL.MapView
          ref={mapRef}
          style={styles.map}
          onMapIdle={async () => {
            const center = await mapRef.current?.getCenter();
            const zoom = await mapRef.current?.getZoom();
            const bounds = await mapRef.current?.getVisibleBounds();
            if (center && zoom) {
              setCameraCenter({ lon: center[0], lat: center[1] });
              setCameraZoom(zoom);
            }
            if (bounds) {
              setViewportBounds({
                minLon: Math.min(bounds[0][0], bounds[1][0]),
                minLat: Math.min(bounds[0][1], bounds[1][1]),
                maxLon: Math.max(bounds[0][0], bounds[1][0]),
                maxLat: Math.max(bounds[0][1], bounds[1][1]),
              });
            }
          }}
          logoEnabled={false}
          scaleBarEnabled={false}
          attributionEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          compassEnabled={false}
          projection='globe'
          styleURL='mapbox://styles/westmorelandcreative/cm7t35gm4003k01s06j3ubktu'
          onLongPress={() => console.log('long press')}
        >
          <MapboxGL.Images
            images={{
              'poo-pile': POOP_MARKER,
              toilet: TOILET_MARKER,
            }}
          />
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={cameraZoom ?? 15}
            centerCoordinate={
              cameraCenter
                ? [cameraCenter.lon, cameraCenter.lat]
                : [userLocation.lon, userLocation.lat]
            }
            animationDuration={2000}
          />
          <MapboxGL.LocationPuck puckBearing='heading' puckBearingEnabled />
          <MapboxGL.ShapeSource
            id='poopSource'
            cluster
            clusterMaxZoomLevel={14}
            clusterRadius={50}
            onPress={(e) => handleClusterPress(e.features[0])}
            shape={{
              type: 'FeatureCollection',
              features:
                poopsToView === 'toilets'
                  ? averageToiletRatings?.map((toilet) => ({
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: [
                          toilet.expand?.place_id?.location?.lon!,
                          toilet.expand?.place_id?.location?.lat!,
                        ],
                      },
                      properties: {
                        ...toilet,
                      },
                    })) || []
                  : historyToMap
                      ?.filter(
                        (poop) =>
                          !isEmpty(poop.coords) &&
                          poop.started &&
                          poop.ended &&
                          !poop.is_airplane
                      )
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
            }}
          >
            {/* White circle background for clusters */}
            <MapboxGL.CircleLayer
              id='clustersBackground'
              filter={['has', 'point_count']}
              style={{
                circleColor: 'white',
                circleRadius: 30,
                circleStrokeWidth: 2,
                // @ts-ignore
                circleStrokeColor: primary,
              }}
            />
            {/* Poop emoji for clusters */}
            <MapboxGL.SymbolLayer
              id='clusteredPoints'
              filter={['has', 'point_count']}
              style={{
                iconImage: poopsToView === 'toilets' ? 'toilet' : 'poo-pile',
                iconSize: poopsToView === 'toilets' ? 0.1 : 0.2,
                iconAllowOverlap: true,
                iconOffset: [0, -40], // Move the emoji up slightly
                textField: ['get', 'point_count_abbreviated'],
                textSize: 14,
                textColor: '#000',
                textOffset: [0, 1], // Move the text down below the emoji
              }}
            />
            <MapboxGL.SymbolLayer
              id='singlePoint'
              filter={['!', ['has', 'point_count']]}
              style={{
                iconImage: poopsToView === 'toilets' ? 'toilet' : 'poo-pile',
                iconSize: 0.2,
              }}
            />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>
      ) : hasLocation === false ? (
        <View style={styles.container}>
          <MapPinOff size={40} />
        </View>
      ) : isConnected === false ? (
        <View style={styles.container}>
          <WifiOff size={40} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
