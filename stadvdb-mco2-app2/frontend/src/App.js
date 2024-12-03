import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Tables from "./pages/Tables";
import ConcurrencyControl from "./pages/ConcurrencyControl";
import CrashRecovery from "./pages/CrashRecovery";

const App = () => {
    return (
        <Router>
            <div className="flex">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 ml-64 p-6">
                    <Routes>
                        <Route path="/tables" element={<Tables />} />
                        <Route path="/concurrency-control" element={<ConcurrencyControl />} />
                        <Route path="/crash-recovery" element={<CrashRecovery />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;
