import React, { useState } from "react";
import axios from "axios";

const App = () => {
    const [node, setNode] = useState("node2");
    const [query, setQuery] = useState("SELECT * FROM games_frag1 LIMIT 10");
    const [isolationLevel, setIsolationLevel] = useState("READ COMMITTED");
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("http://localhost:5000/simulate", {
                node,
                queries: [query],
                isolation_level: isolationLevel,
            });
            setResponse(res.data);
            setError(null);
        } catch (err) {
            setError(err.response ? err.response.data.message : err.message);
            setResponse(null);
        }
    };

    const renderTable = (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            return <p className="text-gray-600">No results found.</p>;
        }
    
        const headers = Object.keys(data[0]);
    
        return (
            <div className="overflow-x-auto mt-6">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead>
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className="border border-gray-300 px-2 py-1 bg-gray-100 text-gray-800 font-medium text-left text-sm"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}
                            >
                                {headers.map((header, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="border border-gray-300 px-2 py-1 text-gray-700 text-sm max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap"
                                    >
                                        <div className="max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                                            {row[header]}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };
    
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Transaction Simulation
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col">
                    <label className="font-medium text-gray-700">Node:</label>
                    <select
                        value={node}
                        onChange={(e) => setNode(e.target.value)}
                        className="mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="node1">Node 1 (Central)</option>
                        <option value="node2">Node 2</option>
                        <option value="node3">Node 3</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="font-medium text-gray-700">Query:</label>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter SQL Query"
                        className="mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="font-medium text-gray-700">
                        Isolation Level:
                    </label>
                    <select
                        value={isolationLevel}
                        onChange={(e) => setIsolationLevel(e.target.value)}
                        className="mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="READ UNCOMMITTED">READ UNCOMMITTED</option>
                        <option value="READ COMMITTED">READ COMMITTED</option>
                        <option value="REPEATABLE READ">REPEATABLE READ</option>
                        <option value="SERIALIZABLE">SERIALIZABLE</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-500 text-white font-medium px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    Simulate Transaction
                </button>
            </form>

            <h2 className="text-xl font-semibold mt-6 text-gray-800">Response</h2>
            {error && <p className="text-red-500 font-medium">Error: {error}</p>}
            {response && response.results && Array.isArray(response.results[0])
                ? renderTable(response.results[0])
                : response && (
                    <pre className="bg-gray-100 p-4 rounded-md mt-4 text-gray-700">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                )}
        </div>
    );
};

export default App;
