import AppRoutes from "./AppRoutes";
import { Provider } from "react-redux";
import { store } from "../store";
import { Theme } from "@radix-ui/themes";
function App() {
  return (
    <Provider store={store}>
      <Theme appearance="dark" accentColor="amber" grayColor="slate">
        <AppRoutes />
      </Theme>
    </Provider>
  );
}

export default App;
