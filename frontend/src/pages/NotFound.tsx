import React from "react";
import { Link } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/outline";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-primary-100 dark:bg-primary-900/20 p-3">
          <div className="rounded-full bg-primary-200 dark:bg-primary-800/30 p-2">
            <HomeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <h1 className="mt-6 text-6xl font-extrabold text-slate-900 dark:text-white">
          404
        </h1>
        <p className="mt-3 text-xl text-slate-600 dark:text-slate-300 text-center">
          Page not found
        </p>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400 text-center max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or doesn't exist.
        </p>

        <div className="mt-8">
          <Link to="/" className="btn-primary btn-lg flex items-center">
            <HomeIcon className="h-5 w-5 mr-2" />
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
