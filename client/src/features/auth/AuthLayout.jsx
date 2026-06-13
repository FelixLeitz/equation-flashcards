import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

/**
 * Centered card layout shared by the Login and SignUp pages.
 * Mobile-first: full-width card on small screens, constrained on larger.
 */
export function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        {footer && (
          <div className="px-6 pb-6 pt-0 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
}
