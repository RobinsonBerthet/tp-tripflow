import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import useSQLite from "@/hooks/use-sqlite";
import { useTravelStore } from "@/stores/travelStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

type StepRow = {
  ID: number;
  ID_VOYAGE: number;
  NOM_LIEU: string;
  LOCALISATION: string;
  DATE_DEBUT: string;
  DATE_FIN: string;
  DESCRIPTION: string;
  LATITUDE: number | null;
  LONGITUDE: number | null;
};

export default function EditStepScreen() {
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const stepParam = Array.isArray(params.stepId)
    ? params.stepId[0]
    : params.stepId;
  const voyageId = useMemo(() => Number(idParam), [idParam]);
  const stepId = useMemo(() => Number(stepParam), [stepParam]);

  const { queryOne, run } = useSQLite("tripflow.db", {
    schema: [
      `CREATE TABLE IF NOT EXISTS ETAPE (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_VOYAGE INTEGER NOT NULL,
        NOM_LIEU TEXT NOT NULL,
        LOCALISATION TEXT NOT NULL,
        DATE_DEBUT TEXT NOT NULL,
        DATE_FIN TEXT NOT NULL,
        DESCRIPTION TEXT NOT NULL,
        LATITUDE REAL,
        LONGITUDE REAL
      )`,
    ],
  });

  const { bumpStepsVersion } = useTravelStore();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    location: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    description: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
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

  useEffect(() => {
    const load = async () => {
      try {
        if (!voyageId || !stepId || Number.isNaN(stepId)) return;
        const row = await queryOne<StepRow>(
          "SELECT * FROM ETAPE WHERE ID = ? AND ID_VOYAGE = ?",
          [stepId, voyageId]
        );
        if (row) {
          setForm({
            title: row.NOM_LIEU,
            location: row.LOCALISATION,
            startDate: row.DATE_DEBUT,
            endDate: row.DATE_FIN,
            description: row.DESCRIPTION,
            latitude: row.LATITUDE ?? null,
            longitude: row.LONGITUDE ?? null,
          });
          const lat = row.LATITUDE ?? 48.8566;
          const lng = row.LONGITUDE ?? 2.3522;
          setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [voyageId, stepId, queryOne]);

  const handleSave = async () => {
    try {
      await run(
        "UPDATE ETAPE SET NOM_LIEU = ?, LOCALISATION = ?, DATE_DEBUT = ?, DATE_FIN = ?, DESCRIPTION = ?, LATITUDE = ?, LONGITUDE = ? WHERE ID = ? AND ID_VOYAGE = ?",
        [
          form.title,
          form.location,
          form.startDate,
          form.endDate,
          form.description,
          form.latitude,
          form.longitude,
          stepId,
          voyageId,
        ]
      );
      try {
        bumpStepsVersion();
      } catch {}
      router.back();
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer les modifications.");
    }
  };

  const geocodeAddress = async () => {
    if (!form.location.trim()) {
      Alert.alert("Adresse manquante", "Saisissez une localisation.");
      return;
    }
    try {
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
    }
  };

  const setFromMap = (lat: number, lng: number) => {
    setForm((s) => ({ ...s, latitude: lat, longitude: lng }));
    setMapRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
  };

  const handleDelete = async () => {
    Alert.alert("Supprimer", "Supprimer cette étape ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await run("DELETE FROM ETAPE WHERE ID = ? AND ID_VOYAGE = ?", [
              stepId,
              voyageId,
            ]);
            try {
              bumpStepsVersion();
            } catch {}
            router.back();
          } catch {
            Alert.alert("Erreur", "Suppression impossible.");
          }
        },
      },
    ]);
  };

  if (loading) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText style={styles.title}>{"Modifier l'étape"}</ThemedText>

        <View style={styles.field}>
          <ThemedLabel>Nom du lieu</ThemedLabel>
          <ThemedTextInput
            value={form.title}
            onChangeText={(t) => setForm((s) => ({ ...s, title: t }))}
          />
        </View>

        <View style={styles.field}>
          <ThemedLabel>Localisation du lieu</ThemedLabel>
          <ThemedTextInput
            value={form.location}
            onChangeText={(t) => setForm((s) => ({ ...s, location: t }))}
          />
          <View style={{ marginTop: 8 }}>
            <ThemedButton title="Géocoder l'adresse" onPress={geocodeAddress} />
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
              setFromMap(latitude, longitude);
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
              <ThemedText>{`Lat: ${form.latitude.toFixed(
                6
              )}  Lng: ${form.longitude.toFixed(6)}`}</ThemedText>
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

        <View style={{ gap: 8 }}>
          <ThemedButton title="Enregistrer" onPress={handleSave} />
          <ThemedButton
            title="Supprimer l'étape"
            onPress={handleDelete}
            lightColor="#e11d48"
            darkColor="#e11d48"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  field: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700" },
});
