import React, { useEffect, useState } from "react";
import axios from "axios";

const Tables = () => {
    const [records, setRecords] = useState([]); // Holds the table data
    const [columns, setColumns] = useState([]); // Holds table column names
    const [page, setPage] = useState(1); // Current page number
    const [totalPages, setTotalPages] = useState(1); // Total number of pages
    const [inputPage, setInputPage] = useState(1); // For page input field
    const [searchGameId, setSearchGameId] = useState(""); // Search field for game_id
    const [loading, setLoading] = useState(false); // Loading state
    const [error, setError] = useState(null); // Error state

    const itemsPerPage = 10; // Rows per page

    // Fetch records from the backend
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/get_combined_records?page=${page}&game_id=${searchGameId}`
            );
            const data = response.data.records;
            const totalRecords = response.data.total_records;
    
            if (data.length > 0) {
                setColumns(Object.keys(data[0])); // Dynamically extract column names
            }
    
            setRecords(data);
            setTotalPages(Math.ceil(totalRecords / itemsPerPage)); // Calculate total pages
            setError(null);
        } catch (err) {
            setError(err.response ? err.response.data.error : err.message);
        } finally {
            setLoading(false);
        }
    };
    

    // Fetch records when the component loads or when the page changes
    useEffect(() => {
        fetchRecords();
    }, [page]);

    // Handle page jump
    const handlePageJump = () => {
        if (inputPage >= 1 && inputPage <= totalPages) {
            setPage(inputPage);
        }
    };

    // Handle search
    const handleSearch = () => {
        setPage(1); // Reset to the first page on a new search
        fetchRecords();
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white text-gray-800 shadow-md rounded-lg">
            <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
                Combined Records (Node 1 Central)
            </h1>

            {/* Search Field */}
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    value={searchGameId}
                    onChange={(e) => setSearchGameId(e.target.value)}
                    placeholder="Search by Game ID"
                    className="px-4 py-2 border border-gray-300 rounded-md flex-grow mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                >
                    Search
                </button>
            </div>

            {loading ? (
                <p className="text-center text-gray-600">Loading...</p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    {columns.map((col, index) => (
                                        <th
                                            key={index}
                                            className="px-4 py-3 text-left font-medium text-gray-800"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className={`${
                                            rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                                        } hover:bg-gray-100`}
                                    >
                                        {columns.map((col, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className="px-4 py-4 text-gray-700 text-sm relative group"
                                            >
                                                <div className="truncate max-w-[150px]">
                                                    {record[col] !== null ? record[col].toString() : ""}
                                                </div>
                                                {/* Tooltip for hovering */}
                                                <div className="absolute hidden group-hover:block z-10 bg-gray-800 text-white text-xs p-2 rounded-md shadow-lg whitespace-normal max-w-[200px]">
                                                    {record[col] !== null ? record[col].toString() : ""}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center mt-4 space-x-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <div className="flex items-center space-x-2">
                            <span className="text-gray-700">Page</span>
                            <input
                                type="number"
                                value={inputPage}
                                onChange={(e) => setInputPage(Number(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                                max={totalPages}
                            />
                            <span className="text-gray-700">of {totalPages}</span>
                            <button
                                onClick={handlePageJump}
                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                            >
                                Go
                            </button>
                        </div>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tables;
