import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SafetyAlertBannerProps {
  message: string;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ message }) => {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  text: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
});
