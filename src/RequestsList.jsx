import React, { useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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

const RequestsList = ({
  requests,
  selectedApiIdx,
  setSelectedApiIdx,
  onDragEnd,
  onAddRequest,
  onDuplicateRequest,
  onCopyRequest,
  onRemoveRequest
}) => {
  const [contextMenu, setContextMenu] = useState(null); // {x, y, idx}
  const contextMenuRef = useRef();

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  // Copy request as JSON to clipboard
  const handleCopy = (idx) => {
    if (requests[idx]) {
      navigator.clipboard.writeText(JSON.stringify(requests[idx], null, 2));
    }
    setContextMenu(null);
  };

  // Duplicate request
  const handleDuplicate = (idx) => {
    if (onDuplicateRequest) onDuplicateRequest(idx);
    setContextMenu(null);
  };

  return (
    <section className="bg-white rounded-xl shadow p-4 overflow-y-auto max-h-[70vh] border border-blue-200 h-full relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-600">Requests</h2>
        <button
          onClick={onAddRequest}
          className="px-3 py-1 rounded bg-[#49cc90] text-white font-bold shadow hover:bg-[#37b87c] transition"
          title="Add Request"
        >
          + Add
        </button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="requests">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {requests.map((item, idx) => {
                const method = item.request?.method || 'GET';
                const methodColor = methodColors[method.toUpperCase()] || methodColors.DEFAULT;
                return (
                  <Draggable key={item.name + idx} draggableId={item.name + idx} index={idx}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`px-3 py-2 cursor-pointer border border-blue-200 shadow-sm flex items-center gap-2 transition-all duration-150 text-sm ${selectedApiIdx === idx ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-blue-50'} ${snapshot.isDragging ? 'ring-2 ring-blue-400 scale-105 z-10' : ''}`}
                        onClick={() => setSelectedApiIdx(idx)}
                        style={{
                          borderLeft: `6px solid ${methodColor}`,
                          background: selectedApiIdx === idx ? methodColor + '11' : '#fff',
                          ...provided.draggableProps.style,
                        }}
                        onContextMenu={e => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, idx });
                        }}
                      >
                        <span style={{
                          background: methodColor,
                          color: '#fff',
                          borderRadius: '2px',
                          padding: '0.05em 0.5em',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                          minWidth: 36,
                          textAlign: 'center',
                          display: 'inline-block',
                        }}>{method.toUpperCase()}</span>
                        <span className="flex-1 text-[#424242] font-normal text-xs">{item.name}</span>
                        <button
                          className="ml-2 p-1 hover:bg-red-100 text-red-600 hover:text-red-800 transition text-xs"
                          title="Remove request"
                          onClick={e => {
                            e.stopPropagation();
                            if (onRemoveRequest) onRemoveRequest(idx);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="absolute left-1/2 -translate-x-1/2 top-0 z-50 bg-white border border-blue-300 rounded-b shadow-lg flex items-center justify-center gap-2 px-4 py-2 mt-2"
          style={{ minWidth: 240 }}
        >
          <span className="text-blue-700 font-semibold text-xs mr-2">Request: {requests[contextMenu.idx]?.name || ''}</span>
          <button className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-semibold text-xs hover:bg-blue-200 transition" onClick={() => handleDuplicate(contextMenu.idx)}>Duplicate</button>
          <button className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-semibold text-xs hover:bg-blue-200 transition" onClick={() => handleCopy(contextMenu.idx)}>Copy (JSON)</button>
          <button className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-500 font-semibold text-xs hover:bg-gray-200 transition" onClick={() => setContextMenu(null)} title="Close">×</button>
        </div>
      )}
    </section>
  );
};

export default RequestsList;
