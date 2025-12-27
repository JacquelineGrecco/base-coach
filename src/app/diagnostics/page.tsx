'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/AuthContext';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Check Auth Context
    diagnostics.push({
      test: 'Auth Context',
      status: user ? 'success' : 'error',
      message: user ? `✅ User authenticated: ${user.email}` : '❌ No user in Auth Context',
      details: user ? { id: user.id, email: user.email } : null,
    });

    // Test 2: Check Supabase Session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        const expiresIn = session.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 0;
        diagnostics.push({
          test: 'Supabase Session',
          status: 'success',
          message: `✅ Session exists (expires in ${Math.floor(expiresIn / 60)} minutes)`,
          details: {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
          },
        });
      } else {
        diagnostics.push({
          test: 'Supabase Session',
          status: 'error',
          message: '❌ No Supabase session found',
        });
      }
    } catch (error: any) {
      diagnostics.push({
        test: 'Supabase Session',
        status: 'error',
        message: '❌ Error checking session',
        details: error.message,
      });
    }

    // Test 3: Check User Profile
    if (user) {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        diagnostics.push({
          test: 'User Profile',
          status: profile ? 'success' : 'error',
          message: profile ? `✅ Profile exists: ${profile.name}` : '❌ No profile found',
          details: profile,
        });
      } catch (error: any) {
        diagnostics.push({
          test: 'User Profile',
          status: 'error',
          message: '❌ Error fetching profile',
          details: error.message,
        });
      }
    }

    // Test 4: Check Teams
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, user_id, is_active')
        .limit(10);

      if (error) throw error;

      diagnostics.push({
        test: 'Teams Query',
        status: teams && teams.length > 0 ? 'success' : 'warning',
        message: teams && teams.length > 0 
          ? `✅ Found ${teams.length} team(s)` 
          : '⚠️ No teams found',
        details: teams,
      });
    } catch (error: any) {
      diagnostics.push({
        test: 'Teams Query',
        status: 'error',
        message: '❌ Error fetching teams',
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint,
        },
      });
    }

    // Test 5: Check Players
    try {
      const { data: players, error } = await supabase
        .from('players')
        .select('id, name, jersey_number, team_id, is_active')
        .limit(10);

      if (error) throw error;

      diagnostics.push({
        test: 'Players Query',
        status: players && players.length > 0 ? 'success' : 'warning',
        message: players && players.length > 0 
          ? `✅ Found ${players.length} player(s)` 
          : '⚠️ No players found',
        details: players,
      });
    } catch (error: any) {
      diagnostics.push({
        test: 'Players Query',
        status: 'error',
        message: '❌ Error fetching players',
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
      });
    }

    // Test 6: Check Active Players Count
    try {
      const { count: activeCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

      const status = activeCount === 0 && totalCount && totalCount > 0 ? 'warning' : 'success';
      const message = `Active: ${activeCount || 0}, Total: ${totalCount || 0}, Inactive: ${(totalCount || 0) - (activeCount || 0)}`;

      diagnostics.push({
        test: 'Player Counts',
        status,
        message: status === 'warning' 
          ? `⚠️ ${message} - All players are inactive!` 
          : `✅ ${message}`,
        details: { activeCount, totalCount },
      });
    } catch (error: any) {
      diagnostics.push({
        test: 'Player Counts',
        status: 'error',
        message: '❌ Error counting players',
        details: error.message,
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Base Coach Diagnostics
          </h1>
          <p className="text-gray-600">
            Testing authentication, database connections, and data access
          </p>
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Running Tests...' : '🔄 Run Tests Again'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow border-2 p-6 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{getStatusIcon(result.status)}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    Test #{index + 1}: {result.test}
                  </h3>
                  <p className="text-lg mb-3 font-medium">{result.message}</p>
                  
                  {result.details && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-semibold hover:underline">
                        Show Details
                      </summary>
                      <pre className="mt-2 p-3 bg-white bg-opacity-50 rounded text-xs overflow-x-auto border">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-green-600 font-medium">Passed</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                <div className="text-3xl font-bold text-amber-600">
                  {results.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-amber-600 font-medium">Warnings</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-3xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-600 font-medium">Failed</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">💡 Next Steps:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {results.some(r => r.status === 'error' && r.test.includes('Session')) && (
                  <li>• Session error detected - Try logging out and back in</li>
                )}
                {results.some(r => r.status === 'error' && r.test.includes('Players')) && (
                  <li>• Players query failed - This might be an RLS (database security) issue</li>
                )}
                {results.some(r => r.status === 'warning' && r.message.includes('No teams')) && (
                  <li>• No teams found - Create a team first in the Teams section</li>
                )}
                {results.some(r => r.status === 'warning' && r.message.includes('inactive')) && (
                  <li>• All players are inactive - Check player status in database</li>
                )}
                {results.every(r => r.status === 'success') && (
                  <li className="text-green-600 font-bold">✅ All tests passed! System is working correctly.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

