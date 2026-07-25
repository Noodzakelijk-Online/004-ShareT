import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const PAYMENT_LINKS = {
  '10': 'https://wise.com/pay/r/iQfsdutuWdOnBVo',
  '50': 'https://wise.com/pay/r/g2GAvZSBGkc2DrU',
  '100': 'https://wise.com/pay/r/8ZGYGFbHAxpDikw',
};

export const PaymentDialog = () => {
  const [bundle, setBundle] = useState('10');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handlePayment = () => {
    const paymentWindow = window.open(PAYMENT_LINKS[bundle], '_blank', 'noopener,noreferrer');

    if (!paymentWindow) {
      toast({
        title: 'Payment page blocked',
        description: 'Allow pop-ups for ShareT and try again.',
        variant: 'destructive',
      });
      return;
    }

    setOpen(false);
    toast({
      title: 'Wise payment opened',
      description: 'Credits are added only after the payment has been confirmed.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CreditCard className="mr-2 h-4 w-4" /> Buy Credits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Select a bundle and complete the payment in Wise. Credits are added after payment confirmation.
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
          <Button onClick={handlePayment}>Continue to Wise</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
