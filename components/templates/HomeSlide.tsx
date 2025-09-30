import { Colors } from "@/constants/theme";
import useSQLite from "@/hooks/use-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  FlatList,
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
  const { queryAll, queryOne } = useSQLite("tripflow.db", {
    schema: [
      `CREATE TABLE IF NOT EXISTS UTILISATEUR (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        IDENTIFIANT TEXT UNIQUE NOT NULL,
        MOT_DE_PASSE TEXT NOT NULL,
        DATE_INSCRIPTION TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS VOYAGE (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        TITRE TEXT NOT NULL,
        DATE_ALLER TEXT NOT NULL,
        DATE_RETOUR TEXT NOT NULL,
        LIEU TEXT NOT NULL,
        DESCRIPTION TEXT NOT NULL,
        IMAGE TEXT NOT NULL,
        ID_UTILISATEUR INTEGER NOT NULL
      )`,
    ],
  });

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

  useEffect(() => {
    const loadVoyages = async () => {
      try {
        const userLogin = (await SecureStore.getItemAsync("userLogin")) ?? "";
        if (!userLogin) {
          setVoyages([]);
          return;
        }
        const user = await queryOne<{ ID: number }>(
          "SELECT ID FROM UTILISATEUR WHERE IDENTIFIANT = ?",
          [userLogin]
        );
        if (!user) {
          setVoyages([]);
          return;
        }
        const rows = await queryAll<VoyageRow>(
          "SELECT * FROM VOYAGE WHERE ID_UTILISATEUR = ? ORDER BY DATE_ALLER DESC",
          [user.ID]
        );
        setVoyages(rows);
      } finally {
        setLoading(false);
      }
    };
    void loadVoyages();
  }, [queryAll, queryOne]);

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
            width: "80%",
            marginHorizontal: "auto",
            marginTop: 12,
            flex: 1,
          }}
        >
          {loading ? null : voyages.length === 0 ? (
            <ThemedText style={{ color: Colors[theme].text }}>
              Aucun voyage pour le moment.
            </ThemedText>
          ) : (
            <FlatList
              data={voyages}
              keyExtractor={(item) => String(item.ID)}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <View
                  style={[styles.card, { borderColor: Colors[theme].tint }]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.cardTitle}>
                      {item.TITRE}
                    </ThemedText>
                    <ThemedText style={styles.cardMeta}>{item.LIEU}</ThemedText>
                    <ThemedText style={styles.cardMeta}>
                      {item.DATE_ALLER} → {item.DATE_RETOUR}
                    </ThemedText>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    opacity: 0.8,
  },
});
