import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { PriorityCard, PriorityItem } from '../../components/PriorityCard';
import { SafetyAlertBanner } from '../../components/SafetyAlertBanner';

export default function HomeScreen() {
  const router = useRouter();

  // Mock de prioridades ordenadas pelo Motor de Jornada (limite estrito de 3 itens)
  const topPriorities: PriorityItem[] = [
    {
      id: 'p1',
      type: 'TASK',
      title: 'Registrar Glicemia Pós-Prandial',
      description: 'Importante para avaliar a resposta ao almoço conforme seu plano individualizado.',
      dueDateLabel: 'Devido até 14:30',
      actionText: 'Registrar Agora',
      route: '/glucose-entry',
      severity: 'HIGH',
    },
    {
      id: 'p2',
      type: 'SECURITY',
      title: 'Tendência da Semana',
      description: 'Sua média semanal está em 128 mg/dL. 85% do tempo no alvo.',
      actionText: 'Ver Detalhes',
      severity: 'LOW',
    },
    {
      id: 'p3',
      type: 'CARE_TEAM',
      title: 'Dúvida com a Medicação?',
      description: 'Sua próxima consulta com Dr. Fernando está agendada para 20/Ago.',
      actionText: 'Enviar Mensagem',
      severity: 'MEDIUM',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho Limpo e Acessível */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, Fernando</Text>
          <Text style={styles.subtitle}>Suas prioridades de hoje:</Text>
        </View>

        {/* Banner de Aviso de Emergência (Invariável) */}
        <SafetyAlertBanner 
          message="Em caso de sintomas graves ou mal-estar intenso, procure um serviço de urgência imediatamente."
        />

        {/* Lista de Até 3 Prioridades */}
        <View style={styles.priorityList}>
          {topPriorities.slice(0, 3).map((item) => (
            <PriorityCard
              key={item.id}
              item={item}
              onPress={() => item.route && router.push(item.route as any)}
            />
          ))}
        </View>

        {/* Botão de Ação Rápida Secundário */}
        <TouchableOpacity 
          style={styles.quickAddButton} 
          onPress={() => router.push('/glucose-entry')}
          accessibilityLabel="Ação rápida: Registrar medição de glicemia"
          accessibilityRole="button"
        >
          <Text style={styles.quickAddButtonText}>+ Nova Medição Manual</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  header: { marginBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 16, color: '#475569', marginTop: 4 },
  priorityList: { marginVertical: 12 },
  quickAddButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  quickAddButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
