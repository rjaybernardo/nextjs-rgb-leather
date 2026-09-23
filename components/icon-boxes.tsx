import { DollarSign, Headset, ShoppingBag, WalletCards } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const IconBoxes = () => {
  return (
    <Card>
      <CardContent className="grid gap-6 p-6 md:grid-cols-4">
        <div className="space-y-2">
          <ShoppingBag className="size-6" />
          <div className="text-sm font-bold">Free Shipping</div>
          <div className="text-sm text-muted-foreground">
            Free shipping for qualifying orders
          </div>
        </div>

        <div className="space-y-2">
          <DollarSign className="size-6" />
          <div className="text-sm font-bold">Money Back Guarantee</div>
          <div className="text-sm text-muted-foreground">
            Easy returns within the return period
          </div>
        </div>

        <div className="space-y-2">
          <WalletCards className="size-6" />
          <div className="text-sm font-bold">Flexible Payment</div>
          <div className="text-sm text-muted-foreground">
            Convenient Cash on Delivery available
          </div>
        </div>

        <div className="space-y-2">
          <Headset className="size-6" />
          <div className="text-sm font-bold">Customer Support</div>
          <div className="text-sm text-muted-foreground">
            Get support when you need it
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IconBoxes;
