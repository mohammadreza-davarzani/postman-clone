import { useState, useRef, useEffect } from 'react';

export interface Environment {
  id: string;
  name: string;
  variables: Array<{ key: string; value: string }>;
}

interface Folder {
  id: string;
  name: string;
  items: CollectionItem[];
}

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
}

type CollectionItem = Request | Folder;

interface Collection {
  id: string;
  name: string;
  items: CollectionItem[];
}

interface SidebarProps {
  onSelectRequest?: (request: {
    method: string;
    url: string;
    headers: Array<{ key: string; value: string }>;
    body: string;
  }, collectionName?: string, requestName?: string) => void;
  environments?: Environment[];
  setEnvironments?: (v: Environment[] | ((prev: Environment[]) => Environment[])) => void;
  selectedEnvironmentId?: string | null;
  setSelectedEnvironmentId?: (v: string | null) => void;
}

// Postman Collection Types
interface PostmanCollection {
  info: {
    name: string;
    schema?: string;
  };
  item: PostmanItem[];
}

interface PostmanUrl {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key: string; value: string }>;
}

interface PostmanItem {
  name: string;
  request?: {
    method: string;
    header?: Array<{ key: string; value: string }>;
    body?: {
      mode?: string;
      raw?: string;
    };
    url: PostmanUrl;
  };
  item?: PostmanItem[]; // For folders
}

