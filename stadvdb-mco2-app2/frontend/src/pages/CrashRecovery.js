import React, { useState } from "react";

const CrashRecovery = () => {
    const [transactions, setTransactions] = useState([
        { id: 1, node: "node1", query: "", isolation: "READ COMMITTED" },
    ]);
    const [simulationCase, setSimulationCase] = useState("case1");
    const [simulationResults, setSimulationResults] = useState([]);
    const [statusMessage, setStatusMessage] = useState("");

    const handleAddTransaction = () => {
        setTransactions((prev) => [
            ...prev,
            { id: prev.length + 1, node: "node1", query: "", isolation: "READ COMMITTED" },
        ]);
    };

    const handleRemoveTransaction = (id) => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
    };

    const handleTransactionChange = (id, field, value) => {
        setTransactions((prev) =>
            prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
        );
    };

    const handleSimulate = async () => {
        setStatusMessage("Simulating...");
        try {
            const response = await fetch("http://localhost:5000/simulate_crash_recovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simulationCase, transactions }),
            });

            const result = await response.json();
            if (result.status === "success") {
                setSimulationResults(result.results);
                setStatusMessage("Simulation completed successfully!");
            } else {
                setStatusMessage(`Error: ${result.message}`);
            }
        } catch (error) {
            setStatusMessage(`Error: ${error.message}`);
        }
    };

    const renderResultTable = (resultData) => {
        if (Array.isArray(resultData) && resultData.length > 0) {
            const columns = Object.keys(resultData[0]);
            return (
                <div className="overflow-x-auto mt-2">
                    <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th
                                        key={index}
                                        className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 text-sm"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {resultData.map((row, index) => (
                                <tr key={index}>
                                    {columns.map((col) => (
                                        <td
                                            key={col}
                                            className="border border-gray-300 px-2 py-1 text-gray-700 text-sm"
                                        >
                                            {row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return <p>No results</p>;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Crash and Recovery Simulation
            </h1>

            {/* Simulation Case Selection */}
            <div className="flex flex-col mb-4">
                <label className="font-medium text-gray-700 mb-2">Select Case:</label>
                <select
                    value={simulationCase}
                    onChange={(e) => setSimulationCase(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="case1">Case 1: Central Node Failure</option>
                    <option value="case2">Case 2: Node 2/3 Failure</option>
                    <option value="case3">Case 3: Failure Writing to Central Node</option>
                    <option value="case4">Case 4: Failure Writing to Node 2/3</option>
                </select>
            </div>

            {/* Transactions Table */}
            <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">
                            ID
                        </th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">
                            Node
                        </th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">
                            Query
                        </th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">
                            Isolation Level
                        </th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t) => (
                        <tr key={t.id}>
                            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm">
                                {t.id}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm">
                                <select
                                    value={t.node}
                                    onChange={(e) =>
                                        handleTransactionChange(t.id, "node", e.target.value)
                                    }
                                >
                                    <option value="node1">Node 1 (Central)</option>
                                    <option value="node2">Node 2</option>
                                    <option value="node3">Node 3</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm">
                                <input
                                    type="text"
                                    value={t.query}
                                    onChange={(e) =>
                                        handleTransactionChange(t.id, "query", e.target.value)
                                    }
                                    placeholder="Enter SQL Query"
                                    className="w-full"
                                />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm">
                                <select
                                    value={t.isolation}
                                    onChange={(e) =>
                                        handleTransactionChange(t.id, "isolation", e.target.value)
                                    }
                                >
                                    <option>READ UNCOMMITTED</option>
                                    <option>READ COMMITTED</option>
                                    <option>REPEATABLE READ</option>
                                    <option>SERIALIZABLE</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm">
                                <button
                                    onClick={() => handleRemoveTransaction(t.id)}
                                    className="bg-red-500 text-white font-medium px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-center space-x-4 mt-4">
                <button
                    onClick={handleAddTransaction}
                    className="w-1/3 bg-green-500 text-white font-medium px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    Add Transaction
                </button>
                <button
                    onClick={handleSimulate}
                    className="w-1/3 bg-blue-500 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Simulate Crash and Recovery
                </button>
            </div>

            {/* Simulation Results */}
            <div className="mt-10">
                <h2 className="text-xl font-bold mb-4">Simulation Results</h2>
                {simulationResults.map((result, index) => (
                    <div key={index} className="mb-6">
                        <h3 className="font-semibold">Transaction {index + 1}:</h3>
                        {renderResultTable(result)}
                    </div>
                ))}
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded">
                    {statusMessage}
                </div>
            )}
        </div>
    );
};

export default CrashRecovery;
