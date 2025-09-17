import ThemedTextInput, {
  ThemedTextInputProps,
} from "@/components/atomes/ThemedTextInput";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export type ThemedPasswordInputProps = Omit<
  ThemedTextInputProps,
  "secureTextEntry"
> & {
  initiallyHidden?: boolean;
};

export default function ThemedPasswordInput({
  style,
  initiallyHidden = true,
  ...rest
}: ThemedPasswordInputProps) {
  const [isHidden, setIsHidden] = useState<boolean>(initiallyHidden);
  const iconColor = useThemeColor({}, "icon");

  const mergedInputStyle = useMemo(() => {
    // Ensure enough right padding so the icon does not overlap text
    return [style, styles.inputPaddingRight];
  }, [style]);

  const iconName = isHidden ? "eye" : "eye-off";

  return (
    <View style={styles.container}>
      <ThemedTextInput
        {...rest}
        style={mergedInputStyle}
        secureTextEntry={isHidden}
        autoCapitalize={rest.autoCapitalize ?? "none"}
        autoCorrect={rest.autoCorrect ?? false}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isHidden ? "Afficher le mot de passe" : "Masquer le mot de passe"
        }
        onPress={() => setIsHidden((prev) => !prev)}
        style={styles.iconButton}
        hitSlop={10}
      >
        <Ionicons name={iconName as any} size={20} color={iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
  },
  iconButton: {
    position: "absolute",
    right: 10,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  inputPaddingRight: {
    paddingRight: 40,
  },
});
