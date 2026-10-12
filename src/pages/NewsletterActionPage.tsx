import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNewsletterSubscribersHex } from '@/hooks/hexagonal/useNewsletterSubscribersHex';

type ActionState = 'loading' | 'success' | 'error';

export default function NewsletterActionPage() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  const token = searchParams.get('token');
  const [state, setState] = useState<ActionState>('loading');
  const [message, setMessage] = useState('Processing your request...');
  const handled = useRef<string | null>(null);
  const { useConfirmSubscriptionByToken, useUnsubscribeByToken } = useNewsletterSubscribersHex();
  const { mutate: confirmSubscription } = useConfirmSubscriptionByToken();
  const { mutate: unsubscribe } = useUnsubscribeByToken();

  useEffect(() => {
    const requestKey = `${action ?? ''}:${token ?? ''}`;
    if (handled.current === requestKey) return;
    handled.current = requestKey;
    if (!token || (action !== 'confirm' && action !== 'unsubscribe')) {
      setState('error');
      setMessage('This newsletter link is invalid.');
      return;
    }

    const completeAction = action === 'confirm' ? confirmSubscription : unsubscribe;
    completeAction(token, {
      onSuccess: () => {
        setState('success');
        setMessage(action === 'confirm'
          ? 'Your newsletter subscription is confirmed.'
          : 'You have been unsubscribed from the newsletter.');
      },
      onError: (error) => {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'This link is invalid or has expired.');
      },
    });
  }, [action, token, confirmSubscription, unsubscribe]);

  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p role="status" aria-live="polite">{message}</p>
          {state !== 'loading' && (
            <Button asChild variant="outline">
              <Link to="/">Return to the website</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
