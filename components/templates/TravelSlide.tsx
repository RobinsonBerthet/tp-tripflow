import CompassIcon from "@/assets/images/svg-images/compass.svg";
import StandardIcon from "@/assets/images/svg-images/map.svg";
import MarkerIcon from "@/assets/images/svg-images/marker.svg";
import SatelliteIcon from "@/assets/images/svg-images/satellite.svg";
import { useColorScheme } from "@/hooks/use-color-scheme";
import useSQLite from "@/hooks/use-sqlite";
import { useTravelStore } from "@/stores/travelStore";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import MapView, {
  MapType,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { Colors } from "../../constants/theme";
import SvgIcon from "../atomes/SvgIcon";
import ThemedTouchable from "../atomes/ThemedTouchable";

export type TravelSlideProps = ViewProps & {
  title?: string;
  description?: string;
};

export default function TravelSlide({
  title = "Voyages",
  description = "Bienvenue dans TripFlow",
  style,
  ...rest
}: TravelSlideProps) {
  const [mapType, setMapType] = useState<MapType>("standard");
  const colorScheme = useColorScheme() ?? "light";
  const mapRef = useRef<MapView | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [markerTracksViewChanges, setMarkerTracksViewChanges] = useState(true);
  const [selectedEdgeId, setSelectedEdgeId] = useState<number | null>(null);
  const { queryAll, run, ready } = useSQLite("tripflow.db");
  const { selectedVoyageId, stepsVersion } = useTravelStore();
  const [stepPoints, setStepPoints] = useState<
    { id: number; title: string; latitude: number; longitude: number }[]
  >([]);
  const stepOrderRef = useRef<Record<number, number>>({});

  const darkMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#111111" }],
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#212121" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#383838" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#000000" }],
    },
  ];

  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  useEffect(() => {
    const initLocation = async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          // Tente d'ouvrir les paramètres (Android). Sur iOS, affiche une alerte.
          try {
            if (
              Platform.OS === "android" &&
              Location.enableNetworkProviderAsync
            ) {
              await Location.enableNetworkProviderAsync();
            }
          } catch {}
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission requise",
            "Activez la localisation pour centrer la carte sur votre position."
          );
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = position.coords;
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          600
        );
      } catch (error) {
        console.warn("Erreur de localisation:", error);
      }
    };

    void initLocation();
  }, []);

  // Laisser les Marker suivre les changements brièvement pour laisser le SVG se rendre correctement
  useEffect(() => {
    setMarkerTracksViewChanges(true);
    const t = setTimeout(() => setMarkerTracksViewChanges(false), 1200);
    return () => clearTimeout(t);
  }, [stepPoints.length, mapType, colorScheme]);

  // Forcer un léger rafraîchissement quand la sélection change pour garantir l'affichage
  useEffect(() => {
    if (selectedEdgeId != null) {
      setMarkerTracksViewChanges(true);
      const t = setTimeout(() => setMarkerTracksViewChanges(false), 500);
      return () => clearTimeout(t);
    }
  }, [selectedEdgeId]);

  const focusOnStep = (
    point: { latitude: number; longitude: number },
    animateMs = 400
  ) => {
    try {
      mapRef.current?.animateToRegion(
        {
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        animateMs
      );
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    const loadSteps = async () => {
      if (!selectedVoyageId) {
        setStepPoints([]);
        return;
      }
      if (!ready) {
        return; // attendre la DB sans vider l'affichage actuel
      }
      try {
        type StepRow = {
          ID: number;
          ID_VOYAGE: number;
          NOM_LIEU: string;
          LOCALISATION: string;
          LATITUDE: number | null;
          LONGITUDE: number | null;
          DATE_DEBUT: string;
        };
        const rows = await queryAll<StepRow>(
          "SELECT ID, ID_VOYAGE, NOM_LIEU, LOCALISATION, LATITUDE, LONGITUDE, DATE_DEBUT FROM ETAPE WHERE ID_VOYAGE = ? ORDER BY DATE_DEBUT ASC",
          [Number(selectedVoyageId)]
        );

        if (cancelled) return;
        // mémoriser l'ordre pour conserver le tri chronologique
        const order: Record<number, number> = {};
        rows.forEach((r, i) => {
          order[r.ID] = i;
        });
        stepOrderRef.current = order;

        const withCoords: {
          id: number;
          title: string;
          latitude: number;
          longitude: number;
        }[] = [];
        const toGeocode: StepRow[] = [];

        for (const r of rows) {
          if (cancelled) return;
          const hasCoords =
            typeof r.LATITUDE === "number" &&
            typeof r.LONGITUDE === "number" &&
            isFinite(r.LATITUDE) &&
            isFinite(r.LONGITUDE);
          if (hasCoords) {
            withCoords.push({
              id: r.ID,
              title: r.NOM_LIEU,
              latitude: r.LATITUDE as number,
              longitude: r.LONGITUDE as number,
            });
          } else {
            toGeocode.push(r);
          }
        }

        // Afficher immédiatement ce qui a déjà des coordonnées
        const sortByOrder = (a: { id: number }, b: { id: number }) =>
          (stepOrderRef.current[a.id] ?? 0) - (stepOrderRef.current[b.id] ?? 0);
        setStepPoints([...withCoords].sort(sortByOrder));

        // Lancer le géocodage en arrière-plan et mettre à jour progressivement
        for (const r of toGeocode) {
          if (cancelled) return;
          const loc = (r.LOCALISATION ?? "").trim();
          if (loc.length === 0) continue;
          try {
            const res = await Location.geocodeAsync(loc);
            if (cancelled) return;
            const g = res?.[0];
            if (
              g &&
              typeof g.latitude === "number" &&
              typeof g.longitude === "number"
            ) {
              const newPoint = {
                id: r.ID,
                title: r.NOM_LIEU,
                latitude: g.latitude,
                longitude: g.longitude,
              };
              setStepPoints((prev) => {
                const next = [...prev, newPoint].sort(sortByOrder);
                return next;
              });
              try {
                await run(
                  "UPDATE ETAPE SET LATITUDE = ?, LONGITUDE = ? WHERE ID = ? AND ID_VOYAGE = ?",
                  [g.latitude, g.longitude, r.ID, Number(selectedVoyageId)]
                );
              } catch {}
            }
          } catch {}
        }

        // Ajuster la vue sur l'ensemble des points si disponibles
        const finalPoints = withCoords.concat();
        // Les points géocodés ont déjà été ajoutés via setStepPoints progressif
        const current = finalPoints.length > 0 ? finalPoints : [];
        if (!cancelled) {
          const snapshot = current.length > 0 ? current : [];
          if (snapshot.length > 0) {
            try {
              mapRef.current?.fitToCoordinates(snapshot, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              } as any);
            } catch {}
          }
        }
      } catch (e) {
        console.warn("Erreur lors du chargement des étapes:", e);
        // En cas d'erreur, ne pas vider brutalement pour éviter le clignotement
      }
    };
    void loadSteps();
    return () => {
      cancelled = true;
    };
  }, [selectedVoyageId, queryAll, run, stepsVersion, ready]);

  const centerOnUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
    } catch {}
  };
  const resetNorth = () => {
    try {
      mapRef.current?.animateCamera(
        { heading: 0, pitch: 0 },
        { duration: 300 }
      );
    } catch {}
  };
  return (
    <View style={[styles.container, style]} {...rest}>
      <MapView
        provider={PROVIDER_GOOGLE} // remove if not using Google Maps
        style={styles.map}
        customMapStyle={colorScheme === "dark" ? darkMapStyle : []}
        mapType={mapType}
        ref={mapRef}
        showsMyLocationButton={false}
        showsUserLocation={true}
        showsCompass={false}
        toolbarEnabled={false} // Android: cache la barre d'outils (itinéraire)
        zoomControlEnabled={false} // Android: cache les boutons + / -
        showsScale={false} // iOS: cache l'échelle
        onMapReady={() => {
          mapRef.current
            ?.getCamera()
            .then((cam) => {
              if (cam && typeof cam.heading === "number")
                setHeading(cam.heading);
            })
            .catch(() => {});
        }}
        onRegionChangeComplete={() => {
          mapRef.current
            ?.getCamera()
            .then((cam) => {
              if (cam && typeof cam.heading === "number")
                setHeading(cam.heading);
            })
            .catch(() => {});
        }}
        onPress={() => setSelectedEdgeId(null)}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        {stepPoints.map((p, idx) => {
          const isEdge = idx === 0 || idx === stepPoints.length - 1;
          if (!isEdge) return null;
          const markerColor = idx === 0 ? "#e53935" : "#43a047"; // rouge départ, vert arrivée
          return (
            <Marker
              key={`step-${p.id}`}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={markerTracksViewChanges}
              title={p.title}
              description={`Étape ${idx + 1}`}
              onPress={() => {
                focusOnStep(
                  { latitude: p.latitude, longitude: p.longitude },
                  450
                );
                setSelectedEdgeId(p.id);
              }}
            >
              <View style={styles.markerContainer}>
                <SvgIcon Icon={MarkerIcon} size={34} color={markerColor} />
                {selectedEdgeId === p.id ? (
                  <View style={styles.bubbleWrapper} pointerEvents="none">
                    <View
                      style={[
                        styles.calloutBubble,
                        { backgroundColor: Colors[theme].background },
                      ]}
                    >
                      <Text
                        style={[styles.calloutTitle, { color: markerColor }]}
                      >
                        {idx === 0 ? "Départ" : "Arrivée"}
                      </Text>
                      <Text
                        style={[
                          styles.calloutSubtitle,
                          { color: Colors[theme].text },
                        ]}
                        numberOfLines={2}
                      >
                        {p.title}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.calloutArrow,
                        { borderTopColor: Colors[theme].background },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            </Marker>
          );
        })}
        {stepPoints.length >= 2 ? (
          <>
            {/* Large outline for better contrast on any background */}
            <Polyline
              coordinates={stepPoints.map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }))}
              strokeColor={
                colorScheme === "dark"
                  ? "rgba(0,0,0,0.6)"
                  : "rgba(255,255,255,0.9)"
              }
              strokeWidth={7}
              geodesic
            />
            {/* Main route on top */}
            <Polyline
              coordinates={stepPoints.map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }))}
              strokeColor={colorScheme === "dark" ? "#90caf9" : "#1976d2"}
              strokeWidth={3}
              geodesic
            />
          </>
        ) : null}
      </MapView>
      <View
        style={[
          styles.stepsListContainer,
          { backgroundColor: Colors[theme].background },
        ]}
      >
        {stepPoints.map((p, idx) => (
          <ThemedTouchable
            key={`stepname-${p.id}`}
            onPress={() => {
              focusOnStep(
                { latitude: p.latitude, longitude: p.longitude },
                450
              );
              const idxInList = stepPoints.findIndex((sp) => sp.id === p.id);
              const isEdgeLocal =
                idxInList === 0 || idxInList === stepPoints.length - 1;
              setSelectedEdgeId(isEdgeLocal ? p.id : null);
            }}
            style={{ paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={[styles.stepItem, { color: Colors[theme].text }]}>
              {idx + 1}. {p.title}
            </Text>
          </ThemedTouchable>
        ))}
      </View>
      <View
        style={[
          styles.buttonsContainer,
          { backgroundColor: Colors[theme].background },
        ]}
      >
        <TouchableOpacity onPress={centerOnUser} style={styles.locateMeButton}>
          <View
            style={{
              width: 15,
              height: 15,
              borderRadius: 7.5,
              backgroundColor: "#1e88e5",
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={resetNorth} style={styles.compassButton}>
          <View
            style={[
              styles.compassDial,
              { transform: [{ rotate: `${-heading}deg` }] },
            ]}
          >
            <SvgIcon Icon={CompassIcon} size={22} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            setMapType(mapType === "standard" ? "satellite" : "standard")
          }
          style={[styles.mapTypeButton, { backgroundColor: "white" }]}
        >
          <SvgIcon
            Icon={mapType === "standard" ? StandardIcon : SatelliteIcon}
            style={{ margin: "auto" }}
            size={26}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
  },
  buttonsContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    gap: 10,
    paddingHorizontal: "3%",
    paddingVertical: "5%",
    borderRadius: 30,
  },
  stepsListContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    gap: 6,
    paddingHorizontal: "3%",
    paddingVertical: "5%",
    borderRadius: 12,
    maxWidth: "60%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  stepItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  compassDial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  compassNeedleNorth: {
    position: "absolute",
    top: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#e53935",
  },
  compassNeedleSouth: {
    position: "absolute",
    bottom: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#607D8B",
  },
  title: {
    fontSize: 28,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
  },
  map: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    backgroundColor: "blue",
  },
  calloutContainer: {
    alignItems: "center",
  },
  calloutBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    maxWidth: 220,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 12,
  },
  calloutArrow: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bubbleWrapper: {
    position: "absolute",
    bottom: 38, // juste au-dessus du marker (34) avec un petit espace
    alignItems: "center",
  },
  markerBubble: {
    minWidth: 24,
    minHeight: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  markerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  markerPointer: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  locateMeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  compassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  mapTypeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: "auto",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    backgroundColor: "white",
  },
});
