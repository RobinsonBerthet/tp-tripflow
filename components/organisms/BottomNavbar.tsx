import AccountIconColor from "@/assets/images/svg-images/account-color.svg";
import AccountIcon from "@/assets/images/svg-images/account.svg";
import EarthIconColor from "@/assets/images/svg-images/earth-color.svg";
import EarthIcon from "@/assets/images/svg-images/earth.svg";
import TravelIconColor from "@/assets/images/svg-images/travel-icon-color.svg";
import TravelIcon from "@/assets/images/svg-images/travel-icon.svg";
import SvgIcon from "@/components/atomes/SvgIcon";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type BottomNavbarProps = {
  selectedTab: "home" | "voyages" | "profil";
  setSelectedTab: (tab: "home" | "voyages" | "profil") => void;
};

export default function BottomNavbar({
  selectedTab,
  setSelectedTab,
}: BottomNavbarProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  const [tabPositions, setTabPositions] = useState<{
    home?: number;
    voyages?: number;
    profil?: number;
  }>({});

  const INDICATOR_SIZE = 50;
  const ITEM_SIZE = 50;

  const indicatorLeft = useSharedValue(0);

  useEffect(() => {
    const target = tabPositions[selectedTab];
    if (typeof target === "number") {
      const left = target + (ITEM_SIZE - INDICATOR_SIZE) / 2;
      indicatorLeft.value = withTiming(left, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [selectedTab, tabPositions]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
  }));

  return (
    <BlurView
      intensity={100}
      tint={theme}
      style={[
        styles.container,
        { backgroundColor: Colors[theme].navBarBackground },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity
          style={{ width: 50, height: 50 }}
          onLayout={({ nativeEvent }) => {
            const x = nativeEvent.layout.x;
            setTabPositions((prev) => ({ ...prev, home: x }));
          }}
          onPress={() => setSelectedTab("home")}
          disabled={selectedTab === "home"}
        >
          {selectedTab === "home" ? (
            <SvgIcon
              Icon={TravelIconColor}
              size={26}
              style={{ margin: "auto" }}
            />
          ) : (
            <SvgIcon
              Icon={TravelIcon}
              color={theme === "dark" ? "white" : "black"}
              size={26}
              style={{ margin: "auto" }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 50, height: 50 }}
          onLayout={({ nativeEvent }) => {
            const x = nativeEvent.layout.x;
            setTabPositions((prev) => ({ ...prev, voyages: x }));
          }}
          onPress={() => setSelectedTab("voyages")}
        >
          {selectedTab === "voyages" ? (
            <SvgIcon
              Icon={EarthIconColor}
              size={26}
              style={{ margin: "auto" }}
            />
          ) : (
            <SvgIcon
              Icon={EarthIcon}
              color={theme === "dark" ? "white" : "black"}
              size={26}
              style={{ margin: "auto" }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 50, height: 50 }}
          onLayout={({ nativeEvent }) => {
            const x = nativeEvent.layout.x;
            setTabPositions((prev) => ({ ...prev, profil: x }));
          }}
          onPress={() => setSelectedTab("profil")}
        >
          {selectedTab === "profil" ? (
            <SvgIcon
              Icon={AccountIconColor}
              size={26}
              style={{ margin: "auto" }}
            />
          ) : (
            <SvgIcon
              Icon={AccountIcon}
              color={theme === "dark" ? "white" : "black"}
              size={26}
              style={{ margin: "auto" }}
            />
          )}
        </TouchableOpacity>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            width: 50,
            height: 50,
            position: "absolute",
            bottom: 0,
            zIndex: 0,
            right: 0,
            top: "15%",
            borderRadius: 25,
            borderWidth: 1,
            borderColor: "rgb(18, 241, 122)",
          },
          indicatorStyle,
        ]}
      />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: "auto",
    right: "auto",
    bottom: "3%",
    width: "95%",
    paddingBottom: "2%",
    paddingTop: "3%",
    borderRadius: 35,
    shadowColor: "#000",
    elevation: 5,
    overflow: "hidden",
  },
  row: {
    zIndex: 3,
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
  icon: {},
});
