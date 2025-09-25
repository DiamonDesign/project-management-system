import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { debugSupabase, testSupabaseConnection, testSupabaseAuth } from "@/integrations/supabase/debug-client";

interface TestResult {
  success: boolean;
  error?: string;
  data?: any;
  timestamp: string;
}

export default function SupabaseTest() {
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [authResult, setAuthResult] = useState<TestResult | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Environment info
  const envInfo = {
    url: import.meta.env.VITE_SUPABASE_URL,
    keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
    apiProtection: import.meta.env.VITE_API_PROTECTION,
    mode: import.meta.env.MODE,
  };

  // Test connection on component mount
  useEffect(() => {
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      setConnectionResult({
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAuth = async () => {
    if (!email || !password) {
      setAuthResult({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await testSupabaseAuth(email, password);
      setAuthResult({
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setAuthResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestProject = async () => {
    setIsLoading(true);
    try {
      console.group('🏗️ Testing Project Creation');

      const testProject = {
        name: 'Test Project - ' + Date.now(),
        description: 'Test project created by debug page',
        status: 'pending' as const,
      };

      const { data, error } = await debugSupabase
        .from('projects')
        .insert(testProject)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Project created successfully:', data);

      // Clean up - delete the test project
      await debugSupabase.from('projects').delete().eq('id', data.id);
      console.log('🗑️ Test project deleted');

      alert('✅ Project creation test successful! Check console for details.');

    } catch (error) {
      console.error('❌ Project creation failed:', error);
      alert(`❌ Project creation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Supabase Connection Diagnostics</h1>
        <p className="text-muted-foreground mt-2">
          Test and debug Supabase integration issues
        </p>
      </div>

      {/* Environment Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>Current environment variables and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Supabase URL:</strong>
              <Badge variant="outline" className="ml-2">
                {envInfo.url ? '✅ Set' : '❌ Missing'}
              </Badge>
            </div>
            <div>
              <strong>API Key Length:</strong>
              <Badge variant="outline" className="ml-2">
                {envInfo.keyLength || 0} chars
              </Badge>
            </div>
            <div>
              <strong>API Protection:</strong>
              <Badge variant={envInfo.apiProtection === 'false' ? 'default' : 'secondary'} className="ml-2">
                {envInfo.apiProtection === 'false' ? 'Disabled' : 'Enabled'}
              </Badge>
            </div>
            <div>
              <strong>Environment:</strong>
              <Badge variant="outline" className="ml-2">
                {envInfo.mode}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Database Connection Test
            <Button onClick={handleTestConnection} disabled={isLoading} size="sm">
              {isLoading ? 'Testing...' : 'Test Connection'}
            </Button>
          </CardTitle>
          <CardDescription>Test basic database connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          {connectionResult && (
            <div className={`p-4 rounded-lg border ${
              connectionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  connectionResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {connectionResult.success ? '✅ Connected' : '❌ Connection Failed'}
                </span>
                <Badge variant="outline">{connectionResult.timestamp}</Badge>
              </div>
              {connectionResult.error && (
                <p className="mt-2 text-red-700 text-sm">{connectionResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Authentication Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>Test authentication with your credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
          </div>
          <Button onClick={handleTestAuth} disabled={isLoading} className="w-full">
            {isLoading ? 'Testing...' : 'Test Authentication'}
          </Button>

          {authResult && (
            <div className={`p-4 rounded-lg border ${
              authResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  authResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {authResult.success ? '✅ Authentication Successful' : '❌ Authentication Failed'}
                </span>
                <Badge variant="outline">{authResult.timestamp}</Badge>
              </div>
              {authResult.error && (
                <p className="mt-2 text-red-700 text-sm">{authResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Project Creation Test
            <Button onClick={handleTestProject} disabled={isLoading} size="sm">
              {isLoading ? 'Testing...' : 'Test Project Creation'}
            </Button>
          </CardTitle>
          <CardDescription>Test the specific failing operation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This will create and immediately delete a test project to verify the project creation flow works.
            Check the browser console for detailed logs.
          </p>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="text-sm text-muted-foreground space-y-2">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>First, check that environment configuration shows all green badges</li>
          <li>Test database connection - should show "Connected"</li>
          <li>Test authentication with your existing credentials</li>
          <li>Test project creation to reproduce the original issue</li>
          <li>Open browser console (F12) to see detailed debug logs</li>
        </ol>
      </div>
    </div>
  );
}