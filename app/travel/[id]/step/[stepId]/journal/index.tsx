import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import useSQLite from "@/hooks/use-sqlite";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type JournalRow = {
  ID: number;
  ID_VOYAGE: number;
  ID_ETAPE: number;
  DATE: string;
  CONTENU: string;
  CREATED_AT: string;
  UPDATED_AT: string;
};

type JournalMediaRow = {
  ID: number;
  ID_JOURNAL: number;
  TYPE: string; // 'image' | 'audio'
  URI: string;
  MIME: string | null;
  SIZE: number | null;
  DURATION?: number | null;
};

export default function StepJournalScreen() {
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const stepParam = Array.isArray(params.stepId)
    ? params.stepId[0]
    : params.stepId;
  const voyageId = useMemo(() => Number(idParam), [idParam]);
  const stepId = useMemo(() => Number(stepParam), [stepParam]);

  const { queryAll, run, ready } = useSQLite("tripflow.db");

  const [entries, setEntries] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<
    { uri: string; mime?: string; size?: number }[]
  >([]);
  const [mediaByJournalId, setMediaByJournalId] = useState<
    Record<number, JournalMediaRow[]>
  >({});

  const todayIso = () => new Date().toISOString().slice(0, 10);
  const formatDateDisplay = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadEntries = useCallback(async () => {
    try {
      if (!ready) return;
      if (!voyageId || !stepId || Number.isNaN(stepId)) {
        setEntries([]);
        setMediaByJournalId({});
        return;
      }
      const rows = await queryAll<JournalRow>(
        "SELECT * FROM JOURNAL WHERE ID_VOYAGE = ? AND ID_ETAPE = ? ORDER BY DATE DESC, ID DESC",
        [voyageId, stepId]
      );
      setEntries(rows);

      // Charger les médias liés aux entrées (images/audio)
      if (rows.length > 0) {
        const ids = rows.map((r) => r.ID);
        const placeholders = ids.map(() => "?").join(", ");
        const mediaRows = await queryAll<JournalMediaRow>(
          `SELECT * FROM JOURNAL_MEDIA WHERE ID_JOURNAL IN (${placeholders})`,
          ids
        );
        const map: Record<number, JournalMediaRow[]> = {};
        for (const m of mediaRows) {
          if (!map[m.ID_JOURNAL]) map[m.ID_JOURNAL] = [];
          map[m.ID_JOURNAL].push(m);
        }
        setMediaByJournalId(map);
      } else {
        setMediaByJournalId({});
      }
    } finally {
      setLoading(false);
    }
  }, [ready, voyageId, stepId, queryAll]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleAdd = async () => {
    if (!newContent.trim()) {
      Alert.alert("Contenu requis", "Saisissez un texte pour votre entrée.");
      return;
    }
    try {
      const res = await run(
        "INSERT INTO JOURNAL (ID_VOYAGE, ID_ETAPE, DATE, CONTENU, CREATED_AT, UPDATED_AT) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
        [voyageId, stepId, todayIso(), newContent.trim()]
      );
      const journalId = (res?.insertId as number) ?? null;
      if (journalId) {
        for (const img of selectedImages) {
          await run(
            "INSERT INTO JOURNAL_MEDIA (ID_JOURNAL, TYPE, URI, MIME, SIZE) VALUES (?, 'image', ?, ?, ?)",
            [journalId, img.uri, img.mime ?? null, img.size ?? null]
          );
        }
      }
      setNewContent("");
      setSelectedImages([]);
      setLoading(true);
      await loadEntries();
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter l'entrée.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await run(
        "DELETE FROM JOURNAL WHERE ID = ? AND ID_VOYAGE = ? AND ID_ETAPE = ?",
        [id, voyageId, stepId]
      );
      await loadEntries();
    } catch {
      Alert.alert("Erreur", "Suppression impossible.");
    }
  };

  if (!ready || loading) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText style={styles.title} onLightCard>
            {"Journal de l'étape"}
          </ThemedText>

          <View style={styles.formCard}>
            <ThemedLabel onLightCard>Nouvelle entrée</ThemedLabel>
            <ThemedTextInput
              placeholder="Racontez votre journée, vos ressentis, etc."
              value={newContent}
              onChangeText={setNewContent}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
            <View style={{ height: 8 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ThemedButton
                title="Ajouter photo"
                onPress={async () => {
                  try {
                    const perm =
                      await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (perm.status !== "granted") {
                      Alert.alert(
                        "Permission requise",
                        "Autorisez l'accès aux photos."
                      );
                      return;
                    }
                    const res = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsMultipleSelection: true,
                      quality: 0.9,
                    });
                    if (res.canceled) return;
                    const assets = res.assets ?? [];
                    setSelectedImages((prev) => [
                      ...prev,
                      ...assets.map((a) => ({
                        uri: a.uri,
                        mime: a.mimeType,
                        size: a.fileSize,
                      })),
                    ]);
                  } catch {}
                }}
              />
            </View>
            {selectedImages.length > 0 ? (
              <ScrollView
                horizontal
                style={{ marginTop: 8 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {selectedImages.map((img, idx) => (
                  <Image
                    key={`${img.uri}-${idx}`}
                    source={{ uri: img.uri }}
                    style={{ width: 72, height: 72, borderRadius: 8 }}
                  />
                ))}
              </ScrollView>
            ) : null}
            <View style={{ height: 8 }} />
            <ThemedButton title="Ajouter" onPress={handleAdd} />
          </View>

          <View style={{ gap: 12 }}>
            {entries.length === 0 ? (
              <ThemedText onLightCard>
                Aucune entrée pour cette étape.
              </ThemedText>
            ) : (
              entries.map((e) => (
                <View key={String(e.ID)} style={styles.entryCard}>
                  <ThemedText style={styles.entryDate} onLightCard>
                    {formatDateDisplay(e.DATE)}
                  </ThemedText>
                  <ThemedText style={styles.entryContent} onLightCard>
                    {e.CONTENU}
                  </ThemedText>
                  {/* Affichage des photos associées à l'entrée */}
                  {(() => {
                    const medias = mediaByJournalId[e.ID] ?? [];
                    const images = medias.filter((m) => m.TYPE === "image");
                    if (images.length === 0) return null;
                    return (
                      <ScrollView
                        horizontal
                        style={{ marginTop: 8 }}
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {images.map((img) => (
                          <Image
                            key={`${img.ID}`}
                            source={{ uri: img.URI }}
                            style={{ width: 72, height: 72, borderRadius: 8 }}
                          />
                        ))}
                      </ScrollView>
                    );
                  })()}
                  <View style={{ height: 8 }} />
                  <ThemedButton
                    title="Supprimer"
                    lightColor="#e11d48"
                    darkColor="#e11d48"
                    onPress={() => handleDelete(e.ID)}
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: "700" },
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 8 },
  entryCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  entryDate: { fontSize: 12, color: "#666", marginBottom: 8 },
  entryContent: { fontSize: 14, color: "#222", lineHeight: 20 },
});
