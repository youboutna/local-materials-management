
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Payment } from '@/types/project';
import { format } from 'date-fns';

interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucun paiement effectué pour ce projet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des paiements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div 
              key={payment.id}
              className="flex justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{payment.amount.toLocaleString()} MRU</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(payment.paymentDate), 'dd/MM/yyyy')} • {payment.paymentMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">#{payment.transactionId}</p>
                <p className="text-xs text-muted-foreground">Progression: {payment.progressAtPayment}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
