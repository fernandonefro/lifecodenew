import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGlucoseHistory, GlucoseHistoryItem } from '../hooks/useGlucoseHistory';
import { getPatientId } from '../lib/session';

const CONTEXT_LABEL: Record<string, string> = {
  FASTING: 'Jejum',
  PRE_PRANDIAL: 'Pré-prandial',
  POST_PRANDIAL: 'Pós-prandial',
  BEDTIME: 'Ao deitar',
  RANDOM: 'Aleatória',
};

function valueColor(value: number): string {
  if (value < 54 || value > 300) return '#DC2626'; // crítico
  if (value < 70 || value > 250) return '#D97706'; // alerta
  return '#16A34A'; // na faixa
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function GlucoseHistoryScreen() {
  const router = useRouter();
  const patientId = getPatientId();
  const { data, isLoading, isError, error, refetch, isRefetching } = useGlucoseHistory(patientId);

  if (!patientId) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Sessão sem paciente. Faça login para ver o histórico.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{(error as Error)?.message || 'Erro ao carregar histórico.'}</Text>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: GlucoseHistoryItem }) => (
    <View style={styles.row}>
      <View>
        <Text style={[styles.value, { color: valueColor(item.value) }]}>
          {item.value} <Text style={styles.unit}>{item.unit}</Text>
        </Text>
        <Text style={styles.context}>{CONTEXT_LABEL[item.context ?? 'RANDOM'] ?? item.context}</Text>
      </View>
      <Text style={styles.date}>{formatDate(item.measuredAt)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Glicemias</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={<Text style={styles.muted}>Nenhuma medição registrada ainda.</Text>}
        contentContainerStyle={data && data.length === 0 ? styles.center : undefined}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/glucose-entry')}>
        <Text style={styles.addButtonText}>+ Registrar nova medição</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  value: { fontSize: 22, fontWeight: '800' },
  unit: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  context: { fontSize: 13, color: '#64748B', marginTop: 2 },
  date: { fontSize: 13, color: '#94A3B8' },
  muted: { color: '#94A3B8', fontSize: 15, textAlign: 'center' },
  errorText: { color: '#DC2626', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  retry: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#0284C7', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  addButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
