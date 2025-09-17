import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

export type ThemedButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  lightColor?: string;
  darkColor?: string;
  style?: ViewStyle | ViewStyle[];
};

export function ThemedButton({
  title,
  lightColor,
  darkColor,
  style,
  disabled,
  ...rest
}: ThemedButtonProps) {
  const tint = useThemeColor({ light: lightColor, dark: darkColor }, "tint");
  const text = useThemeColor({}, "background");

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tint, opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.buttonText, { color: text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
});

export default ThemedButton;
