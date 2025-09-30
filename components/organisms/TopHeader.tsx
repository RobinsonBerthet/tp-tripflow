import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function TopHeader() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[theme].navBarBackground },
      ]}
    >
      {router.canGoBack() && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 30,
            height: 30,
            position: "absolute",
            left: 20,
            top: "auto",
            bottom: "auto",
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
      )}
      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
        resizeMode="cover"
        accessible
        accessibilityLabel="TripFlow logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      default: {},
    }),
    borderBottomWidth: Platform.OS !== "ios" ? 1 : 0,
    borderBottomColor: "#00000010",
    zIndex: 100,
  },
  logo: {
    width: 140,
    height: 36,
    backgroundColor: "white",
    borderRadius: 10,
  },
});
