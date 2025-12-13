import { useAuth } from '@/context/authContext';
import { useLocation } from '@/context/locationContext';
import { useMapViewContext } from '@/context/mapViewContext';
import { useSesh } from '@/context/seshContext';
import { useFollowing } from '@/hooks/api/usePoopPalsQueries';
import {
  usePalPoopSeshHistory,
  usePublicPoopSeshHistory,
} from '@/hooks/api/usePoopSeshQueries';
import { useThemeColor } from '@/hooks/use-theme-color';
import MapboxGL from '@rnmapbox/maps';
import { isEmpty } from 'lodash';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const POOP_MARKER = require('@/assets/images/poo-pile.png');

export default function ProtectedIndexScreen() {
  const primary = useThemeColor({}, 'primary');

  const { pooProfile } = useAuth();

  const { poopsToView, palSelected } = useMapViewContext();
  const { data: following, isLoading: isLoadingFollowing } = useFollowing();

  const { setSelectedSesh } = useSesh();

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

  const { userLocation } = useLocation();

  const { data: publicHistory } = usePublicPoopSeshHistory();

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
      setSelectedSesh(feature.properties);
    }
  };

  return (
    <View style={styles.container}>
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
              historyToMap
                ?.filter(
                  (poop) => !isEmpty(poop.coords) && poop.started && poop.ended
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
            id='singlePoint'
            filter={['!', ['has', 'point_count']]}
            style={{
              iconImage: 'poo-pile',
              iconSize: 0.2,
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
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
