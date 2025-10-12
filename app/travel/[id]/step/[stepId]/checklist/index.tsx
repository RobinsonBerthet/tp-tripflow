import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import useSQLite from "@/hooks/use-sqlite";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChecklistListRow = {
  ID: number;
  ID_VOYAGE: number;
  ID_ETAPE: number;
  TITRE: string;
  CREATED_AT: string;
  UPDATED_AT: string;
};

type ChecklistItemRow = {
  ID: number;
  ID_LIST: number;
  TEXTE: string;
  COCHE: number; // 0 | 1
  POSITION: number;
  CREATED_AT: string;
  UPDATED_AT: string;
};

export default function StepChecklistScreen() {
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const stepParam = Array.isArray(params.stepId)
    ? params.stepId[0]
    : params.stepId;
  const voyageId = useMemo(() => Number(idParam), [idParam]);
  const stepId = useMemo(() => Number(stepParam), [stepParam]);

  const { ready, queryAll, queryOne, run } = useSQLite("tripflow.db");

  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<ChecklistListRow[]>([]);
  const [itemsByListId, setItemsByListId] = useState<
    Record<number, ChecklistItemRow[]>
  >({});

  const [newListTitle, setNewListTitle] = useState("");
  const [newItemTextByListId, setNewItemTextByListId] = useState<
    Record<number, string>
  >({});

  const loadData = useCallback(async () => {
    try {
      if (!ready) return;
      if (!voyageId || !stepId || Number.isNaN(stepId)) {
        setLists([]);
        setItemsByListId({});
        return;
      }
      const ls = await queryAll<ChecklistListRow>(
        "SELECT * FROM CHECKLIST_LIST WHERE ID_VOYAGE = ? AND ID_ETAPE = ? ORDER BY ID ASC",
        [voyageId, stepId]
      );
      setLists(ls);
      if (ls.length === 0) {
        setItemsByListId({});
      } else {
        const ids = ls.map((l) => l.ID);
        const placeholders = ids.map(() => "?").join(", ");
        const items = await queryAll<ChecklistItemRow>(
          `SELECT * FROM CHECKLIST_ITEM WHERE ID_LIST IN (${placeholders}) ORDER BY POSITION ASC, ID ASC`,
          ids
        );
        const map: Record<number, ChecklistItemRow[]> = {};
        for (const it of items) {
          if (!map[it.ID_LIST]) map[it.ID_LIST] = [];
          map[it.ID_LIST].push(it);
        }
        setItemsByListId(map);
      }
    } finally {
      setLoading(false);
    }
  }, [ready, voyageId, stepId, queryAll]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddList = async () => {
    const title = newListTitle.trim();
    if (!title) return;
    try {
      await run(
        "INSERT INTO CHECKLIST_LIST (ID_VOYAGE, ID_ETAPE, TITRE, CREATED_AT, UPDATED_AT) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
        [voyageId, stepId, title]
      );
      setNewListTitle("");
      setLoading(true);
      await loadData();
    } catch {}
  };

  const handleAddItem = async (listId: number) => {
    const text = (newItemTextByListId[listId] ?? "").trim();
    if (!text) return;
    try {
      const row = await queryOne<{ MAXPOS: number }>(
        "SELECT COALESCE(MAX(POSITION), -1) + 1 AS MAXPOS FROM CHECKLIST_ITEM WHERE ID_LIST = ?",
        [listId]
      );
      const pos = row?.MAXPOS ?? 0;
      await run(
        "INSERT INTO CHECKLIST_ITEM (ID_LIST, TEXTE, COCHE, POSITION, CREATED_AT, UPDATED_AT) VALUES (?, ?, 0, ?, datetime('now'), datetime('now'))",
        [listId, text, pos]
      );
      setNewItemTextByListId((s) => ({ ...s, [listId]: "" }));
      setLoading(true);
      await loadData();
    } catch {}
  };

  const toggleItem = async (item: ChecklistItemRow) => {
    try {
      await run(
        "UPDATE CHECKLIST_ITEM SET COCHE = ?, UPDATED_AT = datetime('now') WHERE ID = ?",
        [item.COCHE ? 0 : 1, item.ID]
      );
      setLoading(true);
      await loadData();
    } catch {}
  };

  if (!ready || loading) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <ThemedText style={styles.title}>
            {"Checklist de préparation"}
          </ThemedText>

          <View style={styles.card}>
            <ThemedLabel>Nouvelle liste</ThemedLabel>
            <ThemedTextInput
              placeholder="Ex: Valise, Documents, Trousse de secours"
              value={newListTitle}
              onChangeText={setNewListTitle}
            />
            <View style={{ height: 8 }} />
            <ThemedButton title="Ajouter la liste" onPress={handleAddList} />
          </View>

          <View style={{ gap: 12 }}>
            {lists.length === 0 ? (
              <ThemedText>
                Aucune liste. Ajoutez votre première liste ci-dessus.
              </ThemedText>
            ) : (
              lists.map((l) => (
                <View key={`list-${l.ID}`} style={styles.card}>
                  <ThemedText style={styles.listTitle}>{l.TITRE}</ThemedText>

                  {/* Items */}
                  <View style={{ gap: 8 }}>
                    {(itemsByListId[l.ID] ?? []).map((it) => (
                      <Pressable
                        key={`item-${it.ID}`}
                        onPress={() => toggleItem(it)}
                        style={({ pressed }) => [
                          styles.itemRow,
                          { opacity: pressed ? 0.8 : 1 },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ checked: Boolean(it.COCHE) }}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            it.COCHE ? styles.checkboxChecked : undefined,
                          ]}
                        />
                        <ThemedText
                          style={[
                            styles.itemText,
                            it.COCHE ? styles.itemTextChecked : undefined,
                          ]}
                        >
                          {it.TEXTE}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>

                  {/* Ajouter un item */}
                  <View style={{ height: 8 }} />
                  <ThemedLabel>Nouvel item</ThemedLabel>
                  <ThemedTextInput
                    placeholder="Ex: Passeport, Brosse à dents, T-shirt"
                    value={newItemTextByListId[l.ID] ?? ""}
                    onChangeText={(t) =>
                      setNewItemTextByListId((s) => ({ ...s, [l.ID]: t }))
                    }
                  />
                  <View style={{ height: 8 }} />
                  <ThemedButton
                    title="Ajouter l'item"
                    onPress={() => handleAddItem(l.ID)}
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
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, gap: 8 },
  listTitle: { fontSize: 16, fontWeight: "600" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0a7ea4",
    backgroundColor: "transparent",
  },
  checkboxChecked: { backgroundColor: "#0a7ea4" },
  itemText: { fontSize: 14 },
  itemTextChecked: { textDecorationLine: "line-through", opacity: 0.7 },
});
