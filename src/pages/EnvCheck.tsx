import React from 'react';

const EnvCheck = () => {
  const envData = {
    url_ok: !!import.meta.env.VITE_SUPABASE_URL,
    key_len: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
    url_actual: import.meta.env.VITE_SUPABASE_URL,
    key_preview: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    node_env: import.meta.env.NODE_ENV,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Environment Check</h1>
      <pre className="bg-white p-4 rounded border overflow-auto">
        {JSON.stringify(envData, null, 2)}
      </pre>
    </div>
  );
};

export default EnvCheck;