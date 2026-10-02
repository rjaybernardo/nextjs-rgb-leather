import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SiteLogo from "@/components/shared/site-logo";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const AuthCard = ({ title, description, children }: AuthCardProps) => {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center justify-center">
            <SiteLogo size={100} priority />
          </Link>

          <CardTitle className="text-center">{title}</CardTitle>

          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
};

export default AuthCard;
