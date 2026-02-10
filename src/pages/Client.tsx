import { useCallback, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ApiClient from '../components/ApiClient';
import type { Environment, SaveRequestData } from '../components/Sidebar';

export default function ClientPage() {
  const [selectedRequest, setSelectedRequest] = useState<{
    method: string;
    url: string;
    headers: Array<{ key: string; value: string }>;
    body: string;
  } | undefined>();
  const [selectedRequestName, setSelectedRequestName] = useState<string | undefined>();
  const [selectedCollectionName, setSelectedCollectionName] = useState<string | undefined>();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | undefined>();
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [saveRequestHandler, setSaveRequestHandler] = useState<
    ((collectionId: string, requestId: string, data: SaveRequestData) => Promise<void>) | null
  >(null);

  const registerSaveHandler = useCallback(
    (handler: (collectionId: string, requestId: string, data: SaveRequestData) => Promise<void>) => {
      setSaveRequestHandler(() => handler);
    },
    []
  );

  const environmentVariables: Record<string, string> = (() => {
    const env = environments.find((e) => e.id === selectedEnvironmentId);
    if (!env) return {};
    const out: Record<string, string> = {};
    env.variables.forEach((v) => {
      if (v.key.trim()) out[v.key.trim()] = v.value ?? '';
    });
    return out;
  })();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onSelectRequest={(request, collectionName, requestName, collectionId, requestId) => {
          setSelectedRequest(request);
          setSelectedCollectionName(collectionName);
          setSelectedRequestName(requestName);
          setSelectedCollectionId(collectionId);
          setSelectedRequestId(requestId);
        }}
        registerSaveHandler={registerSaveHandler}
        environments={environments}
        setEnvironments={setEnvironments}
        selectedEnvironmentId={selectedEnvironmentId}
        setSelectedEnvironmentId={setSelectedEnvironmentId}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ApiClient
          selectedRequest={selectedRequest}
          selectedRequestName={selectedRequestName}
          selectedCollectionName={selectedCollectionName}
          selectedCollectionId={selectedCollectionId}
          selectedRequestId={selectedRequestId}
          onSaveRequest={saveRequestHandler ?? undefined}
          environmentVariables={environmentVariables}
          environments={environments}
          selectedEnvironmentId={selectedEnvironmentId}
          onSelectEnvironment={setSelectedEnvironmentId}
        />
      </div>
    </div>
  );
}
