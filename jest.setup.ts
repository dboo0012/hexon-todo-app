// In-memory AsyncStorage so tests never touch device storage.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// SafeAreaProvider renders nothing until it measures insets; the mock provides fixed ones.
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default,
);
