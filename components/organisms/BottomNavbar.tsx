import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type BottomNavbarProps = {
  images?: [ImageSourcePropType, ImageSourcePropType, ImageSourcePropType];
  onPressItem?: (index: 0 | 1 | 2) => void;
  style?: ViewStyle;
};

export default function BottomNavbar({
  images,
  onPressItem,
  style,
}: BottomNavbarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  const fallback: [
    ImageSourcePropType,
    ImageSourcePropType,
    ImageSourcePropType
  ] = [
    require("../../assets/images/icon.png"),
    require("../../assets/images/icon.png"),
    require("../../assets/images/icon.png"),
  ];

  const sources = images ?? fallback;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors[theme].background,
          borderTopColor: Colors[theme].tint,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {sources.map((src, idx) => (
          <Pressable
            key={idx}
            onPress={() => onPressItem?.(idx as 0 | 1 | 2)}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
          >
            <Image source={src} style={styles.icon} resizeMode="contain" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  item: {
    padding: 8,
    borderRadius: 999,
  },
  itemPressed: {
    opacity: 0.75,
  },
  icon: {
    width: 26,
    height: 26,
  },
});
