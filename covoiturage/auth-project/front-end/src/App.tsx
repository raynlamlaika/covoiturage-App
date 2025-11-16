"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function Home() {
  // --- Register State ---
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // --- Login State ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  /**
   * Handle Register (Sign-in)
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMessage('');
    setRegisterSuccess(false);

    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegisterMessage(data.message);
        setRegisterSuccess(true);
      } else {
        setRegisterMessage(data.message);
        setRegisterSuccess(false);
      }
    } catch (error) {
      setRegisterMessage('Could not connect to server.');
      setRegisterSuccess(false);
    }
  };

  /**
   * Handle Login (Log-in)
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage('');
    setLoginSuccess(false);

    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setLoginMessage(data.message);
        setLoginSuccess(true);
        // In a real app, you would save the JWT token here
        // e.g., localStorage.setItem('token', data.token);
      } else {
        setLoginMessage(data.message);
        setLoginSuccess(false);
      }
    } catch (error) {
      setLoginMessage('Could not connect to server.');
      setLoginSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-600">Sign in to your account or create a new one</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Secure access to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="log-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="log-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="log-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="log-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {loginMessage && (
                    <Alert variant={loginSuccess ? 'default' : 'destructive'} className="mt-4">
                      {loginSuccess ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{loginMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {registerMessage && (
                    <Alert variant={registerSuccess ? 'default' : 'destructive'} className="mt-4">
                      {registerSuccess ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{registerMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-gray-600">
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
}
