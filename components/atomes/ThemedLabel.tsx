import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

export type ThemedLabelProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  onLightCard?: boolean;
};

export function ThemedLabel({
  lightColor,
  darkColor,
  style,
  onLightCard,
  ...rest
}: ThemedLabelProps) {
  const scheme = (useColorScheme() ?? "light") as keyof typeof Colors;
  let color = useThemeColor({ light: lightColor, dark: darkColor }, "icon");
  if (onLightCard && scheme === "dark") {
    color = lightColor ?? Colors.light.text;
  }
  return <Text {...rest} style={[styles.label, { color }, style]} />;
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontWeight: "500",
  },
});

export default ThemedLabel;
