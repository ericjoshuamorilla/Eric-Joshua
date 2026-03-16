"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { adminVisitLogSummary } from "@/ai/flows/admin-visit-log-summary";

interface AIInsightsProps {
  logs: any[];
}

export function AIInsights({ logs }: AIInsightsProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (logs.length === 0) return;
    setLoading(true);
    try {
      const inputLogs = logs.map(l => ({
        userId: l.userId,
        timestamp: l.timestamp,
        purpose: l.purposeOfVisit as any
      }));
      
      const result = await adminVisitLogSummary({
        visitLogs: inputLogs,
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("AI insight generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Visit Summary
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Get an intelligent summary of your filtered trends.
          </p>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={loading || logs.length === 0}
          className="bg-primary hover:bg-primary/90 rounded-full gap-2 px-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {summary ? "Regenerate" : "Analyze Patterns"}
        </Button>
      </CardHeader>
      {summary && (
        <CardContent className="pt-0">
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-white shadow-sm prose prose-sm max-w-none">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
