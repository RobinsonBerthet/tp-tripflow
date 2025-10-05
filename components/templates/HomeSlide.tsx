import { Colors } from "@/constants/theme";
import useSQLite from "@/hooks/use-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemedText from "../atomes/ThemedText";
import TopHeader from "../organisms/TopHeader";

export type HomeSlideProps = ViewProps & {
  title?: string;
  caption?: string;
};

export default function HomeSlide({
  title = "Accueil",
  caption = "Découvrez et planifiez vos prochaines aventures",
  style,
  ...rest
}: HomeSlideProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;
  const { queryAll, queryOne } = useSQLite("tripflow.db");

  type VoyageRow = {
    ID: number;
    TITRE: string;
    DATE_ALLER: string;
    DATE_RETOUR: string;
    LIEU: string;
    DESCRIPTION: string;
    IMAGE: string;
    ID_UTILISATEUR: number;
  };

  const [voyages, setVoyages] = useState<VoyageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDateDisplay = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getImage = (uri?: string) =>
    uri && uri.length > 0 ? uri : "https://placehold.co/800x600";

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadVoyages = async () => {
        try {
          setLoading(true);
          const userLogin = (await SecureStore.getItemAsync("userLogin")) ?? "";
          if (!userLogin) {
            if (isActive) setVoyages([]);
            return;
          }
          const user = await queryOne<{ ID: number }>(
            "SELECT ID FROM UTILISATEUR WHERE IDENTIFIANT = ?",
            [userLogin]
          );
          if (!user) {
            if (isActive) setVoyages([]);
            return;
          }
          const rows = await queryAll<VoyageRow>(
            "SELECT * FROM VOYAGE WHERE ID_UTILISATEUR = ? ORDER BY DATE_ALLER DESC",
            [user.ID]
          );
          if (isActive) setVoyages(rows);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      void loadVoyages();

      return () => {
        isActive = false;
      };
    }, [queryAll, queryOne])
  );

  return (
    <SafeAreaView>
      <View style={[styles.container, style]} {...rest}>
        <TopHeader />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "80%",
            marginHorizontal: "auto",
            marginTop: "5%",
            height: 55,
          }}
        >
          <ThemedText style={[styles.title, { color: Colors[theme].text }]}>
            {"Vos voyages récents"}
          </ThemedText>
          <TouchableOpacity
            style={{
              width: 30,
              height: 30,
              marginVertical: "auto",
            }}
            onPress={() => router.push("/createTravel")}
          >
            <Ionicons
              name="add-sharp"
              size={24}
              color={Colors[theme].text}
              style={{ margin: "auto" }}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            width: "100%",
            marginTop: "10%",
            height: "80%",
            marginHorizontal: "auto",
          }}
        >
          {loading ? null : voyages.length === 0 ? (
            <ThemedText style={{ color: Colors[theme].text }}>
              Aucun voyage pour le moment.
            </ThemedText>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollArea}>
              {(() => {
                const [hero, ...rest] = voyages;
                const rows: VoyageRow[][] = [];
                for (let i = 0; i < rest.length; i += 2) {
                  rows.push(rest.slice(i, i + 2));
                }
                return (
                  <View>
                    {/* Hero Card */}
                    {hero ? (
                      <View style={styles.heroWrapper}>
                        <View
                          style={[
                            styles.shadowLg,
                            { shadowColor: Colors[theme].text },
                          ]}
                        >
                          <View
                            style={[
                              styles.heroCard,
                              { backgroundColor: "#ddd" },
                            ]}
                          >
                            {/* @ts-ignore - ImageBackground via inline require not used */}
                            <View style={styles.heroImageContainer}>
                              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                              {/* @ts-ignore */}
                              <View style={styles.absoluteFill}>
                                {/* Use ImageBackground behavior with nested overlays */}
                                <View
                                  style={[
                                    styles.absoluteFill,
                                    { borderRadius: 28, overflow: "hidden" },
                                  ]}
                                >
                                  <View
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      backgroundColor: "transparent",
                                    }}
                                  />
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : null}

                    {/* Real hero with ImageBackground */}
                    {hero ? (
                      <View style={styles.heroCardReal}>
                        <View
                          style={[styles.shadowLg, { shadowColor: "#000" }]}
                        >
                          <View
                            style={{ borderRadius: 28, overflow: "hidden" }}
                          >
                            <View
                              style={{
                                width: "100%",
                                height: 220,
                                backgroundColor: "#e5e5e5",
                              }}
                            >
                              <View
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                }}
                              >
                                <View
                                  style={{
                                    flex: 1,
                                    backgroundColor: "transparent",
                                  }}
                                >
                                  {/* Background image */}
                                  <View style={styles.absoluteFill}>
                                    <View style={{ flex: 1 }}>
                                      {/* We use standard ImageBackground API via inline require avoided, so use <View> with bg image via Image style */}
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : null}

                    {/* Simpler: Use ImageBackground directly with RN */}
                    {hero ? (
                      <TouchableOpacity
                        style={styles.heroWrapperReal}
                        activeOpacity={0.9}
                        onPress={() =>
                          router.push({
                            pathname: "/travel/[id]",
                            params: { id: String(hero.ID) },
                          } as any)
                        }
                      >
                        <View
                          style={[styles.shadowLg, { shadowColor: "#000" }]}
                        >
                          <View
                            style={{ borderRadius: 28, overflow: "hidden" }}
                          >
                            <View style={{ width: "100%", height: 220 }}>
                              <View style={styles.absoluteFill}>
                                <ImageBackground
                                  source={{ uri: getImage(hero.IMAGE) }}
                                  style={styles.absoluteFill}
                                >
                                  {/* Top white panel */}
                                  <View style={styles.heroTopPanel}>
                                    <ThemedText style={styles.heroTitle}>
                                      {hero.TITRE}
                                    </ThemedText>
                                    {/* <View style={styles.rowCenter}>
                                      <Ionicons
                                        name="people"
                                        size={16}
                                        color={Colors[theme].text}
                                      />
                                      <ThemedText style={styles.heroCount}>
                                        x4
                                      </ThemedText>
                                    </View> */}
                                  </View>
                                  {/* Bottom meta */}
                                  <View style={styles.heroMetaArea}>
                                    <View style={styles.metaRow}>
                                      <Ionicons
                                        name="location-sharp"
                                        size={14}
                                        color="#AAA"
                                      />
                                      <ThemedText style={styles.metaText}>
                                        {hero.LIEU}
                                      </ThemedText>
                                    </View>
                                    <ThemedText style={styles.metaText}>
                                      du {formatDateDisplay(hero.DATE_ALLER)} au{" "}
                                      {formatDateDisplay(hero.DATE_RETOUR)}
                                    </ThemedText>
                                  </View>
                                </ImageBackground>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    {/* Grid 2 columns */}
                    {rows.map((pair, idx) => (
                      <View key={`row-${idx}`} style={styles.gridRow}>
                        {pair.map((item) => (
                          <TouchableOpacity
                            key={String(item.ID)}
                            style={styles.gridItem}
                            activeOpacity={0.85}
                            onPress={() =>
                              router.push({
                                pathname: "/travel/[id]",
                                params: { id: String(item.ID) },
                              } as any)
                            }
                          >
                            <View
                              style={[styles.shadowMd, { shadowColor: "#000" }]}
                            >
                              <View
                                style={{ borderRadius: 24, overflow: "hidden" }}
                              >
                                <ImageBackground
                                  source={{ uri: getImage(item.IMAGE) }}
                                  style={{ width: "100%", height: 180 }}
                                >
                                  <View style={styles.smallTopPanel}>
                                    <ThemedText style={styles.smallTitle}>
                                      {item.TITRE}
                                    </ThemedText>
                                  </View>
                                  <View style={styles.smallMetaArea}>
                                    <View style={styles.metaRow}>
                                      <Ionicons
                                        name="location-sharp"
                                        size={12}
                                        color="#AAA"
                                      />
                                      <ThemedText style={styles.smallMetaText}>
                                        {item.LIEU}
                                      </ThemedText>
                                    </View>
                                    <ThemedText style={styles.smallMetaText}>
                                      du {formatDateDisplay(item.DATE_ALLER)} au{" "}
                                      {formatDateDisplay(item.DATE_RETOUR)}
                                    </ThemedText>
                                  </View>
                                </ImageBackground>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                        {pair.length === 1 ? (
                          <View style={styles.gridItemSpacer} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                );
              })()}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: "auto",
    height: 50,
    verticalAlign: "middle",
  },
  caption: {
    fontSize: 16,
    textAlign: "center",
  },
  scrollArea: {
    paddingBottom: 24,
    width: "92%",
    marginHorizontal: "auto",
    gap: 14,
  },
  heroWrapper: {
    display: "none",
  },
  heroCard: {
    height: 220,
    borderRadius: 28,
  },
  heroImageContainer: {
    flex: 1,
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroCardReal: {
    display: "none",
  },
  heroWrapperReal: {
    width: "100%",
  },
  heroTopPanel: {
    position: "absolute",
    left: 16,
    top: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  heroCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  heroMetaArea: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255,1)",
    padding: 10,
    borderRadius: 16,
    width: "50%",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#AAA",
    fontSize: 12,
    opacity: 0.95,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  gridItem: {
    flex: 1,
  },
  gridItemSpacer: {
    flex: 1,
  },
  smallTopPanel: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  smallMetaArea: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255,1)",
    padding: 10,
    borderRadius: 16,
    left: 12,
    right: 12,
    bottom: 12,
    gap: 4,
  },
  smallMetaText: {
    color: "#AAA",
    fontSize: 11,
  },
  shadowLg: {
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  shadowMd: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
