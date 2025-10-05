import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import useSQLite from "@/hooks/use-sqlite";
import DateTimePicker from "@react-native-community/datetimepicker";
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
import { SafeAreaView } from "react-native-safe-area-context";

type StepForm = {
  title: string;
  location: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  description: string;
};

export default function AddStepScreen() {
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const voyageId = useMemo(() => Number(idParam), [idParam]);

  const { run } = useSQLite("tripflow.db");

  const [form, setForm] = useState<StepForm>({
    title: "",
    location: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

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
      await run(
        "INSERT INTO ETAPE (ID_VOYAGE, NOM_LIEU, LOCALISATION, DATE_DEBUT, DATE_FIN, DESCRIPTION) VALUES (?, ?, ?, ?, ?, ?)",
        [
          voyageId,
          form.title,
          form.location,
          form.startDate,
          form.endDate,
          form.description,
        ]
      );
      router.back();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer l'étape.");
    } finally {
      setLoading(false);
    }
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
