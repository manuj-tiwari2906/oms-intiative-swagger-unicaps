import React, { useState } from "react";

const ApiEditorPanel = ({
  requests,
  selectedApiIdx,
  editedName,
  setEditedName,
  editedUrl,
  setEditedUrl,
  editedHeaders,
  setEditedHeaders,
  editedBody,
  setEditedBody,
  editedTestScript,
  setEditedTestScript,
  editedAuth,
  setEditedAuth,
  handleSaveApi,
  handleRunApiDirect,
  isRunningApi,
  runApiResponse,
  runCurl,
  environments,
  selectedEnvIdx
}) => {
  const [showGptPrompt, setShowGptPrompt] = useState(false);
  const [gptPrompt, setGptPrompt] = useState("");
  const [gptResult, setGptResult] = useState("");
  const [gptLoading, setGptLoading] = useState(false);
  const [gptError, setGptError] = useState("");


  if (selectedApiIdx === null || !requests[selectedApiIdx]) return null;

  // Helper for Swagger-like method colors
  const methodColors = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    PATCH: '#50e3c2',
    DELETE: '#f93e3e',
    HEAD: '#9012fe',
    OPTIONS: '#0d5aa7',
    DEFAULT: '#999999',
  };
  const method = requests[selectedApiIdx].request?.method || 'GET';
  const methodColor = methodColors[method.toUpperCase()] || methodColors.DEFAULT;
  const selectedEnv = (typeof selectedEnvIdx !== 'undefined' && selectedEnvIdx !== null && environments && environments[selectedEnvIdx]) ? environments[selectedEnvIdx] : null;
  const resolvedUrl = substituteEnvVars(editedUrl, selectedEnv);

  function substituteEnvVars(str, env) {
    if (!str || !env || !Array.isArray(env.values)) return str;
    let result = str;
    env.values.forEach(v => {
      if (v.enabled !== false && v.key) {
        const re = new RegExp('\\{\\{' + v.key.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&') + '\\}\\}', 'g');
        result = result.replace(re, v.value ?? '');
      }
    });
    return result;
  }

  return (
    <section
      className="shadow flex flex-col overflow-y-auto"
      style={{
        maxHeight: '70vh',
        background: '#fafafa',
        borderRadius: '0.25rem',
        border: `1.5px solid ${methodColor}`,
        boxShadow: `0 1px 4px 0 ${methodColor}22`,
        padding: '1rem',
      }}
    >
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: methodColor }}>
        <span style={{
          background: methodColor,
          color: '#fff',
          borderRadius: '2px',
          padding: '0.05em 0.5em',
          marginRight: '0.5em',
          fontWeight: 600,
          fontSize: '0.8rem',
          letterSpacing: '0.5px',
          minWidth: 32,
          textAlign: 'center',
          display: 'inline-block',
        }}>{method.toUpperCase()}</span>
        <span className="truncate text-xs font-normal" style={{maxWidth: '12rem'}}>{requests[selectedApiIdx].name}</span>
      </h3>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-xs" style={{ color: methodColor }}>Request Method:</label>
        <select
          className="border border-gray-300 px-2 py-1 font-mono focus:ring-1 focus:ring-[#85ea2d] focus:outline-none transition mb-2 bg-white text-xs"
          style={{ color: methodColor, borderColor: methodColor, borderRadius: '2px', minWidth: 70, maxWidth: 100 }}
          value={method}
          onChange={e => {
            const newMethod = e.target.value;
            requests[selectedApiIdx].request.method = newMethod;
            setEditedHeaders(headers => [...headers]); // trigger rerender
          }}
        >
          {Object.keys(methodColors).filter(m => m !== 'DEFAULT').map(m => (
            <option key={m} value={m} style={{ color: methodColors[m] }}>{m}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-xs" style={{ color: methodColor }}>Request Name:</label>
        <input
          type="text"
          value={editedName}
          onChange={e => setEditedName(e.target.value)}
          className="w-full border px-2 py-1 font-mono focus:ring-1 focus:outline-none transition mb-2 bg-white text-xs"
          style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', boxShadow: `0 0 0 1px ${methodColor}22` }}
          placeholder="Enter request name..."
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-xs" style={{ color: methodColor }}>Request URL:</label>
        <input
          type="text"
          value={resolvedUrl !== editedUrl ? resolvedUrl : editedUrl}
          onChange={e => setEditedUrl(e.target.value)}
          className="w-full border px-2 py-1 font-mono focus:ring-1 focus:outline-none transition mb-1 bg-white text-xs"
          style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', boxShadow: `0 0 0 1px ${methodColor}22` }}
          placeholder="Enter request URL..."
        />
        {/* Headers Editor */}
        <div className="mt-1">
          <label className="block font-semibold mb-1 text-xs" style={{ color: methodColor }}>Headers:</label>
          <div className="space-y-1">
            {(editedHeaders.length === 0 ? [{ key: '', value: '', disabled: false }] : editedHeaders).map((h, idx) => (
              <div key={idx} className="flex gap-1 items-center">
                <input
                  type="text"
                  value={h.key}
                  onChange={e => setEditedHeaders(headers => headers.length === 0 ? [{ ...h, key: e.target.value }] : headers.map((hh, i) => i === idx ? { ...hh, key: e.target.value } : hh))}
                  placeholder="Key"
                  className="border px-1 py-1 flex-1 bg-white text-xs"
                  style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px' }}
                />
                <input
                  type="text"
                  value={substituteEnvVars(h.value, selectedEnv) !== h.value ? substituteEnvVars(h.value, selectedEnv) : h.value}
                  onChange={e => setEditedHeaders(headers => headers.length === 0 ? [{ ...h, value: e.target.value }] : headers.map((hh, i) => i === idx ? { ...hh, value: e.target.value } : hh))}
                  placeholder="Value"
                  className="border px-1 py-1 flex-1 bg-white text-xs"
                  style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px' }}
                />
                <input
                  type="checkbox"
                  checked={h.disabled !== true}
                  onChange={e => setEditedHeaders(headers => headers.length === 0 ? [{ ...h, disabled: !e.target.checked }] : headers.map((hh, i) => i === idx ? { ...hh, disabled: !e.target.checked } : hh))}
                  className="ml-1"
                  title="Enabled"
                />
                <button onClick={() => setEditedHeaders(headers => headers.filter((_, i) => i !== idx))} className="ml-1 px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs" style={{borderRadius: '2px'}}>Remove</button>
              </div>
            ))}
            <button onClick={() => setEditedHeaders(headers => [...headers, { key: '', value: '', disabled: false }])} className="mt-1 px-2 py-1 text-xs" style={{ background: methodColor + '22', color: methodColor, border: `1px solid ${methodColor}`, borderRadius: '2px' }}>Add Header</button>
          </div>
        </div>
      </div>
      {method.toUpperCase() !== 'GET' && (
        <div className="mb-4">
          <label className="block font-semibold mb-1 text-xs" style={{ color: methodColor }}>Request Body (raw):</label>
          <textarea
            value={editedBody}
            onChange={e => setEditedBody(e.target.value)}
            rows={5}
            className="w-full border px-2 py-1 font-mono focus:ring-1 focus:outline-none transition text-xs"
            style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', boxShadow: `0 0 0 1px ${methodColor}22` }}
            placeholder="Enter raw request body..."
          />
        </div>
      )}
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-xs" style={{ color: methodColor }}>Test Script ("test" event):</label>
        <div className="flex items-center gap-1 mb-1">
          <textarea
            value={editedTestScript}
            onChange={e => setEditedTestScript(e.target.value)}
            rows={5}
            className="w-full border px-2 py-1 font-mono focus:ring-1 focus:outline-none transition text-xs"
            style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', boxShadow: `0 0 0 1px ${methodColor}22` }}
            placeholder="Enter test script..."
          />
          <button
            className="ml-1 px-2 py-1 text-xs bg-blue-200 text-blue-900 font-semibold hover:bg-blue-300 transition"
            style={{borderRadius: '2px'}}
            title="Ask Automator bot"
            onClick={e => {
              e.preventDefault();
              setShowGptPrompt(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block align-middle mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Ask Automator bot
          </button>
        </div>
        {showGptPrompt && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowGptPrompt(false)}>&times;</button>
              <h4 className="text-lg font-bold mb-2 text-blue-700">Ask ChatGPT for Test Script</h4>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={4}
                placeholder="Describe what you want to test..."
                value={gptPrompt}
                onChange={e => setGptPrompt(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                onClick={async () => {
                  setGptLoading(true);
                  setGptError("");
                  setGptResult("");
                  try {
                    // Call OpenAI API (replace with your endpoint/key as needed)
                    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer YOUR_OPENAI_API_KEY` // <-- Replace with your key or proxy
                      },
                      body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [
                          { role: "system", content: "You are a Postman test script generator. Return only the JavaScript code for the test script." },
                          { role: "user", content: gptPrompt }
                        ],
                        max_tokens: 512
                      })
                    });
                    const data = await resp.json();
                    if (data.choices && data.choices[0]?.message?.content) {
                      setGptResult(data.choices[0].message.content);
                    } else {
                      setGptError("No response from ChatGPT");
                    }
                  } catch (e) {
                    setGptError(e.message);
                  } finally {
                    setGptLoading(false);
                  }
                }}
                disabled={gptLoading || !gptPrompt.trim()}
              >
                {gptLoading ? "Asking..." : "Ask"}
              </button>
              {gptError && <div className="text-red-600 mt-2">{gptError}</div>}
              {gptResult && (
                <div className="mt-4">
                  <label className="block font-semibold mb-1 text-blue-700">Result:</label>
                  <textarea
                    className="w-full border rounded p-2 bg-gray-100"
                    rows={6}
                    value={gptResult}
                    readOnly
                  />
                  <button
                    className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                    onClick={() => {
                      setEditedTestScript(gptResult);
                      setShowGptPrompt(false);
                    }}
                  >Use in Test Script</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Authorization section */}
      <div className="mb-6">
        <label className="block font-semibold mb-2" style={{ color: methodColor }}>Authorization:</label>
        <select
          className="border px-2 py-1 text-xs focus:ring-1 focus:outline-none transition mb-1 bg-white"
          style={{ color: methodColor, borderColor: methodColor, borderRadius: '2px', minWidth: 70, maxWidth: 120 }}
          value={editedAuth.type || 'none'}
          onChange={e => {
            const type = e.target.value;
            
            console.log("deafult type:", e.target.value);
            console.log("editedAuth :", e.target.value);
          
            setEditedAuth(prev => {
              console.log("test perv", prev);
              console.log("testing type", prev.value);

              console.log("testing type", type);
              console.log("prev.type", prev.type)
              if (type === prev.type)  return prev;
              if (type === 'bearer') return { type, token: '' };
              if (type === 'basic') return { type, username: '', password: '' };
              if (type === 'apikey') return { type, key: '', value: '', addTo: 'header' };
              return { type: 'none' };
            });
          }}
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
        </select>
        {editedAuth.type === 'bearer' && (
          <input
            type="text"
            className="w-full border px-2 py-1 mt-1 text-xs"
            style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', background: '#fff' }}
            placeholder="Bearer Token (can use {{TOKEN}})"
            value={editedAuth.token || ''}  
            onChange={e => setEditedAuth(auth => ({ ...auth, token: e.target.value }))}
          />
        )}
        {editedAuth.type === 'basic' && (
          <div className="flex gap-1 mt-1">
            <input
              type="text"
              className="border px-2 py-1 flex-1 text-xs"
              style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', background: '#fff' }}
              placeholder="Username (can use {{USER}})"
              value={editedAuth.username || prev.auth.editedAuth.token}
              onChange={e => setEditedAuth(auth => ({ ...auth, username: e.target.value }))}
            />
            <input
              type="password"
              className="border px-2 py-1 flex-1 text-xs"
              style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', background: '#fff' }}
              placeholder="Password (can use {{PASS}})"
              value={editedAuth.password || ''}
              onChange={e => setEditedAuth(auth => ({ ...auth, password: e.target.value }))}
            />
          </div>
        )}
        {editedAuth.type === 'apikey' && (
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex gap-1">
              <input
                type="text"
                className="border px-2 py-1 flex-1 text-xs"
                style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', background: '#fff' }}
                placeholder="Key Name (can use {{API_KEY_NAME}})"
                value={editedAuth.key || ''}
                onChange={e => setEditedAuth(auth => ({ ...auth, key: e.target.value }))}
              />
              <input
                type="text"
                className="border px-2 py-1 flex-1 text-xs"
                style={{ color: '#424242', borderColor: methodColor, borderRadius: '2px', background: '#fff' }}
                placeholder="Key Value (can use {{API_KEY}})"
                value={editedAuth.value || ''}
                onChange={
                  e => setEditedAuth(auth => ({ ...auth, value: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-1 items-center">
              <label className="font-semibold text-xs" style={{ color: methodColor }}>Add to:</label>
              <select
                className="border px-2 py-1 text-xs"
                style={{ color: methodColor, borderColor: methodColor, borderRadius: '2px', background: '#fff', minWidth: 60 }}
                value={editedAuth.addTo || 'header'}
                onChange={e => setEditedAuth(auth => ({ ...auth, addTo: e.target.value }))}
              >
                <option value="header">Header</option>
                <option value="query">Query Param</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={handleSaveApi} className="px-3 py-1 text-xs font-semibold rounded shadow transition" style={{ background: methodColor, color: '#fff' }}>Save</button>
        <button onClick={handleRunApiDirect} disabled={isRunningApi} className="px-3 py-1 text-xs font-semibold rounded shadow transition disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: '#424242', color: '#fff' }}>{isRunningApi ? 'Running...' : 'Run'}</button>
      </div>
      {runApiResponse && (
        <div className="mt-4 rounded p-4 border" style={{ background: methodColor + '11', borderColor: methodColor }}>
          <h4 className="font-bold mb-2" style={{ color: methodColor }}>API Response</h4>
          {runCurl && (
            <div className="mb-2 font-mono text-xs" style={{ color: methodColor }}>
              <span className="font-semibold">cURL:</span>
              <pre className="whitespace-pre-wrap break-all rounded p-2 mt-1" style={{ background: '#fff', border: `1px solid ${methodColor}` }}>{runCurl}</pre>
            </div>
          )}
          {runApiResponse.error ? (
            <div className="text-red-600 font-semibold">Error: {runApiResponse.error}</div>
          ) : (
            <>
              <div className="mb-2 font-mono text-sm" style={{ color: '#424242' }}>Status: {runApiResponse.status} {runApiResponse.statusText}</div>
              <div className="mb-2 font-mono text-xs" style={{ color: '#424242' }}>Headers: <pre className="inline whitespace-pre-wrap">{JSON.stringify(runApiResponse.headers, null, 2)}</pre></div>
              <div className="mb-2 font-mono text-xs" style={{ color: '#424242' }}>Body: <pre className="inline whitespace-pre-wrap">{typeof runApiResponse.body === 'string' ? runApiResponse.body : JSON.stringify(runApiResponse.body, null, 2)}</pre></div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default ApiEditorPanel;
