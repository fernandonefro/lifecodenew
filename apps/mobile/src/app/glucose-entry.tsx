import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  glucoseIngestionSchema, 
  GlucoseIngestionDTO, 
  MeasurementSource, 
  MeasurementContext 
} from '@lifecode/shared';
import { useGlucoseIngestion } from '../hooks/useGlucoseIngestion';
import { getPatientId } from '../lib/session';

export default function GlucoseEntryScreen() {
  const router = useRouter();
  const mutation = useGlucoseIngestion();
  const [showExtremeWarning, setShowExtremeWarning] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<GlucoseIngestionDTO>({
    resolver: zodResolver(glucoseIngestionSchema),
    defaultValues: {
      patientId: getPatientId() ?? 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // sessão (fallback dev)
      externalEventId: `mob_${Date.now()}`,
      value: undefined,
      unit: 'mg/dL',
      sourceType: MeasurementSource.MANUAL,
      context: MeasurementContext.FASTING,
      measuredAt: new Date().toISOString(),
      symptomsReported: {
        confusionOrAlteredConsciousness: false,
        sweatingOrTremors: false,
        vomitingOrKetoneSigns: false,
      }
    }
  });

  const currentValue = watch('value');
  const currentContext = watch('context');

  const onSubmit = (data: GlucoseIngestionDTO) => {
    // Alerta de Confirmação para Valores Extremos (< 54 ou > 300)
    if ((data.value < 54 || data.value > 300) && !showExtremeWarning) {
      setShowExtremeWarning(true);
      Alert.alert(
        'Confirmar Valor Atípico',
        `Você digitou ${data.value} ${data.unit}. O valor está correto?`,
        [
          { text: 'Corrigir', style: 'cancel' },
          { text: 'Sim, está correto', onPress: () => sendData(data) }
        ]
      );
      return;
    }

    sendData(data);
  };

  const sendData = (data: GlucoseIngestionDTO) => {
    mutation.mutate(data, {
      onSuccess: (response) => {
        if (response.alertTriggered === 'P0') {
          Alert.alert(
            '⚠️ Alerta de Saúde',
            'Sua medição indica um valor crítico. Siga as orientações do seu plano e procure atendimento se houver mal-estar.',
            [{ text: 'Entendido', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Sucesso', 'Medição registrada com sucesso!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      },
      onError: (err: any) => {
        Alert.alert('Erro ao Salvar', err.message || 'Falha na conexão com o servidor.');
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Glicemia</Text>
      
      {/* Input Principal do Valor */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Valor Medido (mg/dL)</Text>
        <Controller
          control={control}
          name="value"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.numericInput, errors.value && styles.inputError]}
              keyboardType="numeric"
              placeholder="Ex: 110"
              placeholderTextColor="#94A3B8"
              value={value ? String(value) : ''}
              onChangeText={(val) => onChange(val ? Number(val) : undefined)}
              accessibilityLabel="Valor da glicemia em miligramas por decilitro"
            />
          )}
        />
        {errors.value && <Text style={styles.errorText}>{errors.value.message}</Text>}
      </View>

      {/* Seleção do Contexto da Medição */}
      <Text style={styles.label}>Momento da Medição</Text>
      <View style={styles.contextGrid}>
        {[
          { label: 'Jejum', value: MeasurementContext.FASTING },
          { label: 'Pré-Prandial', value: MeasurementContext.PRE_PRANDIAL },
          { label: 'Pós-Prandial', value: MeasurementContext.POST_PRANDIAL },
          { label: 'Ao Deitar', value: MeasurementContext.BEDTIME },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.contextButton,
              currentContext === item.value && styles.contextButtonActive
            ]}
            onPress={() => setValue('context', item.value)}
          >
            <Text style={[
              styles.contextButtonText,
              currentContext === item.value && styles.contextButtonTextActive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Triagem de Sintomas Importantes */}
      <View style={styles.symptomsBox}>
        <Text style={styles.symptomsTitle}>Sintomas no momento (Opcional):</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Suor frio ou tremores</Text>
          <Controller
            control={control}
            name="symptomsReported.sweatingOrTremors"
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Tontura, confusão ou visão turva</Text>
          <Controller
            control={control}
            name="symptomsReported.confusionOrAlteredConsciousness"
            render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} />
            )}
          />
        </View>
      </View>

      {/* Botão de Envio com Estado de Loading */}
      <TouchableOpacity 
        style={[styles.submitButton, mutation.isPending && styles.disabledButton]}
        onPress={handleSubmit(onSubmit)}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>Salvar Medição</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 8 },
  numericInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 14, marginTop: 4 },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  contextButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  contextButtonActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  contextButtonText: { color: '#475569', fontWeight: '500' },
  contextButtonTextActive: { color: '#FFFFFF', fontWeight: '700' },
  symptomsBox: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  symptomsTitle: { fontSize: 15, fontWeight: '600', color: '#92400E', marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: { fontSize: 14, color: '#78350F', flex: 1 },
  submitButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
