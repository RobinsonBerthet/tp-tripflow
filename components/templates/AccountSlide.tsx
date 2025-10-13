import { ThemedButton } from "@/components/atomes/ThemedButton";
import ThemedText from "@/components/atomes/ThemedText";
import { ThemedTextInput } from "@/components/atomes/ThemedTextInput";
import useSQLite from "@/hooks/use-sqlite";
import { useTravelStore } from "@/stores/travelStore";
import bcrypt from "bcryptjs";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View, ViewProps } from "react-native";

export type AccountSlideProps = ViewProps & {
  title?: string;
  subtitle?: string;
};

export default function AccountSlide({
  title = "Compte",
  subtitle = "Gérez votre profil et vos préférences",
  style,
  ...rest
}: AccountSlideProps) {
  const router = useRouter();
  const { ready, queryOne, run } = useSQLite("tripflow.db");
  const resetTravelState = useTravelStore((s) => s.resetTravelState);

  const [user, setUser] = useState<{
    ID: number;
    IDENTIFIANT: string;
    MOT_DE_PASSE: string;
    DATE_INSCRIPTION: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const canSubmitPassword = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      newPassword.trim().length >= 6 &&
      confirmPassword.trim().length >= 6
    );
  }, [currentPassword, newPassword, confirmPassword]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!ready) return;
        const login = (await SecureStore.getItemAsync("userLogin")) ?? "";
        if (!login) {
          setUser(null);
          return;
        }
        const row = await queryOne<{
          ID: number;
          IDENTIFIANT: string;
          MOT_DE_PASSE: string;
          DATE_INSCRIPTION: string;
        }>("SELECT * FROM UTILISATEUR WHERE IDENTIFIANT = ?", [login]);
        if (!cancelled) setUser(row);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [ready, queryOne]);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("userLogin");
      await SecureStore.deleteItemAsync("userPassword");
    } catch {
    } finally {
      resetTravelState();
      router.replace("/");
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    try {
      const matches = bcrypt.compareSync(currentPassword, user.MOT_DE_PASSE);
      if (!matches) {
        Alert.alert("Mot de passe", "Le mot de passe actuel est incorrect.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Mot de passe", "La confirmation ne correspond pas.");
        return;
      }
      if (newPassword.trim().length < 6) {
        Alert.alert(
          "Mot de passe",
          "Le nouveau mot de passe doit contenir au moins 6 caractères."
        );
        return;
      }
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(newPassword, salt);
      await run("UPDATE UTILISATEUR SET MOT_DE_PASSE = ? WHERE ID = ?", [
        hash,
        user.ID,
      ]);
      await SecureStore.setItemAsync("userPassword", newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Mot de passe", "Votre mot de passe a été mis à jour.");
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le mot de passe. Réessayez."
      );
    }
  };

  const dateInscription = useMemo(() => {
    if (!user?.DATE_INSCRIPTION) return "";
    try {
      // Affiche AAAA-MM-JJ pour compatibilité
      return user.DATE_INSCRIPTION.slice(0, 10);
    } catch {
      return String(user.DATE_INSCRIPTION);
    }
  }, [user]);

  return (
    <View style={[styles.container, style]} {...rest}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      ) : null}

      <View style={styles.content}>
        {loading ? (
          <ThemedText>Chargement du profil…</ThemedText>
        ) : user ? (
          <>
            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Profil</ThemedText>
              <View style={styles.rowBetween}>
                <ThemedText>Identifiant</ThemedText>
                <ThemedText style={styles.value}>{user.IDENTIFIANT}</ThemedText>
              </View>
              <View style={styles.rowBetween}>
                <ThemedText>Inscription</ThemedText>
                <ThemedText style={styles.value}>{dateInscription}</ThemedText>
              </View>
            </View>

            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>
                Modifier le mot de passe
              </ThemedText>
              <ThemedTextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Mot de passe actuel"
                secureTextEntry
                style={styles.input}
              />
              <ThemedTextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nouveau mot de passe"
                secureTextEntry
                style={styles.input}
              />
              <ThemedTextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmer le nouveau mot de passe"
                secureTextEntry
                style={styles.input}
              />
              <ThemedButton
                title="Mettre à jour le mot de passe"
                onPress={handleChangePassword}
                disabled={!canSubmitPassword}
                style={styles.primaryButton}
              />
            </View>

            <ThemedButton
              title="Se déconnecter"
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </>
        ) : (
          <>
            <ThemedText style={{ textAlign: "center" }}>
              Aucune session. Veuillez vous connecter.
            </ThemedText>
            <ThemedButton
              title="Aller à l'accueil"
              onPress={() => router.replace("/")}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  content: {
    width: "100%",
    maxWidth: 520,
    gap: 12,
  },
  card: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    fontWeight: "600",
  },
  input: {
    width: "100%",
  },
  primaryButton: {
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 8,
  },
});
