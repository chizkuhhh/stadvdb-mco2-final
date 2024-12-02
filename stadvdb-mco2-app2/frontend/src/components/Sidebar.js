import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="w-64 h-screen bg-gray-800 text-white fixed">
            <div className="p-6">
                <h1 className="text-2xl font-bold">Menu</h1>
                <nav className="mt-6">
                    <ul className="space-y-4">
                        <li>
                            <Link
                                to="/concurrency-control"
                                className="text-gray-300 hover:text-white hover:bg-gray-700 block px-4 py-2 rounded"
                            >
                                Concurrency Control and Consistency
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/crash-recovery"
                                className="text-gray-300 hover:text-white hover:bg-gray-700 block px-4 py-2 rounded"
                            >
                                Crash and Recovery
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
