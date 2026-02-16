import AppNavigator from './apps/fan/src/navigation/AppNavigator';
import { AuthProvider } from './apps/fan/src/store/authStore';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
