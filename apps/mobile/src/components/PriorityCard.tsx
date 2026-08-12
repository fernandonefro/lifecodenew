import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface PriorityItem {
  id: string;
  type: 'TASK' | 'SECURITY' | 'CARE_TEAM';
  title: string;
  description: string;
  dueDateLabel?: string;
  actionText: string;
  route?: string;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface PriorityCardProps {
  item: PriorityItem;
  onPress: () => void;
}

export const PriorityCard: React.FC<PriorityCardProps> = ({ item, onPress }) => {
  const getSeverityBorder = () => {
    switch (item.severity) {
      case 'HIGH':
        return '#EF4444';
      case 'MEDIUM':
        return '#F59E0B';
      default:
        return '#0284C7';
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: getSeverityBorder() }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        {item.dueDateLabel && (
          <Text style={styles.dueDate}>{item.dueDateLabel}</Text>
        )}
      </View>
      <Text style={styles.description}>{item.description}</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.actionText}
      >
        <Text style={styles.actionText}>{item.actionText} →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
  },
});
