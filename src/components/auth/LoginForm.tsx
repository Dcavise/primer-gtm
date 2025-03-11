import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/utils/logger";

const LoginForm = () => {
  const { signIn, databaseConnected, schemaStatus, refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      logger.auth("Attempting login from login form");
      const { error } = await signIn(email, password);
      if (error) {
        logger.auth("Login error from form:", error);
        setLoginError(error.message);
        toast.error("Login failed", {
          description: error.message,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      logger.auth("Unexpected login error from form:", error);
      setLoginError(errorMessage);
      toast.error("Login failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      logger.auth("Manually refreshing session from login form");
      await refreshSession();
      toast.success("Session refresh attempted", {
        description: "Please try logging in again",
      });
    } catch (error) {
      logger.auth("Error during manual session refresh from form:", error);
      toast.error("Session refresh failed", {
        description: "Please try again or clear your browser cache",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loginError && (
          <Alert variant="destructive">
            <AlertDescription>
              {loginError}
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshSession}
                  disabled={isRefreshing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  {isRefreshing ? "Refreshing..." : "Refresh Session"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!databaseConnected && (
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <p className="font-medium">Database access issue detected</p>
              <div className="mt-1 text-sm">
                <p>
                  Public schema:{" "}
                  {schemaStatus.public ? "Connected" : "Not connected"}
                </p>
                <p>
                  Salesforce schema:{" "}
                  {schemaStatus.salesforce ? "Connected" : "Not connected"}
                </p>
                <p className="mt-1">
                  Some data may be unavailable after login.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? "Signing in..." : "Sign In"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={handleRefreshSession}
          disabled={isRefreshing}
        >
          <RefreshCw className="h-4 w-4" />
          {isRefreshing ? "Refreshing Session..." : "Refresh Session"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default LoginForm;
