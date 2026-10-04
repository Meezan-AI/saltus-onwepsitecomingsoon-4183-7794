import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
// The home route stays eager — it's the most-landed-on page and the one that
// most benefits from zero extra waterfall. Every other route is code-split
// per-route (route-based code splitting), so a first-time visitor only pays
// for the JS of the page they actually opened.
import Index from "./pages/index";
const ServicesPage = lazy(() => import("./pages/services"));
const ConferencesPage = lazy(() => import("./pages/conferences-exhibitions"));
const AboutPage = lazy(() => import("./pages/about"));
const ContactPage = lazy(() => import("./pages/contact"));
const PortfolioPage = lazy(() => import("./pages/portfolio"));
const InsightsPage = lazy(() => import("./pages/insights"));
const InsightPage = lazy(() => import("./pages/insight"));
const ServicePage = lazy(() => import("./pages/service"));
const BusinessCardPage = lazy(() => import("./pages/business-card"));
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";
import { WhatsAppButton } from "./components/whatsapp-button";
import { BackToTop } from "./components/back-to-top";
import { AnalyticsListener } from "./components/analytics-listener";
import { LanguageProvider } from "./i18n";

function ScrollManager() {
  const [location] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [location]);

  return null;
}

function App() {
  return (
    <Provider>
      <LanguageProvider>
        <ScrollManager />
        <AnalyticsListener />
        <Suspense fallback={<div className="min-h-[100svh] bg-[#0b1f3a]" />}>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/services" component={ServicesPage} />
            <Route path="/services/:slug" component={ServicePage} />
            <Route path="/portfolio" component={PortfolioPage} />
            <Route path="/insights" component={InsightsPage} />
            <Route path="/insights/:slug" component={InsightPage} />
            <Route path="/conferences-exhibitions" component={ConferencesPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/business-card" component={BusinessCardPage} />
            <Route component={Index} />
          </Switch>
        </Suspense>
        {/* Do not remove — off by default, activated by parent iframe via postMessage */}
        {import.meta.env.DEV && <AgentFeedback />}
        <WhatsAppButton hideOn={["/business-card"]} />
        <BackToTop />
      </LanguageProvider>
    </Provider>
  );
}

export default App;
