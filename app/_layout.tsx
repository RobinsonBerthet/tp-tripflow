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
        DESCRIPTION TEXT NOT NULL
      )`,
    ],
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
