import CompassIcon from "@/assets/images/svg-images/compass.svg";
import StandardIcon from "@/assets/images/svg-images/map.svg";
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
  const { queryAll, run, ready } = useSQLite("tripflow.db");
  const { selectedVoyageId, stepsVersion } = useTravelStore();
  const [stepPoints, setStepPoints] = useState<
    { id: number; title: string; latitude: number; longitude: number }[]
  >([]);

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

  useEffect(() => {
    let cancelled = false;
    const loadSteps = async () => {
      if (!ready || !selectedVoyageId) {
        setStepPoints([]);
        return;
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
          [selectedVoyageId]
        );
        if (cancelled) return;
        const points: {
          id: number;
          title: string;
          latitude: number;
          longitude: number;
        }[] = [];

        for (const r of rows) {
          if (cancelled) return;
          const hasCoords =
            typeof r.LATITUDE === "number" &&
            typeof r.LONGITUDE === "number" &&
            isFinite(r.LATITUDE) &&
            isFinite(r.LONGITUDE);
          if (hasCoords) {
            points.push({
              id: r.ID,
              title: r.NOM_LIEU,
              latitude: r.LATITUDE as number,
              longitude: r.LONGITUDE as number,
            });
            continue;
          }
          // Fallback: géocoder la localisation si absente des coordonnées
          const loc = (r.LOCALISATION ?? "").trim();
          if (loc.length > 0) {
            try {
              const res = await Location.geocodeAsync(loc);
              if (cancelled) return;
              if (res && res.length > 0) {
                const g = res[0];
                if (
                  typeof g.latitude === "number" &&
                  typeof g.longitude === "number"
                ) {
                  points.push({
                    id: r.ID,
                    title: r.NOM_LIEU,
                    latitude: g.latitude,
                    longitude: g.longitude,
                  });
                  // Persister les coordonnées pour éviter de régéocoder
                  try {
                    await run(
                      "UPDATE ETAPE SET LATITUDE = ?, LONGITUDE = ? WHERE ID = ? AND ID_VOYAGE = ?",
                      [g.latitude, g.longitude, r.ID, selectedVoyageId]
                    );
                  } catch {}
                }
              }
            } catch {}
          }
        }
        setStepPoints(points);

        if (points.length > 0) {
          try {
            mapRef.current?.fitToCoordinates(points, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            } as any);
          } catch {}
        }
      } catch {
        setStepPoints([]);
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
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        {stepPoints.map((p, idx) => (
          <Marker
            key={`step-${p.id}`}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            title={p.title}
            description={`Étape ${idx + 1}`}
          />
        ))}
        {stepPoints.length >= 2 ? (
          <Polyline
            coordinates={stepPoints.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor={colorScheme === "dark" ? "#90caf9" : "#1976d2"}
            strokeWidth={3}
          />
        ) : null}
      </MapView>
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
