import React from "react";

const EnvEditorModal = ({
  showEnvEditor,
  setShowEnvEditor,
  envEditName,
  setEnvEditName,
  envEditVars,
  setEnvEditVars,
  handleAddEnvVar,
  handleRemoveEnvVar,
  handleSaveEnvEdit
}) => {
  if (!showEnvEditor) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
        <button
          className="absolute top-2 right-2 text-blue-700 hover:text-blue-900 text-2xl font-bold"
          onClick={() => setShowEnvEditor(false)}
          title="Close"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold text-blue-700 mb-4">Edit Environment</h2>
        <div className="mb-4">
          <label className="block font-semibold mb-2 text-blue-700">Environment Name:</label>
          <input
            type="text"
            value={envEditName}
            onChange={e => setEnvEditName(e.target.value)}
            className="w-full rounded-lg border border-blue-300 p-2 text-blue-900 focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2 text-blue-700">Variables:</label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {envEditVars.map((v, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={v.key}
                  onChange={e => setEnvEditVars(vars => vars.map((vv, i) => i === idx ? { ...vv, key: e.target.value } : vv))}
                  placeholder="Key"
                  className="rounded border border-blue-300 p-2 flex-1"
                />
                <input
                  type="text"
                  value={v.value}
                  onChange={e => setEnvEditVars(vars => vars.map((vv, i) => i === idx ? { ...vv, value: e.target.value } : vv))}
                  placeholder="Value"
                  className="rounded border border-blue-300 p-2 flex-1"
                />
                <input
                  type="checkbox"
                  checked={v.enabled !== false}
                  onChange={e => setEnvEditVars(vars => vars.map((vv, i) => i === idx ? { ...vv, enabled: e.target.checked } : vv))}
                  className="ml-2"
                  title="Enabled"
                />
                <button onClick={() => handleRemoveEnvVar(idx)} className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Remove</button>
              </div>
            ))}
            <button onClick={handleAddEnvVar} className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Add Variable</button>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={() => setShowEnvEditor(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Cancel</button>
          <button onClick={handleSaveEnvEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default EnvEditorModal;
