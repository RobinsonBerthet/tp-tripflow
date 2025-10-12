import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import useSQLite from "@/hooks/use-sqlite";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  const { ready } = useSQLite("tripflow.db", {
    schema: [
      `CREATE TABLE IF NOT EXISTS UTILISATEUR (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        IDENTIFIANT TEXT UNIQUE NOT NULL,
        MOT_DE_PASSE TEXT NOT NULL,
        DATE_INSCRIPTION TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS VOYAGE (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        TITRE TEXT NOT NULL,
        DATE_ALLER TEXT NOT NULL,
        DATE_RETOUR TEXT NOT NULL,
        LIEU TEXT NOT NULL,
        DESCRIPTION TEXT NOT NULL,
        IMAGE TEXT NOT NULL,
        ID_UTILISATEUR INTEGER NOT NULL
      )`,
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
      `CREATE TABLE IF NOT EXISTS JOURNAL (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_VOYAGE INTEGER NOT NULL,
        ID_ETAPE INTEGER NOT NULL,
        DATE TEXT NOT NULL,
        CONTENU TEXT NOT NULL,
        CREATED_AT TEXT NOT NULL DEFAULT (datetime('now')),
        UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS JOURNAL_MEDIA (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_JOURNAL INTEGER NOT NULL,
        TYPE TEXT NOT NULL, -- 'image' | 'audio'
        URI TEXT NOT NULL,
        MIME TEXT,
        SIZE INTEGER,
        DURATION REAL,
        CREATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      // Tables de checklist: listes et items
      `CREATE TABLE IF NOT EXISTS CHECKLIST_LIST (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_VOYAGE INTEGER NOT NULL,
        ID_ETAPE INTEGER NOT NULL,
        TITRE TEXT NOT NULL,
        CREATED_AT TEXT NOT NULL DEFAULT (datetime('now')),
        UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS CHECKLIST_ITEM (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_LIST INTEGER NOT NULL,
        TEXTE TEXT NOT NULL,
        COCHE INTEGER NOT NULL DEFAULT 0,
        POSITION INTEGER NOT NULL DEFAULT 0,
        CREATED_AT TEXT NOT NULL DEFAULT (datetime('now')),
        UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
    onInit: async (db) => {
      // Ajouter les colonnes LATITUDE / LONGITUDE si elles n'existent pas déjà
      const cols = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(ETAPE)"
      );
      const hasLat = cols.some((c) => c.name === "LATITUDE");
      const hasLng = cols.some((c) => c.name === "LONGITUDE");
      if (!hasLat) {
        await db.execAsync("ALTER TABLE ETAPE ADD COLUMN LATITUDE REAL;");
      }
      if (!hasLng) {
        await db.execAsync("ALTER TABLE ETAPE ADD COLUMN LONGITUDE REAL;");
      }
      // S'assurer que la table JOURNAL existe (sécurité au cas où schema n'a pas été appliqué)
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS JOURNAL (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          ID_VOYAGE INTEGER NOT NULL,
          ID_ETAPE INTEGER NOT NULL,
          DATE TEXT NOT NULL,
          CONTENU TEXT NOT NULL,
          CREATED_AT TEXT NOT NULL DEFAULT (datetime('now')),
          UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );
      // S'assurer que la table JOURNAL_MEDIA existe
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS JOURNAL_MEDIA (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          ID_JOURNAL INTEGER NOT NULL,
          TYPE TEXT NOT NULL,
          URI TEXT NOT NULL,
          MIME TEXT,
          SIZE INTEGER,
          DURATION REAL,
          CREATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );

      // S'assurer que les tables de checklist existent et créer des index utiles
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS CHECKLIST_LIST (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          ID_VOYAGE INTEGER NOT NULL,
          ID_ETAPE INTEGER NOT NULL,
          TITRE TEXT NOT NULL,
          CREATED_AT TEXT NOT NULL DEFAULT (datetime('now')),
          UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS CHECKLIST_ITEM (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          ID_LIST INTEGER NOT NULL,
          TEXTE TEXT NOT NULL,
          COCHE INTEGER NOT NULL DEFAULT 0,
          POSITION INTEGER NOT NULL DEFAULT 0,
          CREATED_AT TEXT NOT NULL DEFAULT (datetime('now')),
          UPDATED_AT TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS IDX_CHECKLIST_LIST_BY_TRIP_STEP ON CHECKLIST_LIST(ID_VOYAGE, ID_ETAPE)`
      );
      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS IDX_CHECKLIST_ITEM_BY_LIST_POS ON CHECKLIST_ITEM(ID_LIST, POSITION)`
      );
    },
  });

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors[theme].background },
        headerTintColor: Colors[theme].tint,
        headerTitleStyle: { color: Colors[theme].text },
        headerShown: false,
        contentStyle: { backgroundColor: Colors[theme].background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="home" options={{ title: "Home" }} />
    </Stack>
  );
}
