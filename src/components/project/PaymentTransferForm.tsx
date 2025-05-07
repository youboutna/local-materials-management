
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { PaymentValidator } from '@/services/paymentValidation';
import { ProjectWithPayments } from '@/types/project';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Le montant doit être positif'),
  paymentDate: z.date(),
  paymentMethod: z.enum(['virement_bancaire', 'chèque', 'mobile_money']),
});

type PaymentTransferFormProps = {
  project: ProjectWithPayments;
  onSuccess: () => void;
};

export function PaymentTransferForm({ project, onSuccess }: PaymentTransferFormProps) {
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: 'virement_bancaire',
    },
  });

  const onSubmit = (values: z.infer<typeof paymentSchema>) => {
    const validation = PaymentValidator.validatePaymentTransfer(project, values.amount);
    
    if (!validation.valid) {
      toast({
        title: 'Échec de la validation du paiement',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    // Proceed with payment API call
    toast({
      title: 'Paiement traité avec succès',
      description: `Transfert de ${values.amount.toLocaleString()} MRU approuvé`,
    });
    onSuccess();
  };

  const maxAllowedAmount = PaymentValidator.calculateAllowedAmount(project);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Paiement autorisé basé sur la progression ({project.progress}%) : {maxAllowedAmount.toLocaleString()} MRU
          </p>
          {project.inspections?.some(i => i.status === 'approved') && (
            <p className="text-sm text-blue-800 mt-1">
              Dernière inspection: {format(new Date(project.inspections.find(i => i.status === 'approved')?.date || ''), 'dd/MM/yyyy')}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant (MRU)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max={maxAllowedAmount}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de paiement</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date(project.startDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Méthode de paiement</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="virement_bancaire">Virement bancaire</option>
                  <option value="chèque">Chèque</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Initier le transfert de paiement
        </Button>
      </form>
    </Form>
  );
}
