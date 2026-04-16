import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Leads from "./pages/Leads";
import Invoice from "./pages/Invoice";
import Inventory from "./pages/Inventory";
import TallyDashboard from "./pages/TallyDashboard";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Home from "./components/home.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoices" element={<Invoice />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/tally-dashboard" element={<TallyDashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
