import React, { useState } from "react";

const CrashRecovery = () => {
    const [transactions, setTransactions] = useState([
        { id: 1, node: "node1", query: "", isolation: "READ COMMITTED" },
    ]);
    const [simulationCase, setSimulationCase] = useState("case1");
    const [simulationResults, setSimulationResults] = useState([]);
    const [statusMessage, setStatusMessage] = useState("");
    const [nodeStatus, setNodeStatus] = useState({ node2: true, node3: true }); // Tracks node availability

    // Function to handle the toggle of Node 2 or Node 3
    const toggleNode = async (node) => {
        setNodeStatus((prevStatus) => {
            // Only toggle if the other node is on
            if (node === "node2") {
                if (prevStatus.node3) {
                    const newNodeStatus = {
                        ...prevStatus,
                        node2: !prevStatus.node2, // Toggle Node 2
                    };
                    if (newNodeStatus.node2) {
                        // Node 2 is being turned on, trigger retry
                        retryStashedTransactions("node2", newNodeStatus);
                    }
                    return newNodeStatus;
                }
            } else if (node === "node3") {
                if (prevStatus.node2) {
                    const newNodeStatus = {
                        ...prevStatus,
                        node3: !prevStatus.node3, // Toggle Node 3
                    };
                    if (newNodeStatus.node3) {
                        // Node 3 is being turned on, trigger retry
                        retryStashedTransactions("node3", newNodeStatus);
                    }
                    return newNodeStatus;
                }
            }
            return prevStatus; // No changes if one node is off
        });
    };
    // function for retrying the stashed transactions (recovery)
    const retryStashedTransactions = async (node, nodeStatus) => {
        try {
            const response = await fetch("http://localhost:5000/retry_stashed_transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ node, nodeStatus }),
            });
    
            const result = await response.json();
            console.log(`Retry Results for ${node}:`, result);
    
            if (result.status === "success") {
                setStatusMessage(`Stashed transactions retried successfully on ${node}!`);
            } else if (result.retry_errors && result.retry_errors.length > 0) {
                setStatusMessage(`Partial Success: ${result.retry_errors.length} error(s) occurred during retry.`);
            } else {
                setStatusMessage(`Retry completed with unknown issues on ${node}.`);
            }
    
            // Optionally update simulation results here if needed
        } catch (error) {
            console.error(`Error retrying stashed transactions on ${node}:`, error);
            setStatusMessage(`Error: Failed to retry stashed transactions on ${node} (${error.message})`);
        }
    };

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
            // Prepare the data to be sent to the backend
            const requestData = {
                simulationCase,
                transactions,
                nodeStatus,  // Add nodeStatus here
            };
    
            // Send the request to the backend
            const response = await fetch("http://localhost:5000/simulate_crash_recovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData),  // Include the data in the request body
            });
    
            // Handle the response from the backend
            const result = await response.json();
            console.log("Simulation Results:", result);
    
            if (result.status === "success") {
                setSimulationResults(result.results);
                setStatusMessage("Simulation completed successfully!");
            } else if (result.errors && result.errors.length > 0) {
                setStatusMessage(`Partial Success: ${result.errors.length} error(s) occurred.`);
            } else {
                setStatusMessage("Error: Unknown issue with simulation.");
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

            {/* Buttons to toggle Node 2 or Node 3 */}
            {simulationCase === "case2" && (
                <div className="flex space-x-4 mb-3">
                    <button
                        onClick={() => toggleNode("node2")}
                        className={`text-white font-medium px-4 py-2 rounded-md ${nodeStatus.node2 ? "bg-green-500" : "bg-red-500"}`}
                    >
                        {nodeStatus.node2 ? "Turn Node 2 Off" : "Turn Node 2 On"}
                    </button>
                    <button
                        onClick={() => toggleNode("node3")}
                        className={`text-white font-medium px-4 py-2 rounded-md ${nodeStatus.node3 ? "bg-green-500" : "bg-red-500"}`}
                    >
                        {nodeStatus.node3 ? "Turn Node 3 Off" : "Turn Node 3 On"}
                    </button>
                </div>
            )}

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

            {/* Simulation Results Section */}
            {simulationResults.length > 0 && (
                <div className="mt-10">
                    <h2 className="text-xl font-bold mb-4">Simulation Results</h2>
                    <ol className="space-y-4">
                        {simulationResults.map((result, index) => (
                            <li key={result.transaction_id}>
                                <h3 className="font-semibold text-lg">
                                    Transaction {index + 1} (ID: {result.transaction_id})
                                </h3>
                                <div className="mt-2">
                                    <p><strong>Node:</strong> {result.node}</p>
                                    <p><strong>Query:</strong> {result.query}</p>
                                    {/* Render the result message */}
                                    {result.message && (
                                        <p>
                                            <strong>Message:</strong> {result.message}
                                        </p>
                                    )}
                                    {/* Render the result as a nested table */}
                                    {renderResultTable(result.result)}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

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
