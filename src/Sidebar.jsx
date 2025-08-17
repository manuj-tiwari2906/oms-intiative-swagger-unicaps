import React, { useState, useRef, useEffect } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

const Sidebar = ({
  topLevelRequests,
  folders,
  selectedTab,
  handleTabSelect,
  handleFileUpload,
  onAddFolder,
  onDeleteFolder
}) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const inputRef = useRef();
  const [folderName, setFolderName] = useState("");

  // Results state
  const [runResults, setRunResults] = useState([]);
  const [runStep, setRunStep] = useState(0);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  useEffect(() => {
    // Expose collection and environment to window for run button
    window.__COLLECTION_STATE__ = topLevelRequests.length || folders.length
      ? {
          ...((window.__COLLECTION_STATE__ && typeof window.__COLLECTION_STATE__ === 'object') ? window.__COLLECTION_STATE__ : {}),
          item: [...topLevelRequests, ...folders],
        }
      : undefined;
    window.__ENV_STATE__ = undefined;
  }, [topLevelRequests, folders]);

  return (
    <aside
      className="bg-blue-900 text-white flex flex-col py-3 px-2 shadow-lg h-screen overflow-y-auto resize-x"
      style={{ maxHeight: '100vh', minWidth: '140px', width: '13rem', maxWidth: '28vw', resize: 'horizontal' }}
    >
      <h2 className="text-blue-300 text-base font-semibold mb-3 tracking-wide flex items-center justify-between">
        Collections
        <button
          className="ml-2 px-1 py-0.5 rounded bg-blue-700 text-blue-100 hover:bg-blue-800 hover:text-white transition text-xs flex items-center"
          title="Add Folder"
          onClick={() => setShowAddInput(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </h2>
      {topLevelRequests.length > 0 && (
        <button
          onClick={() => handleTabSelect("__top__")}
          className={`w-full text-left px-1.5 py-0.5 mb-1 rounded transition-colors font-normal text-xs ${selectedTab === "__top__" ? 'bg-blue-600 text-white' : 'hover:bg-blue-800 text-blue-200'}`}
        >
          Top-level Requests
        </button>
      )}
      <div>
        {folders.map((folder, idx) => (
          <div key={folder.name + idx} className="flex items-center mb-1 group">
            <button
              onClick={() => handleTabSelect(folder.name)}
              className={`flex-1 text-left px-1.5 py-0.5 rounded transition-colors font-normal text-xs ${selectedTab === folder.name ? 'bg-blue-600 text-white' : 'hover:bg-blue-800 text-blue-200'}`}
            >
              {folder.name}
            </button>
            <button
              className="ml-1 px-1 py-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-700 transition opacity-0 group-hover:opacity-100 text-xs"
              title="Delete folder"
              onClick={e => {
                e.stopPropagation();
                if (onDeleteFolder) onDeleteFolder(idx);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {showAddInput && (
        <form
          className="flex items-center gap-1 mt-2 mb-2"
          onSubmit={e => {
            e.preventDefault();
                console.log("Submitted folder name:", folderName); // <-- Add this line

            if (folderName.trim() && onAddFolder) {
              onAddFolder(folderName.trim());
              setFolderName("");
              setShowAddInput(false);
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            placeholder="New folder name"
            className="flex-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 placeholder-blue-400 text-xs focus:outline-none border border-blue-200 focus:border-blue-400"
            // onBlur={() => setShowAddInput(false)}
          />
          <button
            type="submit"
            className="px-2 py-0.5 rounded bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
          >
            Add
          </button>
        </form>
      )}
      <div className="mt-auto pt-6">
        <input type="file" accept="application/json" onChange={handleFileUpload} className="block w-full text-sm text-blue-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
      </div>
      {/* Results Panel (replaces modal) */}
      {(runLoading || runError || (Array.isArray(runResults) && runResults.length > 0)) && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4 text-blue-900 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-blue-700">Collection Run Results</h3>
            {(runError || (!runLoading && runResults.length > 0)) && (
              <button className="text-gray-400 hover:text-gray-700 text-xl font-bold" onClick={() => { setRunResults([]); setRunError(""); }} title="Clear">×</button>
            )}
          </div>
          {runLoading && <div className="mb-2 text-blue-700 font-semibold">Running collection...</div>}
          {runError && <div className="mb-2 text-red-600 font-semibold">Error: {runError}</div>}
          {!runLoading && !runError && Array.isArray(runResults) && runResults.length > 0 && runResults[runStep] ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Step {runStep + 1} of {runResults.length}</span>
                <span className={`font-bold ${runResults[runStep].status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>{runResults[runStep].status === 'pass' ? 'Success' : 'Failure'}</span>
              </div>
              <div className="mb-2 font-semibold">{runResults[runStep].name}</div>
              <div className="mb-2 text-xs text-gray-700">
                {runResults[runStep].request?.method} {(() => {
                  const url = runResults[runStep].request?.url;
                  if (!url) return '';
                  if (typeof url === 'string') return url;
                  if (typeof url === 'object' && url.raw) return url.raw;
                  if (typeof url === 'object') return JSON.stringify(url);
                  return String(url);
                })()}
              </div>
              {runResults[runStep].response && (
                <div className="mb-2 text-xs bg-gray-100 rounded p-2">
                  <div>Status: {runResults[runStep].response.code} {runResults[runStep].response.status}</div>
                  <div>Body: <pre className="whitespace-pre-wrap break-all">{typeof runResults[runStep].response.stream === 'string' ? runResults[runStep].response.stream : JSON.stringify(runResults[runStep].response.stream, null, 2)}</pre></div>
                </div>
              )}
              {Array.isArray(runResults[runStep].assertions) && (
                <div className="mb-2">
                  <div className="font-semibold">Assertions:</div>
                  <ul className="list-disc ml-6">
                    {runResults[runStep].assertions.map((a, i) => (
                      <li key={i} className={a.error ? 'text-red-600' : 'text-green-700'}>
                        {a.assertion}: {a.error ? a.error.message : 'Passed'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                  onClick={() => setRunStep(s => Math.max(0, s - 1))}
                  disabled={runStep === 0}
                >Previous</button>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  onClick={() => setRunStep(s => Math.min(runResults.length - 1, s + 1))}
                  disabled={runStep === runResults.length - 1}
                >Next</button>
              </div>
            </div>
          ) : null}
          {!runLoading && !runError && (!Array.isArray(runResults) || runResults.length === 0) && (
            <div className="text-gray-700">No results to display.</div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
