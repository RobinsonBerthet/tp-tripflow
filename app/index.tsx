import ThemedText from "@/components/atomes/ThemedText";
import LoginForm from "@/components/molecules/LoginForm";
import SignupForm from "@/components/molecules/SignupForm";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import useSQLite from "@/hooks/use-sqlite";
import bcrypt from "bcryptjs";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import "react-native-get-random-values";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = (
    colorScheme === "dark" ? "dark" : "light"
  ) as keyof typeof Colors;
  const [mode, setMode] = useState<Mode>("login");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const getUserLogin = async () => {
      const storedLogin = (await SecureStore.getItemAsync("userLogin")) ?? "";
      const storedPassword =
        (await SecureStore.getItemAsync("userPassword")) ?? "";
      if (storedLogin) {
        await handleLogin({ email: storedLogin, password: storedPassword });
      }
      setIsCheckingAuth(false);
    };
    getUserLogin();
  }, []);

  // Initialisation de la base et création de la table UTILISATEUR au montage
  const { run, queryOne } = useSQLite("tripflow.db", {
    schema: [
      `CREATE TABLE IF NOT EXISTS UTILISATEUR (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        IDENTIFIANT TEXT UNIQUE NOT NULL,
        MOT_DE_PASSE TEXT NOT NULL,
        DATE_INSCRIPTION TEXT NOT NULL
      )`,
    ],
  });

  const handleLogin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const user = await queryOne<{
        ID: number;
        IDENTIFIANT: string;
        MOT_DE_PASSE: string;
        DATE_INSCRIPTION: string;
      }>("SELECT * FROM UTILISATEUR WHERE IDENTIFIANT = ?", [email]);

      if (!user) {
        Alert.alert("Identifiants invalides", "Utilisateur introuvable.");
        return;
      }

      const ok = bcrypt.compareSync(password, user.MOT_DE_PASSE);
      if (!ok) {
        Alert.alert("Identifiants invalides", "Mot de passe incorrect.");
        return;
      }
      await SecureStore.setItemAsync("userLogin", user.IDENTIFIANT);
      await SecureStore.setItemAsync("userPassword", password);
      router.replace("/home");
    } catch {
      Alert.alert("Erreur", "Impossible de se connecter. Réessayez.");
    }
  };

  const handleSignup = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
    confirmPassword?: string;
  }) => {
    try {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const nowIso = new Date().toISOString();

      await run(
        "INSERT INTO UTILISATEUR (IDENTIFIANT, MOT_DE_PASSE, DATE_INSCRIPTION) VALUES (?, ?, ?)",
        [email, passwordHash, nowIso]
      );

      await SecureStore.setItemAsync("userLogin", email);
      await SecureStore.setItemAsync("userPassword", password);

      router.replace("/home");
    } catch (err: any) {
      const message: string = err?.message ?? "";
      if (message.includes("UNIQUE") || message.includes("unique")) {
        Alert.alert(
          "Inscription",
          "Cet identifiant est déjà utilisé. Veuillez vous connecter."
        );
        return;
      }
      console.log(err);
      Alert.alert("Erreur", "Impossible de créer le compte. Réessayez.");
    }
  };

  if (isCheckingAuth) {
    return null;
  }

  // if (hasSession) {
  //   return <Redirect href="/home" />;
  // }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setMode("login")}
          style={({ pressed }) => [
            styles.toggle,
            {
              backgroundColor:
                mode === "login" ? Colors[theme].tint : "transparent",
              borderColor: Colors[theme].tint,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.toggleText,
              {
                color:
                  mode === "login"
                    ? Colors.dark.background
                    : Colors[theme].tint,
              },
            ]}
          >
            Connexion
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setMode("signup")}
          style={({ pressed }) => [
            styles.toggle,
            {
              backgroundColor:
                mode === "signup" ? Colors[theme].tint : "transparent",
              borderColor: Colors[theme].tint,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.toggleText,
              {
                color:
                  mode === "signup"
                    ? Colors.dark.background
                    : Colors[theme].tint,
              },
            ]}
          >
            Inscription
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.formArea}>
        {mode === "login" ? (
          <LoginForm onSubmit={handleLogin} />
        ) : (
          <SignupForm onSubmit={handleSignup} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
    marginBottom: 24,
  },
  toggle: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleText: {
    fontWeight: "600",
  },
  formArea: {
    width: "100%",
  },
});
