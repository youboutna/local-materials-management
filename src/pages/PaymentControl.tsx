import React from 'react';
import PaymentBlockingInterface from '@/components/payments/PaymentBlockingInterface';

const PaymentControlPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <PaymentBlockingInterface />
        </div>
      </div>
    </div>
  );
};

export default PaymentControlPage;