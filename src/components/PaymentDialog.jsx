import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";

const PAYMENT_LINKS = {
  '10': 'https://wise.com/pay/r/iQfsdutuWdOnBVo',
  '50': 'https://wise.com/pay/r/g2GAvZSBGkc2DrU',
  '100': 'https://wise.com/pay/r/8ZGYGFbHAxpDikw',
};

export const PaymentDialog = ({ onPaymentSuccess }) => {
  const [bundle, setBundle] = useState('10');

  const handlePayment = () => {
    window.open(PAYMENT_LINKS[bundle], '_blank');
    // Note: In a real-world scenario, you'd want to verify the payment was successful
    // before adding credits. This might involve a webhook or checking a payment status API.
    const creditsToAdd = parseInt(bundle);
    onPaymentSuccess((prevCredits) => prevCredits + creditsToAdd);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CreditCard className="mr-2 h-4 w-4" /> Buy Credits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Select a credit bundle to purchase.
          </DialogDescription>
        </DialogHeader>
        <Select value={bundle} onValueChange={setBundle}>
          <SelectTrigger>
            <SelectValue placeholder="Select a bundle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 credits - €0.50</SelectItem>
            <SelectItem value="50">50 credits - €2.50</SelectItem>
            <SelectItem value="100">100 credits - €5.00</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handlePayment}>Purchase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
