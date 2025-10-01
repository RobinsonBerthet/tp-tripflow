import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import TopHeader from "@/components/organisms/TopHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import useSQLite from "@/hooks/use-sqlite";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function CreateTravelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;
  const insets = useSafeAreaInsets();

  const { run, queryOne } = useSQLite("tripflow.db", {
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

  const [title, setTitle] = useState("");
  const [dateAller, setDateAller] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dateRetour, setDateRetour] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [savingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDateAllerPicker, setShowDateAllerPicker] = useState(false);
  const [showDateRetourPicker, setShowDateRetourPicker] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const formatDate = (date: Date) => {
    try {
      return date.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  const parseDateOrToday = (value: string) => {
    const candidate = new Date(value);
    return isNaN(candidate.getTime()) ? new Date() : candidate;
  };

  const formatDateDisplay = (date: Date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // On utilise directement l'URI local renvoyé par l'Image Picker

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission",
          "Autorisez l'accès à la bibliothèque pour continuer."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Image", "Échec de la sélection de l'image.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission",
          "Autorisez l'accès à la caméra pour continuer."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Image", "Échec de la prise de photo.");
    }
  };

  const handleCreateTravel = async () => {
    if (!title || !dateAller || !dateRetour || !lieu || !description) {
      Alert.alert(
        "Champs requis",
        "Veuillez renseigner tous les champs obligatoires."
      );
      return;
    }
    try {
      setLoading(true);
      const userLogin = (await SecureStore.getItemAsync("userLogin")) ?? "";
      if (!userLogin) {
        Alert.alert("Session", "Aucun utilisateur connecté.");
        return;
      }

      const user = await queryOne<{ ID: number }>(
        "SELECT ID FROM UTILISATEUR WHERE IDENTIFIANT = ?",
        [userLogin]
      );
      if (!user) {
        Alert.alert("Utilisateur", "Utilisateur introuvable.");
        return;
      }

      const imageValue = imageUri || "https://placehold.co/600x400";
      const { insertId } = await run(
        "INSERT INTO VOYAGE (TITRE, DATE_ALLER, DATE_RETOUR, LIEU, DESCRIPTION, IMAGE, ID_UTILISATEUR) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, dateAller, dateRetour, lieu, description, imageValue, user.ID]
      );

      if (insertId) {
        Alert.alert("Voyage", "Voyage créé avec succès.");
        router.replace("/home");
      }
    } catch {
      Alert.alert("Erreur", "Impossible de créer le voyage. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors[theme].background }}
    >
      <View style={styles.container}>
        <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <TopHeader />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={headerHeight + insets.top}
          enabled
        >
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 24 + insets.bottom },
            ]}
          >
            <ThemedText style={styles.title}>Créer un voyage</ThemedText>

            <View style={styles.field}>
              <ThemedLabel>Titre</ThemedLabel>
              <ThemedTextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Titre du voyage"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDateAllerPicker(true);
                }}
              >
                <ThemedLabel>
                  {`Date aller: ${formatDateDisplay(
                    parseDateOrToday(dateAller)
                  )}`}
                </ThemedLabel>
              </Pressable>
              {showDateAllerPicker && (
                <DateTimePicker
                  value={parseDateOrToday(dateAller)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setDateAller(formatDate(selectedDate));
                    }
                    setShowDateAllerPicker(false);
                  }}
                />
              )}
            </View>

            <View style={styles.field}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDateRetourPicker(true);
                }}
              >
                <ThemedLabel>
                  {`Date retour: ${formatDateDisplay(
                    parseDateOrToday(dateRetour)
                  )}`}
                </ThemedLabel>
              </Pressable>
              {showDateRetourPicker && (
                <DateTimePicker
                  value={parseDateOrToday(dateRetour)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    if (selectedDate) {
                      setDateRetour(formatDate(selectedDate));
                    }
                    setShowDateRetourPicker(false);
                  }}
                />
              )}
            </View>

            <View style={styles.field}>
              <ThemedLabel>Lieu</ThemedLabel>
              <ThemedTextInput
                value={lieu}
                onChangeText={setLieu}
                placeholder="Paris, France"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <ThemedLabel>Description</ThemedLabel>
              <ThemedTextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description du voyage"
                multiline
                style={[styles.input, styles.textarea]}
              />
            </View>

            <View style={styles.field}>
              <ThemedLabel>Image de couverture</ThemedLabel>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              ) : null}
              <View style={styles.buttonRow}>
                <ThemedButton
                  title={savingImage ? "Enregistrement…" : "Choisir une photo"}
                  onPress={handlePickImage}
                  disabled={savingImage || loading}
                  style={styles.secondaryButton}
                />
                <ThemedButton
                  title={savingImage ? "Enregistrement…" : "Prendre une photo"}
                  onPress={handleTakePhoto}
                  disabled={savingImage || loading}
                  style={styles.secondaryButton}
                />
              </View>
            </View>

            <ThemedButton
              title={loading ? "Création…" : "Créer le voyage"}
              onPress={handleCreateTravel}
              disabled={loading}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
  },
  input: {
    width: "100%",
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
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
