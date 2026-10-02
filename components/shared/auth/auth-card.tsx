import Image from "next/image";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

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
            <Image
              priority
              src="/images/logo.svg"
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
            />
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
