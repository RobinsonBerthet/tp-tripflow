import ThemedButton from "@/components/atomes/ThemedButton";
import ThemedLabel from "@/components/atomes/ThemedLabel";
import ThemedPasswordInput from "@/components/atomes/ThemedPasswordInput";
import ThemedText from "@/components/atomes/ThemedText";
import ThemedTextInput from "@/components/atomes/ThemedTextInput";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

export type SignupFormProps = {
  onSubmit?: (payload: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void> | void;
  title?: string;
  submitLabel?: string;
};

export default function SignupForm({
  onSubmit,
  title = "Inscription",
  submitLabel = "S'inscrire",
}: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Champs requis", "Veuillez renseigner tous les champs.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mot de passe", "Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit?.({ email, password, confirmPassword });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>

      <View style={styles.field}>
        <ThemedLabel>Email</ThemedLabel>
        <ThemedTextInput
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.field}>
        <ThemedLabel>Mot de passe</ThemedLabel>
        <ThemedPasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />
      </View>

      <View style={styles.field}>
        <ThemedLabel>Confirmer le mot de passe</ThemedLabel>
        <ThemedPasswordInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
        />
      </View>

      <ThemedButton
        title={loading ? "Inscription…" : submitLabel}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  field: {
    marginBottom: 16,
  },
});
