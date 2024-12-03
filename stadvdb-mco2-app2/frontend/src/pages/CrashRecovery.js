import React, { useState } from "react";
import axios from "axios";

const CrashRecovery = () => {
    const [selectedCase, setSelectedCase] = useState("");
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCaseSubmit = async () => {
        if (!selectedCase) {
            setError("Please select a failure case.");
            return;
        }

        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/crash-recovery", {
                case: selectedCase,
            });
            setResponse(res.data);
        } catch (err) {
            setError(err.response ? err.response.data.message : "An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Crash and Recovery Simulation
            </h1>

            <div className="space-y-4">
                <div>
                    <label className="font-medium text-gray-700">Select a Failure Case:</label>
                    <select
                        value={selectedCase}
                        onChange={(e) => setSelectedCase(e.target.value)}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Select a Case --</option>
                        <option value="case1">Case #1: Central Node Failure</option>
                        <option value="case2">Case #2: Node 2 or Node 3 Failure</option>
                        <option value="case3">Case #3: Failure to Write to Central Node</option>
                        <option value="case4">Case #4: Failure to Write to Node 2 or Node 3</option>
                    </select>
                </div>

                <button
                    onClick={handleCaseSubmit}
                    className="w-full bg-blue-500 text-white font-medium px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Simulate Crash and Recovery
                </button>
            </div>

            {isLoading && (
                <p className="text-center text-gray-700 mt-4">Simulating...</p>
            )}

            {error && (
                <p className="text-red-500 font-medium mt-4">{error}</p>
            )}

            {response && (
                <div className="mt-6 bg-gray-100 p-4 rounded-md">
                    <h2 className="text-lg font-semibold text-gray-800">Response</h2>
                    <pre className="text-sm text-gray-700 mt-2">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CrashRecovery;
