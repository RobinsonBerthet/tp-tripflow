import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

export type ThemedLabelProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedLabel({
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedLabelProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "icon");
  return <Text {...rest} style={[styles.label, { color }, style]} />;
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontWeight: "500",
  },
});

export default ThemedLabel;
