import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

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
