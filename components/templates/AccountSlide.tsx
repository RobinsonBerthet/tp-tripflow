import ThemedText from "@/components/atomes/ThemedText";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

export type AccountSlideProps = ViewProps & {
  title?: string;
  subtitle?: string;
};

export default function AccountSlide({
  title = "Compte",
  subtitle = "Gérez votre profil et vos préférences",
  style,
  ...rest
}: AccountSlideProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});
