import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DJTopNav } from "./DJTopNav";
import { DJCalendarScreen } from "./DJCalendarScreen";
import { DJPortfolioEditor } from "./DJPortfolioEditor";
import { DJRequestsScreen } from "./DJRequestsScreen"; 
import { EarningsDashboardScreen } from "./EarningsDashboardScreen";

export default function App() {
  return (
    <Router>
      <DJTopNav />
      <Routes>
        <Route path="/" element={<DJRequestsScreen />} />
        <Route path="/requests" element={<DJRequestsScreen />} />
        <Route path="/dj-gigs" element={<DJCalendarScreen />} />
        <Route path="/dj-portfolio" element={<DJPortfolioEditor />} />
        <Route path="/dashboard" element={<EarningsDashboardScreen />} />
      </Routes>
    </Router>
  );
}