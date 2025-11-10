import { FlowVisualizer } from '@/components/analytics/flow-visualizer';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-muted-foreground">
        Visualize your task-energy alignment over time. The AI will generate a
        chart and a summary report based on your completed tasks and daily
        energy levels.
      </p>
      <FlowVisualizer />
    </div>
  );
}
