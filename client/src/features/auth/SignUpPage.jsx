import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { signupSchema } from '@flashcards/shared';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/FormField.jsx';
import { AuthLayout } from './AuthLayout.jsx';
import { useSignup } from './api.js';

export default function SignUpPage() {
  const navigate = useNavigate();
  const signup = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', displayName: '', password: '' }
  });

  const onSubmit = async (values) => {
    try {
      await signup.mutateAsync(values);
      toast.success('Account created. Welcome!');
      navigate('/decks', { replace: true });
    } catch (err) {
      // Field/validation + conflict handled via the alert below.
      if (err.status !== 409 && err.code !== 'VALIDATION_ERROR') {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const formError =
    signup.error?.status === 409
      ? signup.error.message
      : signup.error?.code === 'VALIDATION_ERROR'
        ? 'Please check the fields below.'
        : null;

  return (
    <AuthLayout
      title="Create your account"
      description="Start building equation flashcards."
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary underline">
            Log in
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
          id="displayName"
          label="Display name"
          autoComplete="name"
          error={errors.displayName}
          registration={register('displayName')}
        />
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
          autoComplete="new-password"
          error={errors.password}
          registration={register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
