import React, { useState, useEffect } from "react";
import yaml from "js-yaml";

const SwaggerPanel = ({ swaggers = [], setSwaggers, onDragApi }) => {
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Always treat swaggers as an array
  const safeSwaggers = Array.isArray(swaggers) ? swaggers : [];

  // Reset selectedIdx if swaggers is empty or index is out of bounds
  useEffect(() => {
    if (safeSwaggers.length === 0) {
      setSelectedIdx(0);
    } else if (selectedIdx >= safeSwaggers.length) {
      setSelectedIdx(safeSwaggers.length - 1);
    }
  }, [safeSwaggers, selectedIdx]);

  // Handle file upload (YAML or JSON)
  const handleFile = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let spec;
        if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
          spec = yaml.load(event.target.result);
        } else {
          spec = JSON.parse(event.target.result);
        }
        setSwaggers((prev) => {
          const newArr = [...prev, spec];
          setSelectedIdx(newArr.length - 1); // <-- Use newArr.length - 1
          return newArr;
        });
      } catch (err) {
        setError("Failed to parse Swagger/OpenAPI file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Extract endpoints from Swagger/OpenAPI spec
  const getEndpoints = (swagger) => {
    if (!swagger || !swagger.paths) return [];
    const endpoints = [];
    Object.entries(swagger.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, op]) => {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary || op.operationId || "",
          op,
        });
      });
    });
    return endpoints;
  };

  // Filter endpoints by search
  const filteredEndpoints =
    safeSwaggers.length > 0 && safeSwaggers[selectedIdx]
      ? getEndpoints(safeSwaggers[selectedIdx]).filter(
          (ep) =>
            ep.method.toLowerCase().includes(search.toLowerCase()) ||
            ep.path.toLowerCase().includes(search.toLowerCase()) ||
            (ep.summary && ep.summary.toLowerCase().includes(search.toLowerCase()))
        )
      : [];

  // Drag start handler
  const handleDragStart = (endpoint, e) => {
    e.dataTransfer.setData("swagger-api", JSON.stringify(endpoint));
    if (onDragApi) onDragApi(endpoint);
  };

  return (
    <aside
      className="bg-gray-100 text-blue-900 flex flex-col py-3 px-2 shadow-lg h-screen overflow-y-auto resize-x"
      style={{
        maxHeight: "100vh",
        minWidth: "140px",
        width: "100%",
        maxWidth: "32vw",
        resize: "horizontal",
      }}
    >
      <h2 className="text-blue-700 text-base font-semibold mb-2 tracking-wide">
        Swagger/OpenAPI
      </h2>
      <input
        type="file"
        accept=".yaml,.yml,.json,application/json,application/x-yaml"
        onChange={handleFile}
        className="block w-full text-xs text-blue-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-normal file:bg-blue-200 file:text-blue-900 hover:file:bg-blue-300 mb-2"
      />
      {/* Dropdown to select which spec to view */}
      {safeSwaggers.length > 1 && (
        <select
          className="mb-2 px-2 py-1 bg-blue-100 text-blue-900 text-xs"
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
        >
          {safeSwaggers.map((spec, idx) => (
            <option key={idx} value={idx}>
              {(spec?.info?.title || "Spec") + (spec?.info?.version ? ` v${spec.info.version}` : "")}
            </option>
          ))}
        </select>
      )}
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search APIs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 px-2 py-1 bg-blue-100 text-blue-900 placeholder-blue-400 focus:outline-none text-xs"
      />
      {error && <div className="text-red-600 mb-1 text-xs">{error}</div>}
      {safeSwaggers.length > 0 && safeSwaggers[selectedIdx] && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-1 text-xs text-gray-600 font-mono">
            {safeSwaggers[selectedIdx]?.info?.title || "Spec"}{" "}
            {safeSwaggers[selectedIdx]?.info?.version && `v${safeSwaggers[selectedIdx].info.version}`}
          </div>
          <ul className="space-y-1">
            {filteredEndpoints.map((ep, idx) => (
              <li
                key={ep.method + ep.path + idx}
                className="px-2 py-1 bg-white border border-blue-200 shadow-sm flex items-center gap-2 cursor-grab hover:bg-blue-50 text-xs"
                draggable
                onDragStart={(e) => handleDragStart(ep, e)}
                title={ep.summary}
              >
                <span
                  className="font-bold"
                  style={{
                    color:
                      ep.method === "GET"
                        ? "#61affe"
                        : ep.method === "POST"
                        ? "#49cc90"
                        : ep.method === "PUT"
                        ? "#fca130"
                        : ep.method === "DELETE"
                        ? "#f93e3e"
                        : "#999",
                  }}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-xs flex-1">{ep.path}</span>
                {ep.summary && (
                  <span className="text-xs text-gray-500 ml-2">{ep.summary}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default SwaggerPanel;
