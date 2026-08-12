import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MobileAppHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lifecode Paciente</Text>
      <Text style={styles.subtitle}>Cuidado e Gestão Contínua do Diabetes</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Glicemia no Alvo: 115 mg/dL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeText: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
