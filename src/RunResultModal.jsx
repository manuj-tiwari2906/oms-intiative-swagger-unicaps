import React, { useState } from "react";

export default function RunResultModal({ open, onClose, runApiResponse }) {
  if (!open || !runApiResponse) return null;

  // Helper to pretty-print JSON or fallback to string
  function pretty(val) {
    if (val == null) return '';
    if (typeof val === 'string') {
      try { return JSON.stringify(JSON.parse(val), null, 2); } catch { return val; }
    }
    return JSON.stringify(val, null, 2);
  }

  // Copy helpers
  const [copied, setCopied] = useState({});
  const handleCopy = (key, data) => {
    navigator.clipboard.writeText(data);
    setCopied(c => ({ ...c, [key]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-0 max-w-3xl w-full relative border border-blue-200">
        <button className="sticky top-2 right-2 float-right z-10 text-gray-400 hover:text-gray-700 text-2xl bg-white rounded-full" style={{position: 'sticky', top: 8, right: 8}} onClick={onClose}>&times;</button>
        <div className="flex flex-col border-b border-blue-100">
          <div className="px-6 py-4 border-b border-blue-100 max-h-72 overflow-auto relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-blue-700">Request</h3>
            </div>
            <div className="mb-2 text-xs flex items-center gap-2">
              <span className="font-semibold">Method:</span>
              <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono relative">
                {runApiResponse.request?.method}
                <button className="absolute top-0 right-0 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100 ml-1" style={{right: -40, top: 0}} onClick={() => handleCopy('req-method', runApiResponse.request?.method || '')}>{copied['req-method'] ? 'Copied!' : 'Copy'}</button>
              </span>
            </div>
            <div className="mb-2 text-xs flex items-center gap-2">
              <span className="font-semibold">URL:</span>
              <span className="break-all font-mono relative">
                {runApiResponse.request?.url}
                <button className="absolute top-0 right-0 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100 ml-1" style={{right: -40, top: 0}} onClick={() => handleCopy('req-url', runApiResponse.request?.url || '')}>{copied['req-url'] ? 'Copied!' : 'Copy'}</button>
              </span>
            </div>
            <div className="mb-2 text-xs flex items-start gap-2">
              <span className="font-semibold mt-1">Headers:</span>
              <span className="relative flex-1">
                <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs overflow-x-auto">{pretty(runApiResponse.request?.headers)}
                  <button className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100" style={{position:'absolute',top:4,right:4}} onClick={() => handleCopy('req-headers', pretty(runApiResponse.request?.headers))}>{copied['req-headers'] ? 'Copied!' : 'Copy'}</button>
                </pre>
              </span>
            </div>
            {runApiResponse.request?.body && (
              <div className="mb-2 text-xs flex items-start gap-2">
                <span className="font-semibold mt-1">Body:</span>
                <span className="relative flex-1">
                  <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs overflow-x-auto">{pretty(runApiResponse.request.body)}
                    <button className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100" style={{position:'absolute',top:4,right:4}} onClick={() => handleCopy('req-body', pretty(runApiResponse.request.body))}>{copied['req-body'] ? 'Copied!' : 'Copy'}</button>
                  </pre>
                </span>
              </div>
            )}
            <div className="mb-2 text-xs flex items-start gap-2">
              <span className="font-semibold mt-1">cURL:</span>
              <span className="relative flex-1">
                <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs overflow-x-auto">{runApiResponse.request?.curl}
                  <button className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100" style={{position:'absolute',top:4,right:4}} onClick={() => handleCopy('req-curl', runApiResponse.request?.curl || '')}>{copied['req-curl'] ? 'Copied!' : 'Copy'}</button>
                </pre>
              </span>
            </div>
          </div>
          <div className="px-6 py-4 max-h-72 overflow-auto relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-blue-700">Response</h3>
            </div>
            {runApiResponse.error ? (
              <div className="text-red-600 font-semibold flex items-center gap-2">Error:
                <span className="relative flex-1">
                  {runApiResponse.error}
                  <button className="absolute top-0 right-0 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100 ml-1" style={{right: -40, top: 0}} onClick={() => handleCopy('res-error', runApiResponse.error || '')}>{copied['res-error'] ? 'Copied!' : 'Copy'}</button>
                </span>
              </div>
            ) : (
              <>
                <div className="mb-2 text-xs flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono relative">
                    {runApiResponse.status} {runApiResponse.statusText}
                    <button className="absolute top-0 right-0 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100 ml-1" style={{right: -40, top: 0}} onClick={() => handleCopy('res-status', `${runApiResponse.status} ${runApiResponse.statusText}`)}>{copied['res-status'] ? 'Copied!' : 'Copy'}</button>
                  </span>
                </div>
                <div className="mb-2 text-xs flex items-start gap-2">
                  <span className="font-semibold mt-1">Headers:</span>
                  <span className="relative flex-1">
                    <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs overflow-x-auto">{pretty(runApiResponse.headers)}
                      <button className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100" style={{position:'absolute',top:4,right:4}} onClick={() => handleCopy('res-headers', pretty(runApiResponse.headers))}>{copied['res-headers'] ? 'Copied!' : 'Copy'}</button>
                    </pre>
                  </span>
                </div>
                <div className="mb-2 text-xs flex items-start gap-2">
                  <span className="font-semibold mt-1">Body:</span>
                  <span className="relative flex-1">
                    <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs overflow-x-auto">{pretty(runApiResponse.body)}
                      <button className="absolute top-1 right-1 text-xs px-1 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 border border-blue-100" style={{position:'absolute',top:4,right:4}} onClick={() => handleCopy('res-body', pretty(runApiResponse.body))}>{copied['res-body'] ? 'Copied!' : 'Copy'}</button>
                    </pre>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
