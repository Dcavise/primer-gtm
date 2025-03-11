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

const SignupForm = () => {
  const { signUp } = useAuth();
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (regPassword !== regConfirmPassword) {
      setRegisterError("Passwords do not match");
      toast.error("Registration failed", {
        description: "Passwords do not match",
      });
      return;
    }

    setIsRegistering(true);

    try {
      const { error } = await signUp(regEmail, regPassword, regFullName);
      if (error) {
        setRegisterError(error.message);
        toast.error("Registration failed", {
          description: error.message,
        });
      } else {
        toast.success("Registration successful", {
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setRegisterError(errorMessage);
      toast.error("Registration failed", {
        description: errorMessage,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {registerError && (
          <Alert variant="destructive">
            <AlertDescription>{registerError}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input
            id="full-name"
            type="text"
            placeholder="John Doe"
            value={regFullName}
            onChange={(e) => setRegFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder="your@email.com"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={regConfirmPassword}
            onChange={(e) => setRegConfirmPassword(e.target.value)}
            required
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={isRegistering}>
          {isRegistering ? "Creating account..." : "Create Account"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default SignupForm;
