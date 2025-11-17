// Quick utility component to clear localStorage
// Add this temporarily to your App.tsx if needed

export const ClearStorageButton = () => {
    const handleClear = () => {
        if (window.confirm('Clear all stored data and reload?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <button
            onClick={handleClear}
            className="fixed bottom-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors z-50"
        >
            Clear Storage & Reload
        </button>
    );
};


