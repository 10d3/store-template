"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
// import { login } from "@/lib/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";

type Inputs = {
  email: string;
  password: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit = async (data: Inputs) => {
    // const email = data.email;
    setIsLoading(true);
    try {
      //   await signIn("resend", {
      //     email,
      //     redirect: true,
      //     callbackUrl: `/`,
      //   });
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
      router.push(
        `/login/verify-request?email=${encodeURIComponent(data.email)}`
      );
    }
  };

  // const [_state, action] = useActionState(login, {});

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>{" "}
        <CardContent>
          {/* <form action={action}>
						<div className="grid gap-6">
							<div className="grid gap-6">
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>
									<Input name="email" type="email" placeholder="m@example.com" required />
								</div>
								<div className="grid gap-2">
									<Label htmlFor="password">Password</Label>
									<Input name="password" type="password" required />
								</div>
								<Button type="submit" className="w-full">
									Login
								</Button>
							</div>
						</div>
					</form> */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{`Email`}</Label>
              <Input
                id="email"
                type="email"
                placeholder={"jhondoe@gmail.com"}
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {/* {isLoading ? "test" : null} */}
              {isLoading ? "Chargement" : "Se connecter"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground py-4">or</p>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full hover:cursor-pointer"
              onClick={() =>
                signIn.social({ provider: "google", callbackURL: "/" })
              }
            >
              <FcGoogle className="mr-1" size={16} />
              Login with Google
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        By clicking continue, you agree to our{" "}
        <Link href="#">Terms of Service</Link> and{" "}
        <Link href="#">Privacy Policy</Link>.
      </div>
    </div>
  );
}
