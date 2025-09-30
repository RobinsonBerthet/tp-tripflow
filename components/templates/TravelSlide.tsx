import StandardIcon from "@/assets/images/svg-images/map.svg";
import SatelliteIcon from "@/assets/images/svg-images/satellite.svg";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
import MapView, { MapType, PROVIDER_GOOGLE } from "react-native-maps";
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
  return (
    <View style={[styles.container, style]} {...rest}>
      <MapView
        provider={PROVIDER_GOOGLE} // remove if not using Google Maps
        style={styles.map}
        customMapStyle={
          colorScheme === "dark"
            ? [
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
              ]
            : []
        }
        mapType={mapType}
        ref={mapRef}
        showsUserLocation={true}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      ></MapView>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
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
  mapTypeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: "auto",

    backgroundColor: "green",
    position: "absolute",
    top: 60,
    right: 30,
  },
});
