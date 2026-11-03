import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// The to-do screen is built in later tasks (T2–T4).
export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Tasks</Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
