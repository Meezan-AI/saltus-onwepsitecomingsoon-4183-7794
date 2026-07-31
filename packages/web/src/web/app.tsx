import { Route, Switch } from "wouter";
import Index from "./pages/index";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";
import { WhatsAppButton } from "./components/whatsapp-button";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      <WhatsAppButton />
    </Provider>
  );
}

export default App;
