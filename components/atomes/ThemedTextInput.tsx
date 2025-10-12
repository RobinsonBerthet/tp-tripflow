import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  onLightCard?: boolean;
};

export function ThemedTextInput({
  lightColor,
  darkColor,
  style,
  placeholderTextColor,
  onLightCard,
  ...rest
}: ThemedTextInputProps) {
  const scheme = useColorScheme() ?? "light";
  let textColor = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  let borderColor = useThemeColor({}, "icon");
  if (onLightCard && scheme === "dark") {
    textColor = lightColor ?? Colors.light.text;
    borderColor = Colors.light.icon;
  }
  const placeholderColor = placeholderTextColor ?? borderColor;

  return (
    <TextInput
      {...rest}
      placeholderTextColor={placeholderColor}
      style={[styles.input, { color: textColor, borderColor }, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

export default ThemedTextInput;
