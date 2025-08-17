import React, { useState } from "react";
import RunResultModal from "./RunResultModal";
import Sidebar from "./Sidebar";
// Removed duplicate import of DragDropContext, Droppable, Draggable
import RequestsList from "./RequestsList";
import ApiEditorPanel from "./ApiEditorPanel";
import EnvEditorModal from "./EnvEditorModal";
import SwaggerPanel from "./SwaggerPanel";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const getFoldersAndRequests = (items) => {
  const folders = [];
  const topLevelRequests = [];
  (items || []).forEach((item) => {
    if (item.item) {
      folders.push(item);
    } else {
      topLevelRequests.push(item);
    }
  });
  return { folders, topLevelRequests };
};

const App = () => {
  const [collection, setCollection] = useState(null);
  const [folders, setFolders] = useState([]);
  const [topLevelRequests, setTopLevelRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedApiIdx, setSelectedApiIdx] = useState(null);
  const [editedBody, setEditedBody] = useState("");
  const [editedTestScript, setEditedTestScript] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedUrl, setEditedUrl] = useState("");
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvIdx, setSelectedEnvIdx] = useState(null);
  const [showRequestsPanel, setShowRequestsPanel] = useState(true);
  const [showEditorPanel, setShowEditorPanel] = useState(true);
  const [showEnvEditor, setShowEnvEditor] = useState(false);
  const [envEditVars, setEnvEditVars] = useState([]);
  const [envEditName, setEnvEditName] = useState("");
  const [runSingleResult, setRunSingleResult] = useState(null);
  const [isRunningSingle, setIsRunningSingle] = useState(false);
  const [runApiResponse, setRunApiResponse] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [isRunningApi, setIsRunningApi] = useState(false);
  const [runCurl, setRunCurl] = useState("");
  const [errorModal, setErrorModal] = useState({ open: false, message: "" });
  const [editedHeaders, setEditedHeaders] = useState([]);
  const [editedAuth, setEditedAuth] = useState({ type: 'none' });
  const [showSwaggerPanel, setShowSwaggerPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedPanel, setExpandedPanel] = useState(null); // "swagger", "collection", or null
  const [swaggers, setSwaggers] = React.useState([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setCollection(json);
        const { folders, topLevelRequests } = getFoldersAndRequests(json.item || []);
        setFolders(folders);
        setTopLevelRequests(topLevelRequests);
        // Default to first folder or top-level requests
        if (folders.length > 0) {
          setSelectedTab(folders[0].name);
          setRequests(folders[0].item);
        } else {
          setSelectedTab("__top__");
          setRequests(topLevelRequests);
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // Handle environment file upload
  const handleEnvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setEnvironments((prev) => [...prev, json]);
        if (selectedEnvIdx === null) setSelectedEnvIdx(0);
      } catch (err) {
        alert("Invalid environment JSON file");
      }
    };
    reader.readAsText(file);
  };


  // Handle tab (folder) selection
  const handleTabSelect = (tabName) => {
    setSelectedTab(tabName);
    setSelectedApiIdx(null); // Reset API selection when switching tabs
    if (tabName === "__top__") {
      setRequests(topLevelRequests);
    } else {
      const folder = folders.find((f) => f.name === tabName);
      setRequests(folder ? folder.item : []);
    }
  };

  // Handle drag end for requests and folders
  const onDragEnd = (result) => {
    if (!result.destination) return;
    // Folders drag
    if (result.type === "FOLDER") {
      const newFolders = Array.from(folders);
      const [removed] = newFolders.splice(result.source.index, 1);
      newFolders.splice(result.destination.index, 0, removed);
      setFolders(newFolders);
      setCollection({
        ...collection,
        item: [...topLevelRequests, ...newFolders],
      });
      return;
    }
    // Requests drag (existing logic)
    const newRequests = Array.from(requests);
    const [removed] = newRequests.splice(result.source.index, 1);
    newRequests.splice(result.destination.index, 0, removed);
    setRequests(newRequests);
    if (selectedTab === "__top__") {
      setTopLevelRequests(newRequests);
      setCollection({
        ...collection,
        item: [...newRequests, ...folders],
      });
    } else {
      const updatedFolders = folders.map((f) =>
        f.name === selectedTab ? { ...f, item: newRequests } : f
      );
      setFolders(updatedFolders);
      setCollection({
        ...collection,
        item: [...topLevelRequests, ...updatedFolders],
      });
    }
  };

  // Export modified collection
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "postman_collection.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // When requests or selectedApiIdx changes, update editors
  React.useEffect(() => {
    if (selectedApiIdx !== null && requests[selectedApiIdx]) {
      const req = requests[selectedApiIdx];
      setEditedName(req.name || "");
      // Get URL
      let url = "";
      if (req.request?.url) {
        if (typeof req.request.url === "string") {
          url = req.request.url;
        } else if (req.request.url.raw) {
          url = req.request.url.raw;
        }
      }
      setEditedUrl(url || "");
      // Get body (raw mode)
      let body = "";
      if (req.request?.body?.mode === "raw") {
        body = req.request.body.raw;
      }
      setEditedBody(body || "");
      // Get test script
      let testScript = "";
      if (req.event) {
        const testEvent = req.event.find(e => e.listen === "test");
        if (testEvent && testEvent.script && testEvent.script.exec) {
          testScript = Array.isArray(testEvent.script.exec) ? testEvent.script.exec.join("\n") : testEvent.script.exec;
        }
      }
      setEditedTestScript(testScript || "");
      // Get headers
      let headers = Array.isArray(req.request?.header) ? req.request.header.map(h => ({ ...h })) : [];
      if (headers.length === 0) {
        headers = [{ key: 'Content-Type', value: 'application/json', disabled: false }];
      }
      setEditedHeaders(headers);
      // Get auth
      if (req.request?.auth) {
        const { type } = req.request.auth;
        if (type === 'bearer') {
          // Postman v2.1 format: bearer is an array of key/value objects
          const bearerArr = req.request.auth.bearer;
          let tokenValue = '';
          if (Array.isArray(bearerArr)) {
            const tokenObj = bearerArr.find(b => b.key === 'token');
            tokenValue = tokenObj ? tokenObj.value : '';
          }
          setEditedAuth({ type: 'bearer', token: tokenValue || '{{token}}' });
        } else if (type === 'basic') {
          setEditedAuth({
            type: 'basic',
            username: req.request.auth.basic?.find(b => b.key === 'username')?.value || '',
            password: req.request.auth.basic?.find(b => b.key === 'password')?.value || ''
          });
        } else if (type === 'apikey') {
          setEditedAuth({
            type: 'apikey',
            key: req.request.auth.apikey?.find(a => a.key === 'key')?.value || '',
            value: req.request.auth.apikey?.find(a => a.key === 'value')?.value || '',
            addTo: req.request.auth.apikey?.find(a => a.key === 'in')?.value || 'header'
          });
        } else {
          setEditedAuth({ type: 'none' });
        }
      } else {
        setEditedAuth({ type: 'none' });
      }
    } else {
      setEditedName("");
      setEditedUrl("");
      setEditedBody("");
      setEditedTestScript("");
      setEditedHeaders([{ key: 'Content-Type', value: 'application/json', disabled: false }]);
      setEditedAuth({ type: 'none' });
    }
  }, [selectedApiIdx, requests]);

  // Save edits to API
  const handleSaveApi = () => {
    if (selectedApiIdx === null) return;
    const updatedRequests = [...requests];
    const req = { ...updatedRequests[selectedApiIdx] };
    req.name = editedName;
    // Update URL
    if (req.request?.url) {
      if (typeof req.request.url === "string") {
        req.request.url = editedUrl;
      } else {
        req.request.url = { ...req.request.url, raw: editedUrl };
      }
    } else {
      // If url is missing, add it as string
      req.request.url = editedUrl;
    }
    // Update body
    if (req.request?.body?.mode === "raw") {
      req.request.body.raw = editedBody;
    }
    // Update headers
    req.request.header = editedHeaders.filter(h => h.key && h.value && h.disabled !== true);
    // Update auth
    if (editedAuth && editedAuth.type && editedAuth.type !== 'none') {
      req.request.auth = { ...editedAuth };
    } else {
      delete req.request.auth;
    }
    // Update test script
    if (editedTestScript !== undefined) {
      let found = false;
      if (req.event) {
        req.event = req.event.map(e => {
          if (e.listen === "test") {
            found = true;
            return {
              ...e,
              script: {
                ...e.script,
                exec: editedTestScript.split("\n"),
              },
            };
          }
          return e;
        });
      }
      if (!found && editedTestScript.trim()) {
        req.event = req.event || [];
        req.event.push({
          listen: "test",
          script: { type: "text/javascript", exec: editedTestScript.split("\n") },
        });
      }
    }
    updatedRequests[selectedApiIdx] = req;
    setRequests(updatedRequests);
    // Update collection structure
    if (selectedTab === "__top__") {
      setTopLevelRequests(updatedRequests);
      setCollection({ ...collection, item: [...updatedRequests, ...folders] });
    } else {
      const updatedFolders = folders.map((f) =>
        f.name === selectedTab ? { ...f, item: updatedRequests } : f
      );
      setFolders(updatedFolders);
      setCollection({ ...collection, item: [...topLevelRequests, ...updatedFolders] });
    }
    // Force update selected API to reflect changes
    setSelectedApiIdx(selectedApiIdx);
  };

  // Run single API/request
  const handleRunSingleApi = async () => {
    if (selectedApiIdx === null || !requests[selectedApiIdx]) return;
    setIsRunningSingle(true);
    setRunSingleResult(null);
    // Build a mini-collection with just this request
    const req = requests[selectedApiIdx];
    const miniCollection = {
      info: { name: req.name || 'Single Request', schema: collection?.info?.schema },
      item: [req],
    };
    try {
      const res = await fetch('/api/run-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: miniCollection,
          environment: selectedEnvIdx !== null ? environments[selectedEnvIdx] : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to run request');
      const data = await res.json();
      setRunSingleResult(data);
    } catch (err) {
      setRunSingleResult({ error: err.message });
    } finally {
      setIsRunningSingle(false);
    }
  };

  // Substitute environment variables in a string
  function substituteEnvVars(str, env) {
    if (!str || !env) return str;
    let result = str;
    (env.values || []).forEach(v => {
      if (v.enabled !== false && v.key) {
        // Postman uses {{var}} syntax
        const re = new RegExp('\\{\\{' + v.key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\}\}', 'g');
        result = result.replace(re, v.value ?? '');
      }
    });
    return result;
  }

  // Helper to deeply substitute env vars in an object (for url, body, etc.)
  function deepSubstituteEnvVars(obj, env) {
    if (typeof obj === 'string') return substituteEnvVars(obj, env);
    if (Array.isArray(obj)) return obj.map(v => deepSubstituteEnvVars(v, env));
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const k in obj) {
        out[k] = deepSubstituteEnvVars(obj[k], env);
      }
      return out;
    }
    return obj;
  }

  // Helper to build curl command
  function buildCurlCommand({ url, method, headers, body }) {
    let cmd = ["curl"];
    if (method && method.toUpperCase() !== "GET") cmd.push("-X", method.toUpperCase());
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => {
        cmd.push("-H", `'${k}: ${v}'`);
      });
    }
    if (body && body.length > 0) {
      // Escape single quotes in body
      const safeBody = body.replace(/'/g, "'\\''");
      cmd.push("--data", `'${safeBody}'`);
    }
    cmd.push(`'${url}'`);
    return cmd.join(" ");
  }

  // Run API directly from browser
  const handleRunApiDirect = async () => {
    if (selectedApiIdx === null || !requests[selectedApiIdx]) return;
    setIsRunningApi(true);
    setRunApiResponse(null);
    setRunCurl("");
    // Always use the latest edited fields in the request object
    let req = {
      ...requests[selectedApiIdx],
      request: {
        ...requests[selectedApiIdx].request,
        url: editedUrl,
        header: editedHeaders,
      },
    };
    // Add auth to request
    if (editedAuth && editedAuth.type && editedAuth.type !== 'none') {
      req.request.auth = { ...editedAuth };
    } else {
      delete req.request.auth;
    }
    const env = selectedEnvIdx !== null ? environments[selectedEnvIdx] : null;
    // Deep substitute env vars in request object (including headers and auth)
    const substitutedReq = deepSubstituteEnvVars(req, env);
    // URL
    let url = substitutedReq.request?.url;
    if (typeof url === 'object' && url.raw) url = url.raw;
    // Method
    const method = substitutedReq.request?.method || 'GET';
    // Headers
    let headers = {};
    if (Array.isArray(substitutedReq.request?.header)) {
      substitutedReq.request.header.forEach(h => {
        if (h.key && h.value && h.disabled !== true) {
          headers[h.key] = h.value;
        }
      });
    }
    // Add Authorization header if auth is set
    if (substitutedReq.request?.auth && substitutedReq.request.auth.type) {
      const auth = substitutedReq.request.auth;
      if (auth.type === 'bearer' && auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      } else if (auth.type === 'basic' && auth.username && auth.password) {
        headers['Authorization'] = 'Basic ' + btoa(`${auth.username}:${auth.password}`);
      } else if (auth.type === 'apikey' && auth.key && auth.value) {
        if (auth.addTo === 'header') {
          headers[auth.key] = auth.value;
        } else if (auth.addTo === 'query') {
          // Add to URL
          const urlObj = new URL(url);
          urlObj.searchParams.set(auth.key, auth.value);
          url = urlObj.toString();
        }
      }
    }
    // Body
    let body = undefined;
    if (substitutedReq.request?.body?.mode === 'raw' && substitutedReq.request.body.raw) {
      body = substitutedReq.request.body.raw;
      // If content-type is JSON, try to parse and re-stringify
      const ct = headers['Content-Type'] || headers['content-type'];
      if (ct && ct.includes('application/json')) {
        try { body = JSON.stringify(JSON.parse(body)); } catch {}
      }
    }
    // Build and show curl
    setRunCurl(buildCurlCommand({ url, method, headers, body: body || "" }));
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : body,
      });
      const respText = await response.text();
      let respJson = null;
      try { respJson = JSON.parse(respText); } catch {}
      setRunApiResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: respJson || respText,
        request: {
          url,
          method,
          headers,
          body,
          curl: buildCurlCommand({ url, method, headers, body: body || "" })
        }
      });
      setShowRunModal(true);
    } catch (err) {
      setRunApiResponse({ error: err.message });
      setShowRunModal(true);
    } finally {
      setIsRunningApi(false);
    }
  };

  // Open environment editor
  const handleEditEnv = () => {
    if (selectedEnvIdx === null || !environments[selectedEnvIdx]) return;
    const env = environments[selectedEnvIdx];
    setEnvEditName(env.name || "");
    setEnvEditVars(Array.isArray(env.values) ? env.values.map(v => ({ ...v })) : []);
    setShowEnvEditor(true);
  };

  // Save environment edits
  const handleSaveEnvEdit = () => {
    const updatedEnv = {
      ...environments[selectedEnvIdx],
      name: envEditName,
      values: envEditVars,
    };
    const newEnvs = environments.map((env, idx) => idx === selectedEnvIdx ? updatedEnv : env);
    setEnvironments(newEnvs);
    setShowEnvEditor(false);
  };

  // Add new env variable
  const handleAddEnvVar = () => {
    setEnvEditVars([...envEditVars, { key: '', value: '', enabled: true }]);
  };

  // Remove env variable
  const handleRemoveEnvVar = (idx) => {
    setEnvEditVars(envEditVars.filter((_, i) => i !== idx));
  };

  // Add new request
  const handleAddRequest = () => {
    // Create a new blank request object
    const newRequest = {
      name: "New Request",
      request: {
        method: "GET",
        url: "",
        header: [],
        body: { mode: "raw", raw: "" },
      },
      event: [],
    };
    setRequests(prev => {
      const updated = [...prev, newRequest];
      setSelectedApiIdx(updated.length - 1); // Show edit panel for new request
      return updated;
    });
  };

  // Duplicate request
  const handleDuplicateRequest = (idx) => {
    if (requests[idx]) {
      const copy = JSON.parse(JSON.stringify(requests[idx]));
      copy.name = copy.name + ' (Copy)';
      setRequests(prev => {
        const updated = [...prev];
        updated.splice(idx + 1, 0, copy);
        return updated;
      });
    }
  };

  // Copy request (JSON) to clipboard
  const handleCopyRequest = (idx) => {
    if (requests[idx]) {
      navigator.clipboard.writeText(JSON.stringify(requests[idx], null, 2));
    }
  };

  // Remove request
  const handleRemoveRequest = (idx) => {
    setRequests(prev => {
      const updated = [...prev];
      updated.splice(idx, 1);
      // If the removed request was selected, clear selection or select previous
      if (selectedApiIdx === idx) {
        return updated;
      } else if (selectedApiIdx > idx) {
        setSelectedApiIdx(selectedApiIdx - 1);
      }
      return updated;
    });
  };




  // Add new folder
  const handleAddFolder = (folderName) => {
    console.log("Adding folder:", folderName);
    if (!folderName) return;
    if (folders.some(f => f.name === folderName)) return;
    const newFolder = { name: folderName, item: [] };
    setFolders(prevFolders => {
      const updatedFolders = [...prevFolders, newFolder];
      // If collection does not exist, create a default one
      if (!collection) {
        setCollection({
          info: {     
            name: "Untitled Collection",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
          },
          item: [...topLevelRequests, ...updatedFolders]
        });
      } else {
        // Update collection with the new folders
        setCollection(prevCollection => ({
          ...prevCollection,
          item: [...topLevelRequests, ...updatedFolders],
        }));
      }
      return updatedFolders;
    });
  };

  // Handler for running the entire collection
  const handleRunCollection = async () => {
    if (!collection) return;
    setIsRunningApi(true);
    setRunApiResponse(null);
    setRunCurl("");
    try {
      const res = await fetch('/api/run-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          environment: selectedEnvIdx !== null ? environments[selectedEnvIdx] : undefined,
        }),
      });
      // No modal logic for collection run
      // const data = await res.json();
      // setRunApiResponse(data);
      // setShowRunModal(true);
    } catch (err) {
      // No modal logic for collection run
    } finally {
      setIsRunningApi(false);
    }
  };

  // Delete folder
  const handleDeleteFolder = (idx) => {
    const updatedFolders = folders.filter((_, i) => i !== idx);
    setFolders(updatedFolders);
    setCollection({
      ...collection,
      item: [...topLevelRequests, ...updatedFolders],
    });
    // If the deleted folder was selected, select top-level or first folder
    if (selectedTab === folders[idx]?.name) {
      if (updatedFolders.length > 0) {
        setSelectedTab(updatedFolders[0].name);
        setRequests(updatedFolders[0].item);
      } else {
        setSelectedTab("__top__");
        setRequests(topLevelRequests);
      }
    }
  };

  // Handle drop from SwaggerPanel to RequestsList
  const handleSwaggerDrop = (endpoint) => {
    // Convert Swagger endpoint to a Postman-style request object
    const newRequest = {
      name: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        url: endpoint.path,
        header: [],
        body: {},
      },
      event: [],
    };
    setRequests((prev) => [...prev, newRequest]);
    // Optionally, update collection/topLevelRequests/folders as needed
  };


  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Always visible vertical bar for panel toggles */}
      <div className="flex flex-col items-center justify-start bg-gray-200 w-12 py-2 border-r border-blue-200" style={{zIndex: 20}}>
        <button
          className={`mb-2 p-2 rounded hover:bg-blue-200 ${expandedPanel === "swagger" ? 'bg-blue-100' : ''}`}
          title="Toggle Swagger Panel"
          onClick={() => setExpandedPanel(expandedPanel === "swagger" ? null : "swagger")}
        >
          {/* Swagger curly braces icon (blue) */}
          <svg viewBox="0 0 32 32" width="24" height="24" fill="none" className="w-6 h-6">
            <path d="M12 6c-4 0-4 4-4 8s0 8 4 8" stroke="#2563eb" strokeWidth="2" fill="none"/>
            <path d="M20 6c4 0 4 4 4 8s0 8-4 8" stroke="#2563eb" strokeWidth="2" fill="none"/>
          </svg>
        </button>
        <button
          className={`mb-2 p-2 rounded hover:bg-blue-200 ${expandedPanel === "collection" ? 'bg-blue-100' : ''}`}
          title="Toggle Collection Panel"
          onClick={() => setExpandedPanel(expandedPanel === "collection" ? null : "collection")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#2563eb" className="w-6 h-6"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#2563eb" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h4" /></svg>
        </button>
      </div>
      {/* Swagger Panel */}
      <div style={{ transition: 'width 0.2s', width: expandedPanel === "swagger" ? 320 : 0, minWidth: expandedPanel === "swagger" ? 200 : 0, overflow: 'hidden', position: 'relative' }}>
        {expandedPanel === "swagger" && <SwaggerPanel swaggers={swaggers} setSwaggers={setSwaggers} onDragApi={() => {}} />}
      </div>
      {/* Collection Panel with folder drag-and-drop */}
      <div style={{ transition: 'width 0.2s', width: expandedPanel === "collection" ? 288 : 0, minWidth: expandedPanel === "collection" ? 180 : 0, overflow: 'hidden', position: 'relative' }}>
        {expandedPanel === "collection" && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Sidebar
              topLevelRequests={topLevelRequests}
              folders={folders}
              selectedTab={selectedTab}
              handleTabSelect={handleTabSelect}
              handleFileUpload={handleFileUpload}
              onAddFolder={handleAddFolder}
              onDeleteFolder={handleDeleteFolder}
              enableFolderDrag
            />
          </DragDropContext>
        )}
      </div>
      {/* Main Panel */}
      <main
        className="flex-1 flex flex-col p-8 min-w-0"
        onDragOver={e => {
          if (e.dataTransfer.types.includes("swagger-api")) e.preventDefault();
        }}
        onDrop={e => {
          const data = e.dataTransfer.getData("swagger-api");
          if (data) {
            try {
              const endpoint = JSON.parse(data);
              handleSwaggerDrop(endpoint);
            } catch {}
          }
        }}
      >
        <header className="mb-6 flex items-center gap-4">
          {collection && (
            <input
              type="text"
              value={collection.info?.name || ''}
              onChange={e => {
                const newName = e.target.value;
                setCollection(prev => prev ? { ...prev, info: { ...prev.info, name: newName } } : prev);
              }}
              className="text-2xl font-bold text-blue-800 tracking-tight bg-transparent border-b border-blue-200 focus:outline-none focus:border-blue-500 transition px-1"
              style={{ minWidth: 80, maxWidth: 320 }}
            />
          )}
          {/* Environment dropdown */}
          <div className="flex items-center gap-1">
            <label className="text-blue-700 font-semibold text-xs">Env:</label>
            <select
              className="border border-blue-300 px-2 py-1 text-xs text-blue-900 focus:ring-1 focus:ring-blue-300 focus:outline-none transition rounded"
              value={selectedEnvIdx ?? ''}
              onChange={e => setSelectedEnvIdx(Number(e.target.value))}
              disabled={environments.length === 0}
              style={{ minWidth: 80, maxWidth: 140 }}
            >
              <option value="" disabled>Select</option>
              {environments.map((env, idx) => (
                <option key={env.name || idx} value={idx}>{env.name || `Env ${idx+1}`}</option>
              ))}
            </select>
            <input
              type="file"
              accept="application/json"
              onChange={handleEnvUpload}
              className="ml-1 block text-xs text-blue-700 file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-xs file:font-normal file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 file:transition"
              style={{ maxWidth: 120 }}
            />
            {selectedEnvIdx !== null && environments[selectedEnvIdx] && (
              <button onClick={handleEditEnv} className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Edit</button>
            )}
          </div>
          {collection && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleExport(); }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-700 transition"
              >
                Export
              </button>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRunCollection(); }}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded font-semibold shadow hover:bg-green-700 transition"
              >
                Run Collection
              </button>
            </div>
          )}
        </header>
        {collection && (
          <div className="flex flex-1 gap-1 min-w-0">
            {/* API List */}
            <div className="relative transition-all duration-300 min-w-[2rem] overflow-auto" style={{width: '24rem', maxWidth: '40vw', resize: 'horizontal'}}>
              {/* ...collapse button... */}
            {showRequestsPanel && selectedTab !== null && (
                <RequestsList
                  requests={requests}
                  selectedApiIdx={selectedApiIdx}
                  setSelectedApiIdx={setSelectedApiIdx}
                  onDragEnd={onDragEnd}
                  onAddRequest={handleAddRequest}
                  onDuplicateRequest={handleDuplicateRequest}
                  onCopyRequest={handleCopyRequest}
                  onRemoveRequest={handleRemoveRequest}
                />
              )}
            </div>
            {/* API Editor Panel */}
            <div className="relative transition-all duration-300 flex-1 min-w-[2rem] overflow-auto" style={{minWidth: '20rem', resize: 'horizontal'}}>
              {/* ...collapse button... */}
              {showEditorPanel && (
                <ApiEditorPanel
                  requests={requests}
                  selectedApiIdx={selectedApiIdx}
                  editedName={editedName}
                  setEditedName={setEditedName}
                  editedUrl={editedUrl}
                  setEditedUrl={setEditedUrl}
                  editedHeaders={editedHeaders}
                  setEditedHeaders={setEditedHeaders}
                  editedBody={editedBody}
                  setEditedBody={setEditedBody}
                  editedTestScript={editedTestScript}
                  setEditedTestScript={setEditedTestScript}
                  editedAuth={editedAuth}
                  setEditedAuth={setEditedAuth}
                  handleSaveApi={handleSaveApi}
                  handleRunApiDirect={handleRunApiDirect}
                  isRunningApi={isRunningApi}
                  runApiResponse={runApiResponse}
                  runCurl={runCurl}
                  selectedEnvIdx={selectedEnvIdx}
                  environments={environments}
                />
              )}
            </div>
            {/* Run Result Modal */}
            <RunResultModal open={showRunModal} onClose={() => setShowRunModal(false)} runApiResponse={runApiResponse} />
          </div>
        )}
        {/* Environment Editor Modal */}
        <EnvEditorModal
          showEnvEditor={showEnvEditor}
          setShowEnvEditor={setShowEnvEditor}
          envEditName={envEditName}
          setEnvEditName={setEnvEditName}
          envEditVars={envEditVars}
          setEnvEditVars={setEnvEditVars}
          handleAddEnvVar={handleAddEnvVar}
          handleRemoveEnvVar={handleRemoveEnvVar}
          handleSaveEnvEdit={handleSaveEnvEdit}
        />

      </main>
    </div>
  );
};

export default App;
