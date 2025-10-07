import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import useSQLite from "@/hooks/use-sqlite";
import { useTravelStore } from "@/stores/travelStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type StepForm = {
  title: string;
  location: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  description: string;
  latitude: number | null;
  longitude: number | null;
};

export default function AddStepScreen() {
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const voyageId = useMemo(() => Number(idParam), [idParam]);

  const { run } = useSQLite("tripflow.db");
  const { bumpStepsVersion } = useTravelStore();

  const [form, setForm] = useState<StepForm>({
    title: "",
    location: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    description: "",
    latitude: null,
    longitude: null,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const parseDateOrToday = (v: string) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  };
  const formatDateDisplay = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = async () => {
    if (!voyageId || Number.isNaN(voyageId)) {
      Alert.alert("Erreur", "Voyage invalide.");
      return;
    }
    if (!form.title || !form.location || !form.startDate || !form.endDate) {
      Alert.alert("Champs requis", "Veuillez compléter tous les champs.");
      return;
    }
    try {
      setLoading(true);
      let lat = form.latitude;
      let lng = form.longitude;
      if (lat == null || lng == null) {
        try {
          const results = await Location.geocodeAsync(form.location);
          if (!results || results.length === 0) {
            Alert.alert(
              "Localisation manquante",
              "Géocodez l'adresse ou choisissez un point sur la carte."
            );
            return;
          }
          const best = results[0];
          if (
            typeof best.latitude === "number" &&
            typeof best.longitude === "number"
          ) {
            lat = best.latitude;
            lng = best.longitude;
          } else {
            Alert.alert(
              "Localisation invalide",
              "Impossible de déterminer des coordonnées valides."
            );
            return;
          }
        } catch {
          Alert.alert(
            "Erreur",
            "Géocodage impossible. Sélectionnez un point sur la carte."
          );
          return;
        }
      }
      await run(
        "INSERT INTO ETAPE (ID_VOYAGE, NOM_LIEU, LOCALISATION, DATE_DEBUT, DATE_FIN, DESCRIPTION, LATITUDE, LONGITUDE) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          voyageId,
          form.title,
          form.location,
          form.startDate,
          form.endDate,
          form.description,
          lat,
          lng,
        ]
      );
      try {
        bumpStepsVersion();
      } catch {}
      router.back();
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer l'étape.");
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async () => {
    if (!form.location.trim()) {
      Alert.alert("Adresse manquante", "Saisissez une localisation.");
      return;
    }
    try {
      setLoading(true);
      const results = await Location.geocodeAsync(form.location);
      if (!results || results.length === 0) {
        Alert.alert("Introuvable", "Adresse non trouvée.");
        return;
      }
      const best = results[0];
      if (
        typeof best.latitude === "number" &&
        typeof best.longitude === "number"
      ) {
        setForm((s) => ({
          ...s,
          latitude: best.latitude,
          longitude: best.longitude,
        }));
        setMapRegion({
          latitude: best.latitude,
          longitude: best.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch {
      Alert.alert("Erreur", "Géocodage impossible.");
    } finally {
      setLoading(false);
    }
  };

  const setFromMap = async (lat: number, lng: number) => {
    setForm((s) => ({ ...s, latitude: lat, longitude: lng }));
    setMapRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText style={styles.title}>Nouvelle étape</ThemedText>

          <View style={styles.field}>
            <ThemedLabel>Nom du lieu</ThemedLabel>
            <ThemedTextInput
              placeholder="Ex: Musée du Louvre"
              value={form.title}
              onChangeText={(t) => setForm((s) => ({ ...s, title: t }))}
            />
          </View>

          <View style={styles.field}>
            <ThemedLabel>Localisation du lieu</ThemedLabel>
            <ThemedTextInput
              placeholder="Ex: Paris, France"
              value={form.location}
              onChangeText={(t) => setForm((s) => ({ ...s, location: t }))}
            />
            <View style={{ marginTop: 8 }}>
              <ThemedButton
                title={loading ? "Recherche…" : "Géocoder l'adresse"}
                onPress={geocodeAddress}
                disabled={loading}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <ThemedLabel>Position sur la carte</ThemedLabel>
            <MapView
              style={{ width: "100%", height: 220, borderRadius: 8 }}
              initialRegion={mapRegion}
              region={mapRegion}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                void setFromMap(latitude, longitude);
              }}
            >
              {typeof form.latitude === "number" &&
                typeof form.longitude === "number" && (
                  <Marker
                    coordinate={{
                      latitude: form.latitude,
                      longitude: form.longitude,
                    }}
                  />
                )}
            </MapView>
            {typeof form.latitude === "number" &&
              typeof form.longitude === "number" && (
                <ThemedText>
                  {`Lat: ${form.latitude.toFixed(
                    6
                  )}  Lng: ${form.longitude.toFixed(6)}`}
                </ThemedText>
              )}
          </View>

          <View style={styles.field}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setShowStartPicker(true);
              }}
            >
              <ThemedLabel>
                {`Date de début: ${formatDateDisplay(
                  parseDateOrToday(form.startDate)
                )}`}
              </ThemedLabel>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={parseDateOrToday(form.startDate)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  if (d) setForm((s) => ({ ...s, startDate: formatDate(d) }));
                  setShowStartPicker(false);
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setShowEndPicker(true);
              }}
            >
              <ThemedLabel>
                {`Date de fin: ${formatDateDisplay(
                  parseDateOrToday(form.endDate)
                )}`}
              </ThemedLabel>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={parseDateOrToday(form.endDate)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  if (d) setForm((s) => ({ ...s, endDate: formatDate(d) }));
                  setShowEndPicker(false);
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <ThemedLabel>Description / activité</ThemedLabel>
            <ThemedTextInput
              placeholder="Activités prévues"
              value={form.description}
              multiline
              onChangeText={(t) => setForm((s) => ({ ...s, description: t }))}
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>

          <ThemedButton
            title={loading ? "Enregistrement…" : "Ajouter l'étape"}
            onPress={handleSave}
            disabled={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  field: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
});
