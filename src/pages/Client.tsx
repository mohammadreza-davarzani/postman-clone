import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ApiClient from '../components/ApiClient';
import type { Environment } from '../components/Sidebar';

export default function ClientPage() {
  const [selectedRequest, setSelectedRequest] = useState<{
    method: string;
    url: string;
    headers: Array<{ key: string; value: string }>;
    body: string;
  } | undefined>();
  const [selectedRequestName, setSelectedRequestName] = useState<string | undefined>();
  const [selectedCollectionName, setSelectedCollectionName] = useState<string | undefined>();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);

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
        onSelectRequest={(request, collectionName, requestName) => {
          setSelectedRequest(request);
          setSelectedCollectionName(collectionName);
          setSelectedRequestName(requestName);
        }}
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
          environmentVariables={environmentVariables}
          environments={environments}
          selectedEnvironmentId={selectedEnvironmentId}
          onSelectEnvironment={setSelectedEnvironmentId}
        />
      </div>
    </div>
  );
}
