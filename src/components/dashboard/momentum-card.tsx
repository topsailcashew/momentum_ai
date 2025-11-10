import { TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MomentumScore } from '@/lib/types';

export function MomentumCard({ latestMomentum }: { latestMomentum?: MomentumScore }) {
  const score = latestMomentum?.score ?? 0;
  const streak = latestMomentum?.streak ?? 0;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="text-primary" />
            Daily Momentum
        </CardTitle>
        <CardDescription>Your task-energy alignment score.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-around text-center">
            <div>
                <p className="text-4xl font-bold text-primary">{score}</p>
                <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div>
                 <p className="text-4xl font-bold text-accent">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
        </div>
        {latestMomentum?.summary && (
            <div className="p-2 text-xs rounded-lg bg-muted text-muted-foreground">
                <p><span className="font-semibold text-foreground">AI Summary:</span> {latestMomentum.summary}</p>
            </div>
        )}
         {!latestMomentum && (
            <div className="p-3 text-sm text-center rounded-lg bg-muted text-muted-foreground">
                <p>Complete tasks to see your score!</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
