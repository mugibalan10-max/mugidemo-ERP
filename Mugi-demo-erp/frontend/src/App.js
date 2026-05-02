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

import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected ERP Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/tally-dashboard" element={<ProtectedRoute><TallyDashboard /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TaskManager /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
        <Route path="/purchase-view" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/create-po" element={<ProtectedRoute><CreatePO /></ProtectedRoute>} />
        <Route path="/grn" element={<ProtectedRoute><GRN /></ProtectedRoute>} />
        <Route path="/vendor-bills" element={<ProtectedRoute><VendorBills /></ProtectedRoute>} />
        <Route path="/vendor-ledger" element={<ProtectedRoute><VendorLedger /></ProtectedRoute>} />
        <Route path="/aging-dashboard" element={<ProtectedRoute><AgingDashboard /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
