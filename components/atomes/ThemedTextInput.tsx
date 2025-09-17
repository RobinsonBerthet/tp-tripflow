import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedTextInput({
  lightColor,
  darkColor,
  style,
  placeholderTextColor,
  ...rest
}: ThemedTextInputProps) {
  const textColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );
  const borderColor = useThemeColor({}, "icon");
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
