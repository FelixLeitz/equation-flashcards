import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setError(null);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const run = async () => {
      await checkHealth();
    };

    run();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Equation Flashcards</CardTitle>
          <CardDescription>Frontend scaffold is working 🎉</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-card p-3 text-sm">
            <p className="font-medium">Backend health check:</p>
            {error && <p className="text-destructive">Error: {error}</p>}
            {health && (
              <pre className="mt-1 overflow-x-auto text-muted-foreground">
                {JSON.stringify(health, null, 2)}
              </pre>
            )}
            {!health && !error && (
              <p className="text-muted-foreground">Checking…</p>
            )}
          </div>
          <Button onClick={checkHealth} className="w-full">
            Re-check backend
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
