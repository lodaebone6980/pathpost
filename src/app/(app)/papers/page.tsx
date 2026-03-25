"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function PapersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">논문 관리</h2>
        <p className="text-muted-foreground mt-1">저장한 논문과 인용을 관리합니다</p>
      </div>

      <Card>
        <CardContent className="pt-6 text-center py-12 space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            논문 검색에서 인용한 논문들이 여기에 표시됩니다
          </p>
          <Link href="/search">
            <Button variant="outline">논문 검색하러 가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
