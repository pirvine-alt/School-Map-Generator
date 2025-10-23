import React, { useState, useEffect, useCallback } from 'react';
import { School } from './types';
import { MapComponent } from './components/MapComponent';
import { fetchSchoolData } from './services/googleSheetService';
import { GOOGLE_SHEET_CSV_URL } from './constants';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-gray-600">Loading school data...</p>
  </div>
);

interface ErrorDisplayProps {
  message: string;
  details?: React.ReactNode;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, details }) => (
  <div className="flex items-center justify-center h-full bg-red-50 p-4">
    <div className="text-center max-w-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-red-700">An Error Occurred</h2>
        <p className="mt-2 text-red-600">{message}</p>
        {details && (
          <div className="mt-4 text-sm text-left text-gray-600 bg-red-100 p-3 rounded-lg border border-red-200">
            {details}
          </div>
        )}
    </div>
  </div>
);

interface AppError {
    message: string;
    details?: React.ReactNode;
}

/**
 * Waits for a global library to be available on the window object.
 * @param name The name of the library on the window object (e.g., 'google', 'Papa').
 * @returns A promise that resolves when the library is loaded, or rejects on timeout.
 */
const waitForLibrary = (name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // Try for 5 seconds (50 * 100ms)
    const checkInterval = setInterval(() => {
      if (typeof (window as any)[name] !== 'undefined') {
        clearInterval(checkInterval);
        resolve();
      } else {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error(`The '${name}' library failed to load from the CDN, please check your network connection.`));
        }
      }
    }, 100);
  });
};

const App: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AppError | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Wait for external libraries to be loaded before proceeding.
      await waitForLibrary('google');
      // Fix: Access google maps API through `(window as any)` to avoid TypeScript errors.
      if (typeof (window as any).google.maps === 'undefined') {
        // This case is unlikely if 'google' loaded, but good for safety.
        throw new Error('Google Maps API script loaded, but maps object is not available.');
      }
      await waitForLibrary('Papa');

      const data = await fetchSchoolData(GOOGLE_SHEET_CSV_URL);
      setSchools(data);
      setLastUpdated(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      let errorDetails: React.ReactNode = null;

      if (errorMessage.includes('google') || errorMessage.includes('Google')) {
        errorDetails = (
          <>
            <p className="font-semibold mb-2">How to fix this:</p>
            This is likely due to a missing or invalid API key. Please check the <code className="text-red-800 font-mono p-1 rounded">index.html</code> file and ensure you have replaced <code className="text-red-800 font-mono p-1 rounded">YOUR_GOOGLE_MAPS_API_KEY</code> with a valid key from the Google Cloud Console.
          </>
        );
      } else if (errorMessage.includes('Papa')) {
        errorDetails = (
           <>
                <p className="font-semibold mb-2">How to fix this:</p>
                The PapaParse library, which is used to read the Google Sheet data, could not be loaded. Please check your internet connection and ensure that browser extensions (like ad blockers) are not blocking scripts from <code className="text-red-800 font-mono p-1 rounded">cdn.jsdelivr.net</code>.
           </>
       );
   } else {
        errorDetails = (
            <>
                <p className="font-semibold mb-2">How to fix this:</p>
                Please check the <code className="text-red-800 font-mono p-1 rounded">GOOGLE_SHEET_CSV_URL</code> in the <code className="text-red-800 font-mono p-1 rounded">constants.ts</code> file and ensure your Google Sheet is published correctly to the web as a CSV file.
            </>
        );
      }
      setError({ message: errorMessage, details: errorDetails });
      setLastUpdated(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSelectedSchool(null);
      return;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const foundSchool = schools.find(school =>
      school.name.toLowerCase().includes(lowerCaseSearchTerm)
    );

    if (foundSchool) {
      setSelectedSchool(foundSchool);
    } else {
      alert(`No school found matching "${searchTerm}".`);
      setSelectedSchool(null);
    }
  };

  const handleSchoolSelect = (school: School | null) => {
    setSelectedSchool(school);
  };

  const renderContent = () => {
    if (isLoading && schools.length === 0) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <ErrorDisplay message={error.message} details={error.details} />;
    }
    return <MapComponent schools={schools} selectedSchool={selectedSchool} onSchoolSelect={handleSchoolSelect} />;
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-white shadow-md z-20">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-gray-900">
              NYC High Schools Status Map
            </h1>
            {!isLoading && !error && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <form onSubmit={handleSearch} className="flex-grow flex">
                  <input
                    type="text"
                    placeholder="Search school name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    aria-label="Search for a school"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </form>
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Refresh school data"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.223 1 1 0 01-1.79 1.026A5.002 5.002 0 005.999 7H8a1 1 0 010 2H3a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.223 1 1 0 011.79-1.026A5.002 5.002 0 0014.001 13H12a1 1 0 010-2h5a1 1 0 011 1v5a1 1 0 01-1 1z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          {lastUpdated && !error && (
            <p className="text-xs text-gray-500 mt-2 text-right w-full">
                Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
      </header>
      <main className="flex-grow relative">
        { (isLoading && schools.length > 0) &&
            <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg z-10 flex items-center">
                <LoadingSpinner />
                <span className="ml-2 text-sm text-gray-600">Updating...</span>
            </div>
        }
        {renderContent()}
      </main>
    </div>
  );
};

export default App;