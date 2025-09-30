import BottomNavbar from "@/components/organisms/BottomNavbar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AccountSlide, HomeSlide, TravelSlide } from "../components/templates";

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;

  const [selectedTab, setSelectedTab] = useState<"home" | "voyages" | "profil">(
    "home"
  );

  const { width } = Dimensions.get("screen");
  const translateX = useSharedValue(0);

  const tabIndex =
    selectedTab === "home" ? 0 : selectedTab === "voyages" ? 1 : 2;

  useEffect(() => {
    translateX.value = withTiming(-tabIndex * width, { duration: 250 });
  }, [tabIndex, width, translateX]);

  const slidesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <View style={[styles.sliderContainer, { width }]}>
        <Animated.View
          style={[styles.slidesRow, slidesStyle, { width: width * 3 }]}
        >
          <View style={[styles.slide, { width }]}>
            <HomeSlide />
          </View>
          <View style={[styles.slide, { width }]}>
            <TravelSlide />
          </View>
          <View style={[styles.slide, { width }]}>
            <AccountSlide />
          </View>
        </Animated.View>
      </View>

      <BottomNavbar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sliderContainer: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  slidesRow: {
    flex: 1,
    flexDirection: "row",
  },
  slide: {
    flex: 1,
  },
});
