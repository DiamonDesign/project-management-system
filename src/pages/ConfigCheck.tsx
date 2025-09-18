import React from 'react';

const ConfigCheck = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const appUrl = import.meta.env.VITE_APP_URL;

  const checkConfig = () => {
    const checks = [
      {
        name: 'VITE_SUPABASE_URL',
        value: supabaseUrl,
        valid: supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co'),
        display: supabaseUrl || 'undefined'
      },
      {
        name: 'VITE_SUPABASE_ANON_KEY',
        value: supabaseAnonKey,
        valid: supabaseAnonKey && supabaseAnonKey.length > 100,
        display: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
      },
      {
        name: 'VITE_APP_URL',
        value: appUrl,
        valid: appUrl && appUrl.startsWith('https://'),
        display: appUrl || 'undefined'
      }
    ];

    return checks;
  };

  const checks = checkConfig();
  const allValid = checks.every(check => check.valid);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Configuration Check</h1>

        <div className={`p-6 rounded-lg mb-6 ${allValid ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border-2`}>
          <h2 className="text-xl font-semibold mb-4">
            {allValid ? '✅ All Configuration Valid' : '❌ Configuration Issues Found'}
          </h2>

          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.name} className="flex items-center space-x-4">
                <span className={`text-2xl ${check.valid ? 'text-green-500' : 'text-red-500'}`}>
                  {check.valid ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <div className="font-mono font-bold">{check.name}</div>
                  <div className="font-mono text-sm text-gray-600">{check.display}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!allValid && (
          <div className="bg-yellow-100 border-yellow-500 border-2 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">🔧 How to Fix:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to your Vercel Dashboard</li>
              <li>Select your project</li>
              <li>Go to Settings → Environment Variables</li>
              <li>Add the missing/invalid variables for "Production" environment</li>
              <li>Redeploy your application</li>
            </ol>
          </div>
        )}

        <div className="bg-blue-100 border-blue-500 border-2 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">📊 Environment Info:</h3>
          <div className="font-mono text-sm space-y-1">
            <div>Mode: {import.meta.env.MODE}</div>
            <div>Dev: {import.meta.env.DEV ? 'true' : 'false'}</div>
            <div>Prod: {import.meta.env.PROD ? 'true' : 'false'}</div>
            <div>Base URL: {import.meta.env.BASE_URL}</div>
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ConfigCheck;