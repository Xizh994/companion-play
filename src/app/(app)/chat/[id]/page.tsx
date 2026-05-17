"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ChatRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params.id as string;
    router.replace(`/chat?conv=${id}`);
  }, [params.id, router]);

  return null;
}
