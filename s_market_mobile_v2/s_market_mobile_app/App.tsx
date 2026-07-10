import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';
import { CompareProvider } from './src/context/CompareContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <CompareProvider>
            <RootNavigator />
          </CompareProvider>
        </SafeAreaView>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
