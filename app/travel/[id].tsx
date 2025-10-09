import { ThemedButton } from "@/components/atomes/ThemedButton";
import ThemedText from "@/components/atomes/ThemedText";
import useSQLite from "@/hooks/use-sqlite";
import { useTravelStore } from "@/stores/travelStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type VoyageRow = {
  ID: number;
  TITRE: string;
  DATE_ALLER: string;
  DATE_RETOUR: string;
  LIEU: string;
  DESCRIPTION: string;
  IMAGE: string;
  ID_UTILISATEUR: number;
};

type StepRow = {
  ID: number;
  ID_VOYAGE: number;
  NOM_LIEU: string;
  LOCALISATION: string;
  DATE_DEBUT: string;
  DATE_FIN: string;
  DESCRIPTION: string;
};

export default function TravelDetailScreen() {
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const voyageId = useMemo(() => Number(idParam), [idParam]);

  const { queryOne, queryAll, run, ready } = useSQLite("tripflow.db");

  const [voyage, setVoyage] = useState<VoyageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<StepRow[]>([]);
  const { setSelectedVoyageId, selectedVoyageId, setSelectedTab } =
    useTravelStore();

  useEffect(() => {
    console.log(selectedVoyageId);
  }, [selectedVoyageId]);

  const formatDateDisplay = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getImage = (uri?: string) =>
    uri && uri.length > 0 ? uri : "https://placehold.co/800x600";

  const loadData = useCallback(async () => {
    try {
      if (!ready) return;
      if (!voyageId || Number.isNaN(voyageId)) {
        setVoyage(null);
        setSteps([]);
        return;
      }
      const row = await queryOne<VoyageRow>(
        "SELECT * FROM VOYAGE WHERE ID = ?",
        [voyageId]
      );
      setVoyage(row ?? null);
      const s = await queryAll<StepRow>(
        "SELECT * FROM ETAPE WHERE ID_VOYAGE = ? ORDER BY DATE_DEBUT ASC",
        [voyageId]
      );
      setSteps(s);
    } finally {
      setLoading(false);
    }
  }, [ready, voyageId, queryOne, queryAll]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleDelete = async () => {
    if (!voyage) return;
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce voyage ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await run("DELETE FROM VOYAGE WHERE ID = ?", [voyage.ID]);
            router.back();
          } catch {
            Alert.alert("Erreur", "La suppression a échoué.");
          }
        },
      },
    ]);
  };

  const formatDateDisplay2 = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading || !ready) return null;

  if (!voyage) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>Voyage introuvable.</ThemedText>
        <View style={{ height: 12 }} />
        <ThemedButton title="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageCard}>
          <ImageBackground
            source={{ uri: getImage(voyage.IMAGE) }}
            style={styles.image}
          >
            <View style={styles.heroTopPanel}>
              <ThemedText style={styles.title}>{voyage.TITRE}</ThemedText>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.row}>
            <Ionicons name="location-sharp" size={16} color="#666" />
            <ThemedText style={styles.metaText}>{voyage.LIEU}</ThemedText>
          </View>
          <ThemedText style={styles.metaText}>
            du {formatDateDisplay(voyage.DATE_ALLER)} au{" "}
            {formatDateDisplay(voyage.DATE_RETOUR)}
          </ThemedText>
        </View>

        <View style={styles.descCard}>
          <ThemedText style={styles.desc}>{voyage.DESCRIPTION}</ThemedText>
        </View>

        <View style={styles.stepsHeader}>
          <ThemedText style={styles.stepsTitle}>Étapes</ThemedText>
          <ThemedButton
            title="Ajouter une étape"
            onPress={() =>
              router.push({
                pathname: "/travel/[id]/add-step",
                params: { id: String(voyage.ID) },
              } as any)
            }
          />
        </View>

        {steps.length === 0 ? (
          <ThemedText style={styles.metaText}>
            Aucune étape pour le moment.
          </ThemedText>
        ) : (
          <View style={{ gap: 10 }}>
            {steps.map((st) => (
              <View key={String(st.ID)} style={styles.stepCard}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.stepTitle}>
                    {st.NOM_LIEU}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    {st.LOCALISATION}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    du {formatDateDisplay2(st.DATE_DEBUT)} au{" "}
                    {formatDateDisplay2(st.DATE_FIN)}
                  </ThemedText>
                  <ThemedText style={styles.stepDesc}>
                    {st.DESCRIPTION}
                  </ThemedText>
                </View>
                <View style={styles.stepActions}>
                  <ThemedButton
                    title="Modifier"
                    onPress={() =>
                      router.push({
                        pathname: "/travel/[id]/step/[stepId]",
                        params: {
                          id: String(voyage.ID),
                          stepId: String(st.ID),
                        },
                      } as any)
                    }
                  />
                  <ThemedButton
                    title="Supprimer"
                    lightColor="#e11d48"
                    darkColor="#e11d48"
                    onPress={() =>
                      Alert.alert("Supprimer", "Supprimer cette étape ?", [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Supprimer",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await run(
                                "DELETE FROM ETAPE WHERE ID = ? AND ID_VOYAGE = ?",
                                [st.ID, voyage.ID]
                              );
                              void loadData();
                            } catch {
                              Alert.alert("Erreur", "Suppression impossible.");
                            }
                          },
                        },
                      ])
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <ThemedButton
            title="Visualiser sur la carte"
            onPress={async () => {
              setSelectedVoyageId(voyage.ID);
              setSelectedTab("voyages");
              router.back();
            }}
            style={{ marginBottom: 8, paddingVertical: 14 }}
          />
          <ThemedButton
            title="Supprimer le voyage"
            onPress={handleDelete}
            lightColor="#e11d48"
            darkColor="#e11d48"
            style={{ paddingVertical: 14 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  imageCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 240,
  },
  heroTopPanel: {
    position: "absolute",
    left: 16,
    top: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  metaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    color: "#666",
    fontSize: 14,
  },
  descCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  desc: {
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
  },
  stepsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  stepCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepTitle: { fontSize: 16, fontWeight: "700" },
  stepDesc: { color: "#333", marginTop: 6 },
  stepActions: { gap: 8, width: 120 },
});
