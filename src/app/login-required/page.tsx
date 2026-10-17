import { SignInButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginRequiredPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Please Login first to access Data!</CardTitle>
          <CardDescription>
            Sign in to view your workouts on the dashboard.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </CardFooter>
      </Card>
    </main>
  );
}
