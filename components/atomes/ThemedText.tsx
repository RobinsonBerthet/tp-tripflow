import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<TextStyle>;
  onLightCard?: boolean; // Forcer un texte foncé lorsqu'affiché sur une card claire en mode sombre
};

export function ThemedText({
  lightColor,
  darkColor,
  style,
  onLightCard,
  ...rest
}: ThemedTextProps) {
  const scheme = (useColorScheme() ?? "light") as keyof typeof Colors;
  let color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  if (onLightCard && scheme === "dark") {
    color = lightColor ?? Colors.light.text;
  }
  return (
    <Text {...rest} style={[{ color }, style]}>
      {rest.children}
    </Text>
  );
}

export default ThemedText;
