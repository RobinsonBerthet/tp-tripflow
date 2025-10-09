import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import {
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ThemedTouchableProps = Omit<TouchableOpacityProps, "style"> & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  elevation?: number;
};

export default function ThemedTouchable({
  lightColor,
  darkColor,
  style,
  radius = 12,
  elevation = 3,
  disabled,
  ...rest
}: ThemedTouchableProps) {
  const background = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: background,
          borderRadius: radius,
          opacity: disabled ? 0.6 : 1,
          elevation,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1.5,
        },
        style,
      ]}
      {...rest}
    />
  );
}
