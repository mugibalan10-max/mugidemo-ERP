import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Leads from "./pages/Leads";
import Invoice from "./pages/Invoice";
import Inventory from "./pages/Inventory";
import TallyDashboard from "./pages/TallyDashboard";
import TaskManager from "./pages/TaskManager";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Home from "./components/home.js";
import Vendors from "./pages/procurement/Vendors";
import PurchaseOrders from "./pages/procurement/PurchaseOrders";
import CreatePO from "./pages/procurement/CreatePO";
import GRN from "./pages/procurement/GRN";
import VendorBills from "./pages/finance/VendorBills";
import VendorLedger from "./pages/finance/VendorLedger";
import AgingDashboard from "./pages/finance/AgingDashboard";

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
        <Route path="/tasks" element={<TaskManager />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/purchase-view" element={<PurchaseOrders />} />
        <Route path="/create-po" element={<CreatePO />} />
        <Route path="/grn" element={<GRN />} />
        <Route path="/vendor-bills" element={<VendorBills />} />
        <Route path="/vendor-ledger" element={<VendorLedger />} />
        <Route path="/aging-dashboard" element={<AgingDashboard />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
