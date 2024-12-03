import React, { useState } from "react";

const ConcurrencyControl = () => {
    const [transactions, setTransactions] = useState([
        {id: 1, node: 'node1', query: '', isolation: 'READ COMMITTED'},
    ]);
    const [simulationResults, setSimulationResults] = useState([]);

    const handleAddTransaction = () => {
        setTransactions((prev) => [
            ...prev,
            {id: prev.length + 1, node: 'node1', query:'', isolation: 'READ COMMITTED'},
        ]);
    };

    const handleRemoveTransaction = (id) => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
    };

    const handleTransactionChange = (id, field, value) => {
        setTransactions((prev) => 
            prev.map((t) => (t.id === id ? { ...t, [field]: value} : t))
        );
    };

    const handleSimulate = async () => {
        try {
            const response = await fetch("http://localhost:5000/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions }),
            });
        
            const result = await response.json();
            console.log("Simulation Results:", result);

            if (result.status === "success") {
                setSimulationResults(result.results);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error during simulation:", error);
        }
    }

    const renderResultTable = (resultData) => {
        // Render the result as a nested table
        if (Array.isArray(resultData) && resultData.length > 0) {
            const columns = Object.keys(resultData[0]);
            return (
                <div className="overflow-x-auto mt-2"> {/* Add overflow-x-auto for horizontal scrolling */}
                    <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 text-sm">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {resultData.map((row, index) => (
                                <tr key={index}>
                                    {columns.map((col) => (
                                        <td key={col} className="border border-gray-300 px-2 py-1 text-gray-700 text-sm">
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
                Transaction Simulation
            </h1>

            <table className="min-w-full border-collapse border border-gray-300">
            <thead>
                <tr>
                <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">ID</th>
                <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">Node</th>
                <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">Query</th>
                <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">Isolation Level</th>
                <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm">Actions</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map((t) => (
                <tr key={t.id}>
                    <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap">{t.id}</td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap">
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
                    <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap">
                    <input
                        type="text"
                        value={t.query}
                        onChange={(e) =>
                        handleTransactionChange(t.id, "query", e.target.value)
                        }
                    />
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap">
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
                    <td className="border border-gray-300 px-2 py-1 text-gray-700 text-sm text-center">
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
                    className="w-1/3 bg-green-500 text-white font-medium px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    Simulate Transactions
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
                                    {/* Render the result as a nested table */}
                                    {renderResultTable(result.result)}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

export default ConcurrencyControl;