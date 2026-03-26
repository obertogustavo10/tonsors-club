import AppRoutes from "./AppRoutes";
import { Provider } from "react-redux";
import { store } from "../store";
import { Theme } from "@radix-ui/themes";
import { AuthProvider } from "./context/AuthContext";
function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Theme appearance="dark" accentColor="amber" grayColor="slate">
          <AppRoutes />
        </Theme>
      </AuthProvider>
    </Provider>
  );
}

export default App;
