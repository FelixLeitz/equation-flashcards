import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { loginSchema } from '@flashcards/shared';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/FormField.jsx';
import { AuthLayout } from './AuthLayout.jsx';
import { useLogin } from './api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  // Where to send the user after login (set by RequireAuth), default /decks.
  const from = location.state?.from?.pathname || '/decks';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values) => {
    try {
      await login.mutateAsync(values);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      // 401 (bad credentials) is shown in the alert; surface other errors.
      if (err.status !== 401 && err.code !== 'VALIDATION_ERROR') {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const formError =
    login.error?.status === 401
      ? 'Invalid email or password.'
      : login.error?.code === 'VALIDATION_ERROR'
        ? 'Please check the fields below.'
        : null;

  return (
    <AuthLayout
      title="Log in"
      description="Welcome back to Equation Flashcards."
      footer={
        <span>
          Don’t have an account?{' '}
          <Link to="/signup" className="font-medium text-primary underline">
            Sign up
          </Link>
        </span>
      }
    >
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          registration={register('email')}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          registration={register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