export default function Sidebar({
  onSelectRequest,
  environments = [],
  setEnvironments = () => {},
  selectedEnvironmentId = null,
  setSelectedEnvironmentId = () => {},
}: SidebarProps) {
  const [collections, setCollections] = useState<Collection[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('postman-collections');
      if (!saved) return [];
      const parsed: Array<{ id?: string; name?: string; requests?: CollectionItem[]; items?: CollectionItem[] }> =
        JSON.parse(saved);
      return parsed.map((collection) => {
        if (collection.requests && !collection.items) {
          return { ...collection, items: collection.requests } as Collection;
        }
        return collection as Collection;
      });
    } catch {
      return [];
    }
  });
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'collections' | 'environments' | 'history' | 'flows'>('collections');
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Save collections to localStorage whenever they change
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem('postman-collections', JSON.stringify(collections));
    }
  }, [collections]);

  // Parse Postman collection URL
  const parsePostmanUrl = (url: PostmanUrl): string => {
    if (url.raw) {
      return url.raw;
    }
    
    let fullUrl = '';
    if (url.protocol) {
      fullUrl += url.protocol + '://';
    }
    if (url.host && url.host.length > 0) {
      fullUrl += url.host.join('.');
    }
    if (url.path && url.path.length > 0) {
      fullUrl += '/' + url.path.join('/');
    }
    if (url.query && url.query.length > 0) {
      const queryString = url.query
        .filter(q => q.key && q.value)
        .map(q => `${q.key}=${q.value}`)
        .join('&');
      if (queryString) {
        fullUrl += '?' + queryString;
      }
    }
    
    return fullUrl || '';
  };

  // Map Postman items to CollectionItem[] tree, preserving folder structure
  const mapPostmanItemsToCollectionItems = (
    items: PostmanItem[],
    idBase: { next: number }
  ): CollectionItem[] => {
    const result: CollectionItem[] = [];
    for (const item of items) {
      if (item.request) {
        const url = parsePostmanUrl(item.request.url);
        const headers: Array<{ key: string; value: string }> = [];
        if (item.request.header) {
          item.request.header.forEach((h) => {
            if (h.key && h.value) {
              headers.push({ key: h.key, value: h.value });
            }
          });
        }
        let body = '';
        if (item.request.body) {
          if (item.request.body.mode === 'raw' && item.request.body.raw) {
            body = item.request.body.raw;
          }
        }
        result.push({
          id: String(idBase.next++),
          name: item.name,
          method: item.request.method || 'GET',
          url,
          headers: headers.length > 0 ? headers : undefined,
          body: body || undefined,
        });
      } else {
        // Folder (with or without children)
        const childItems = item.item && item.item.length > 0
          ? mapPostmanItemsToCollectionItems(item.item, idBase)
          : [];
        result.push({
          id: String(idBase.next++),
          name: item.name,
          items: childItems,
        });
      }
    }
    return result;
  };

  // Helper function to check if item is a folder
  const isFolder = (item: CollectionItem): item is Folder => {
    return 'items' in item && !('method' in item);
  };

  // Helper function to check if item is a request
  const isRequest = (item: CollectionItem): item is Request => {
    return 'method' in item;
  };

  // Parse Postman collection JSON (preserves folder structure)
  const parsePostmanCollection = (json: PostmanCollection): Collection => {
    const idBase = { next: Date.now() };
    const items = mapPostmanItemsToCollectionItems(json.item, idBase);
    return {
      id: String(idBase.next++),
      name: json.info.name || 'Imported Collection',
      items,
    };
  };

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json: PostmanCollection = JSON.parse(text);

      // Validate it's a Postman collection
      if (!json.info || !json.item) {
        alert('Invalid Postman collection format');
        return;
      }

      const importedCollection = parsePostmanCollection(json);
      const updatedCollections = [...collections, importedCollection];
      setCollections(updatedCollections);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing collection:', error);
      alert('Error importing collection. Please check the file format.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Handle collection deletion
  const handleDeleteCollection = (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the collection selection
    
    if (confirm('Are you sure you want to delete this collection?')) {
      const updatedCollections = collections.filter(c => c.id !== collectionId);
      setCollections(updatedCollections);
      
      // Close collection if it was selected
      if (selectedCollection === collectionId) {
        setSelectedCollection(null);
      }
    }
  };

  // Handle folder creation
  const handleCreateFolder = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    const newFolder: Folder = {
      id: String(Date.now()),
      name: folderName.trim(),
      items: [],
    };

      const updatedCollections = collections.map(c => 
      c.id === collectionId 
        ? { ...c, items: [...c.items, newFolder] }
        : c
    );

    setCollections(updatedCollections);
  };

  // Handle folder toggle
  const handleToggleFolder = (folderId: string) => {
    const newSelectedFolders = new Set(selectedFolders);
    if (newSelectedFolders.has(folderId)) {
      newSelectedFolders.delete(folderId);
    } else {
      newSelectedFolders.add(folderId);
    }
    setSelectedFolders(newSelectedFolders);
  };

  // Handle folder deletion
  const handleDeleteFolder = (collectionId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this folder? All requests inside will be moved to the collection root.')) {
      const collection = collections.find(c => c.id === collectionId);
      if (!collection) return;

      const folder = collection.items.find(item => isFolder(item) && item.id === folderId) as Folder | undefined;
      if (!folder) return;

      // Move all items from folder to collection root
      const updatedItems = collection.items
        .filter(item => !(isFolder(item) && item.id === folderId))
        .concat(folder.items);

      const updatedCollections = collections.map(c =>
        c.id === collectionId
          ? { ...c, items: updatedItems }
          : c
      );

      setCollections(updatedCollections);
      
      // Remove from selected folders
      const newSelectedFolders = new Set(selectedFolders);
      newSelectedFolders.delete(folderId);
      setSelectedFolders(newSelectedFolders);
    }
  };

  // Handle moving request to folder
  const handleMoveToFolder = (collectionId: string, requestId: string, targetFolderId: string | null) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    // Find the request
    const findRequest = (items: CollectionItem[]): Request | null => {
      for (const item of items) {
        if (isRequest(item) && item.id === requestId) {
          return item;
        }
        if (isFolder(item)) {
          const found = findRequest(item.items);
          if (found) return found;
        }
      }
      return null;
    };

    const request = findRequest(collection.items);
    if (!request) return;

    // Remove request from current location
    const removeRequest = (items: CollectionItem[]): CollectionItem[] => {
      return items
        .filter(item => !(isRequest(item) && item.id === requestId))
        .map(item => {
          if (isFolder(item)) {
            return { ...item, items: removeRequest(item.items) };
          }
          return item;
        });
    };

    let updatedItems = removeRequest(collection.items);

    // Add request to target folder or root
    if (targetFolderId) {
      updatedItems = updatedItems.map(item => {
        if (isFolder(item) && item.id === targetFolderId) {
          return { ...item, items: [...item.items, request] };
        }
        return item;
      });
    } else {
      updatedItems = [...updatedItems, request];
    }

    const updatedCollections = collections.map(c =>
      c.id === collectionId
        ? { ...c, items: updatedItems }
        : c
    );

    setCollections(updatedCollections);
  };

  // Get all folders from collection recursively
  const getAllFolders = (items: CollectionItem[]): Folder[] => {
    const folders: Folder[] = [];
    items.forEach(item => {
      if (isFolder(item)) {
        folders.push(item);
        folders.push(...getAllFolders(item.items));
      }
    });
    return folders;
  };

  // Render collection items recursively
  const renderCollectionItems = (items: CollectionItem[], collectionId: string, level = 0) => {
    const collection = collections.find(c => c.id === collectionId);
    const allFolders = collection ? getAllFolders(collection.items) : [];

    return items.map((item) => {
      if (isFolder(item)) {
        const isOpen = selectedFolders.has(item.id);
        return (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-1 group">
              <button
                onClick={() => handleToggleFolder(item.id)}
                className="flex-1 flex items-center justify-between px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                style={{ paddingLeft: `${12 + level * 12}px` }}
              >
                <span className="flex items-center gap-2">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {item.name}
                </span>
                <svg
                  className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={(e) => handleDeleteFolder(collectionId, item.id, e)}
                className="opacity-0 group-hover:opacity-100 px-1.5 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-all"
                title="Delete Folder"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            {isOpen && (
              <div className="ml-2">
                {renderCollectionItems(item.items, collectionId, level + 1)}
                {item.items.length === 0 && (
                  <div className="text-xs text-gray-400 px-3 py-1" style={{ paddingLeft: `${12 + (level + 1) * 12}px` }}>
                    Empty folder
                  </div>
                )}
              </div>
            )}
          </div>
        );
      } else {
        // Filter out the current folder and its parent folders from move options
        const availableFolders = allFolders.filter(f => f.id !== item.id);
        
        return (
          <div key={item.id} className="group/item flex items-center gap-1">
            <button
                      onClick={() => {
                        if (onSelectRequest) {
                          const collection = collections.find(c => c.id === collectionId);
                          onSelectRequest({
                            method: item.method,
                            url: item.url,
                            headers: item.headers || [],
                            body: item.body || '',
                          }, collection?.name, item.name);
                        }
                      }}
              className="flex-1 flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              style={{ paddingLeft: `${12 + level * 12}px` }}
            >
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  item.method === 'GET'
                    ? 'bg-blue-100 text-blue-700'
                    : item.method === 'POST'
                    ? 'bg-green-100 text-green-700'
                    : item.method === 'PUT'
                    ? 'bg-yellow-100 text-yellow-700'
                    : item.method === 'DELETE'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {item.method}
              </span>
              <span className="truncate flex-1 text-left">{item.name}</span>
            </button>
            {availableFolders.length > 0 && (
              <select
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const targetFolderId = e.target.value === 'root' ? null : e.target.value;
                  if (targetFolderId !== null || e.target.value === 'root') {
                    handleMoveToFolder(collectionId, item.id, targetFolderId);
                    e.target.value = '';
                  }
                }}
                className="opacity-0 group-hover/item:opacity-100 text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 transition-opacity"
                title="Move to folder"
                defaultValue=""
              >
                <option value="" disabled>Move...</option>
                <option value="root">Root</option>
                {availableFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      }
    });
  };

  // Filter collections based on search query
  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar Navigation */}
      <aside className="w-56 bg-white border-r border-gray-200/80 flex flex-col shadow-sm">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">login api</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2">
          <button
            onClick={() => setActiveView('collections')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all mb-1 ${
              activeView === 'collections'
                ? 'bg-orange-50 text-orange-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Collections
          </button>
          <button
            onClick={() => setActiveView('environments')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all mb-1 ${
              activeView === 'environments'
                ? 'bg-orange-50 text-orange-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Environments
          </button>
         
          
        </nav>

        {/* Issues Badge */}
        <div className="p-2 border-t border-gray-200/80">
          <div className="bg-red-500 text-white rounded-xl px-3 py-2 flex items-center justify-between mb-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                <span className="text-xs font-bold">N</span>
              </div>
              <span className="text-sm font-medium">28 Issues</span>
            </div>
            <button className="text-white/80 hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Right Content Area - Collections View */}
      {activeView === 'collections' && (
        <div className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden">
          {/* Header Bar */}
          <div className="border-b border-gray-200/80 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <button className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="flex-1 relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search collections"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white placeholder:text-gray-400"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                  New
                </button>
                <button
                  onClick={handleImportClick}
                  className="p-2.5 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Import collection"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Collections List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            {filteredCollections.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No collections yet</p>
                <p className="text-xs text-gray-500">Use the upload icon above to import a collection</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCollections.map((collection) => (
                  <div key={collection.id} className="group">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCollection(
                          selectedCollection === collection.id ? null : collection.id
                        )}
                        className="flex-1 flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${
                            selectedCollection === collection.id ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="flex-1">{collection.name}</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteCollection(collection.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Collection"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {selectedCollection === collection.id && (
                      <div className="ml-6 mt-1 space-y-1">
                        <div className="mb-2">
                          <button
                            onClick={() => handleCreateFolder(collection.id)}
                            className="text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 font-medium flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Folder
                          </button>
                        </div>
                        {collection.items.length === 0 ? (
                          <div className="text-xs text-gray-400 px-3 py-2">No items yet</div>
                        ) : (
                          renderCollectionItems(collection.items, collection.id)
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Environments View */}
      {activeView === 'environments' && (
        <div className="w-[650px] flex flex-col bg-gray-50/50 overflow-hidden">
          <div className="border-b border-gray-200/80 bg-white px-6 py-7">
            <h2 className="text-sm font-semibold text-gray-800">Environments</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {environments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500 mb-3">No environments yet</p>
                <button
                  onClick={() => {
                    const name = prompt('Environment name:')?.trim() || 'New Environment';
                    const id = String(Date.now());
                    setEnvironments((prev) => [...prev, { id, name, variables: [] }]);
                    setSelectedEnvironmentId(id);
                  }}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
                >
                  Create environment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <select
                    value={selectedEnvironmentId ?? ''}
                    onChange={(e) => setSelectedEnvironmentId(e.target.value ? e.target.value : null)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm"
                  >
                    <option value="">No environment</option>
                    {environments.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const name = prompt('Environment name:')?.trim() || 'New Environment';
                      const id = String(Date.now());
                      setEnvironments((prev) => [...prev, { id, name, variables: [] }]);
                      setSelectedEnvironmentId(id);
                    }}
                    className="px-3 py-2 text-sm text-orange-500 hover:bg-orange-50 rounded-lg font-medium"
                  >
                    + New
                  </button>
                </div>
                {selectedEnvironmentId && (() => {
                  const env = environments.find((e) => e.id === selectedEnvironmentId);
                  if (!env) return null;
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">{env.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const name = prompt('Rename environment:', env.name)?.trim();
                              if (name) setEnvironments((prev) => prev.map((e) => (e.id === env.id ? { ...e, name } : e)));
                            }}
                            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded"
                            title="Rename"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this environment?')) {
                                setEnvironments((prev) => prev.filter((e) => e.id !== env.id));
                                if (selectedEnvironmentId === env.id) setSelectedEnvironmentId(null);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 mb-2">
                          <div>Variable</div>
                          <div>Value</div>
                          <div className="w-8" />
                        </div>
                        {env.variables.map((v, i) => (
                          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center mb-2">
                            <input
                              value={v.key}
                              onChange={(e) => {
                                const next = [...env.variables];
                                next[i] = { ...next[i], key: e.target.value };
                                setEnvironments((prev) => prev.map((e) => (e.id === env.id ? { ...e, variables: next } : e)));
                              }}
                              placeholder="e.g. baseUrl"
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            />
                            <input
                              value={v.value}
                              onChange={(e) => {
                                const next = [...env.variables];
                                next[i] = { ...next[i], value: e.target.value };
                                setEnvironments((prev) => prev.map((e) => (e.id === env.id ? { ...e, variables: next } : e)));
                              }}
                              placeholder="e.g. https://localhost:7272/api/v1.0"
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-mono"
                            />
                            <button
                              onClick={() =>
                                setEnvironments((prev) =>
                                  prev.map((e) =>
                                    e.id === env.id ? { ...e, variables: env.variables.filter((_, j) => j !== i) } : e
                                  )
                                )
                              }
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setEnvironments((prev) =>
                              prev.map((e) => (e.id === env.id ? { ...e, variables: [...e.variables, { key: '', value: '' }] } : e))
                            )
                          }
                          className="text-sm text-orange-500 hover:text-orange-600 font-medium mt-2"
                        >
                          Add variable
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Views Placeholder */}
      {activeView !== 'collections' && activeView !== 'environments' && (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-gray-500 text-sm">{activeView.charAt(0).toUpperCase() + activeView.slice(1)} view coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
