import { useState, useRef } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import QueryPage from "./pages/QueryPage";
import SchemaPage from "./pages/SchemaPage";
import AgentPage from "./pages/AgentPage";
import PipelinePage from "./pages/PipelinePage";
import DataQualityPage from "./pages/DataQualityPage";
import MetricsDashboard from "./pages/MetricsDashboard";
import GovernancePage from "./pages/GovernancePage";
import MonitorPage from "./pages/MonitorPage";

const PAGES = {
  dashboard:  { component: MetricsDashboard, title: "Mission Control",        subtitle: "Live platform health & metrics" },
  query:      { component: QueryPage,        title: "Natural Language Query",  subtitle: "Ask anything about your data" },
  schema:     { component: SchemaPage,       title: "Database Schema",         subtitle: "Explore tables, columns & relations" },
  agent:      { component: AgentPage,        title: "AI Data Agent",           subtitle: "Autonomous analysis & insights" },
  pipeline:   { component: PipelinePage,     title: "Pipeline Builder",        subtitle: "Design ETL workflows visually" },
  monitor:    { component: MonitorPage,      title: "Pipeline Monitor",        subtitle: "Run history & failure diagnosis" },
  governance: { component: GovernancePage,   title: "Data Governance",         subtitle: "PII · Contracts · Anomalies" },
  quality:    { component: DataQualityPage,  title: "Data Quality",            subtitle: "Automated health checks" },
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  // Track which pages have been visited (so we mount them once and keep state)
  const visitedRef = useRef(new Set(["dashboard"]));

  const handleNavigate = (page) => {
    visitedRef.current.add(page);
    setActivePage(page);
  };

  return (
    <div
      className="flex h-screen "
      style={{
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col ">
        <Topbar title={PAGES[activePage].title} subtitle={PAGES[activePage].subtitle} />
        <main className="flex-1 overflow-auto p-6">
          {/* Render all visited pages but only show active — preserves state */}
          {Object.entries(PAGES).map(([key, { component: PageComponent }]) => {
            if (!visitedRef.current.has(key)) return null;
            return (
              <div
                key={key}
                style={{ display: activePage === key ? "block" : "none" }}
                className="h-full"
              >
                <PageComponent />
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}
