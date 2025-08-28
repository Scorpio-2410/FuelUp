import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

/**
 * Homepage component that serves as the main landing page of the app.
 * Displays development information and provides links to Expo documentation.
 * Acts as a template screen that can be customized for the app's primary content.
 */
export default function Homepage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Homepage</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/Homepage.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
