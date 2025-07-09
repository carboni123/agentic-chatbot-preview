// src/components/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-16">
            <h1 className="text-6xl font-bold text-slate-100 mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-slate-200 mb-4">
                {"Page Not Found"}
            </h2>
            <p className="text-slate-300 mb-8 max-w-md">
                {"Sorry, this page does not exist."}
            </p>
            <Link
                to="/"
                className="inline-block px-8 py-3 rounded-md font-semibold text-center transition duration-150 ease-in-out bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                {"Return"}
            </Link>
        </div>
    );
};

export default NotFoundPage;