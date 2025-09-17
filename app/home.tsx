import BottomNavbar from "@/components/organisms/BottomNavbar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  return (
    <View
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <Text style={[styles.title, { color: Colors[theme].text }]}>
        Bienvenue sur Home
      </Text>

      <Link href="/home" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Aller au Login</Text>
        </Pressable>
      </Link>

      <BottomNavbar
        onPressItem={(i) => {
          // Placeholder d’action
          console.log("Nav item pressed", i);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
