import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { EventClient } from "@tanstack/devtools-event-client"
import { useColorScheme } from '@/hooks/use-color-scheme';

const eventClient = new EventClient({
  pluginId: 'my-app',
  debug: true,
  // Uncomment the line below to see logs from the event client
  // onLog: console.log,
})

eventClient.on("test", pay => {
  console.log('Received test event with payload:', pay);
})

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
