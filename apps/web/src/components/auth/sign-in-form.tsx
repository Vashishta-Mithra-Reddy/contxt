"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Spinner from "../blocks/Spinner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { BsGoogle } from "react-icons/bs";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: async () => {
						toast.success("Sign in successful");
						router.push("/dashboard");
						
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.string().email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Spinner />;
	}

	const handleGoogleSignIn = async () => {
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
			});
		} catch (err: any) {
			toast.error(err?.message || "Failed to sign in with Google");
		}
	};

	return (
		<div className="w-full max-w-md font-jakarta">
			<div className="">
				<h1 className="text-center font-semibold text-3xl tracking-tight font-jakarta">
					Welcome Back, <span>Human</span>
				</h1>
				<p className="text-center text-muted-foreground/80 font-semibold tracking-tight">
					Good to see you again!
				</p>
			</div>

			<div className="p-6">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<div>
						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										placeholder="Enter your email"
										onBlur={field.handleBlur}
										autoComplete="email"
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<div>
						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										placeholder="Enter your password"
										autoComplete="current-password"
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>
					</div>

					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								className="w-full"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{state.isSubmitting ? "Signing You In..." : "Continue"}
							</Button>
						)}
					</form.Subscribe>
				</form>

				<div className="relative my-6">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-muted-foreground/20" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">or</span>
					</div>
				</div>

				<div
					onClick={handleGoogleSignIn}
					className="w-full flex items-center justify-center gap-2 font-bold cursor-pointer rounded-xl dark:bg-foreground/15 bg-foreground px-6 py-3 text-center text-white transition-all duration-500 dark:hover:bg-foreground/10 hover:bg-foreground/90"
				>
					<BsGoogle className="text-xl" />
					<span>Continue with Google</span>
				</div>
			</div>

			<div className="flex items-center justify-center">
				<div
					onClick={onSwitchToSignUp}
					className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-jakarta underline-offset-1"
				>
					New here? Sign Up
				</div>
			</div>
		</div>
	);
}
