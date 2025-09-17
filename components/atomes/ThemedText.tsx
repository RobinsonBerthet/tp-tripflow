import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<TextStyle>;
};

export function ThemedText({
  lightColor,
  darkColor,
  style,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  return <Text {...rest} style={[{ color }, style]} />;
}

export default ThemedText;
