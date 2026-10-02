import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/lib/utils";

type AddressSummaryProps = {
  address: {
    label?: string | null;
    fullName: string;
    phone?: string;
    streetAddress: string;
    city: string;
    province?: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  };
};

const AddressSummary = ({ address }: AddressSummaryProps) => {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{address.fullName}</span>

        {address.label && <Badge variant="outline">{address.label}</Badge>}

        {address.isDefault && <Badge variant="secondary">Default</Badge>}
      </div>

      {address.phone ? (
        <p className="text-muted-foreground">{address.phone}</p>
      ) : (
        <p className="text-destructive">Mobile number missing</p>
      )}

      <p className="text-muted-foreground">{formatAddress(address)}</p>
    </div>
  );
};

export default AddressSummary;
