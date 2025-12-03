'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addStrategicPlan, updateStrategicPlan, addStrategicGoal, addStrategicMetric, addMilestone } from '@/lib/data-firestore';
import { extractStrategicPlan } from '@/ai/flows/extract-strategic-plan';
import type { Ministry, StrategicPlan } from '@/lib/types';
import { Upload, FileText, Loader2, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorage } from 'firebase/storage';

interface StrategicPlanSectionProps {
  ministry: Ministry;
  strategicPlan: StrategicPlan | null;
}

export function StrategicPlanSection({ ministry, strategicPlan }: StrategicPlanSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [visionStatement, setVisionStatement] = React.useState('');
  const [missionStatement, setMissionStatement] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  React.useEffect(() => {
    if (strategicPlan) {
      setTitle(strategicPlan.title);
      setVisionStatement(strategicPlan.visionStatement || '');
      setMissionStatement(strategicPlan.missionStatement || '');
      setStartDate(strategicPlan.startDate || '');
      setEndDate(strategicPlan.endDate || '');
    }
  }, [strategicPlan]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !firestore) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
      });
      return;
    }

    setIsUploading(true);
    setIsExtracting(true);

    try {
      // Upload PDF to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `users/${user.uid}/strategic-plans/${ministry.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const pdfUrl = await getDownloadURL(storageRef);

      toast({
        title: 'PDF uploaded',
        description: 'Extracting strategic plan information...',
      });

      // Extract text from PDF (using a simple approach - read as text)
      const text = await file.text();

      // Use AI to extract structured data
      const extractedData = await extractStrategicPlan({
        pdfText: text,
        ministryName: ministry.name,
      });

      // Create or update strategic plan
      let planId: string;
      if (strategicPlan) {
        await updateStrategicPlan(firestore, user.uid, strategicPlan.id, {
          title: extractedData.title,
          visionStatement: extractedData.visionStatement,
          missionStatement: extractedData.missionStatement,
          startDate: extractedData.startDate,
          endDate: extractedData.endDate,
          pdfUrl,
          pdfFileName: file.name,
          extractedAt: new Date().toISOString(),
        });
        planId = strategicPlan.id;
      } else {
        const newPlan = await addStrategicPlan(firestore, user.uid, {
          ministryId: ministry.id,
          title: extractedData.title,
          visionStatement: extractedData.visionStatement,
          missionStatement: extractedData.missionStatement,
          startDate: extractedData.startDate,
          endDate: extractedData.endDate,
          pdfUrl,
          pdfFileName: file.name,
          extractedAt: new Date().toISOString(),
        });
        planId = newPlan.id;
      }

      // Add goals
      for (const goal of extractedData.goals) {
        const newGoal = await addStrategicGoal(firestore, user.uid, {
          planId,
          ministryId: ministry.id,
          title: goal.title,
          description: goal.description,
          targetDate: goal.targetDate,
          status: 'not-started',
          priority: goal.priority,
          progress: 0,
        });

        // Add metrics for this goal
        const goalMetrics = extractedData.metrics.filter(m => m.goalTitle === goal.title);
        for (const metric of goalMetrics) {
          await addStrategicMetric(firestore, user.uid, {
            goalId: newGoal.id,
            planId,
            ministryId: ministry.id,
            name: metric.name,
            currentValue: metric.currentValue,
            targetValue: metric.targetValue,
            unit: metric.unit,
          });
        }

        // Add milestones for this goal
        const goalMilestones = extractedData.milestones.filter(m => m.goalTitle === goal.title);
        for (const milestone of goalMilestones) {
          await addMilestone(firestore, user.uid, {
            goalId: newGoal.id,
            planId,
            ministryId: ministry.id,
            title: milestone.title,
            dueDate: milestone.dueDate || '',
            completed: false,
            description: milestone.description,
          });
        }
      }

      toast({
        title: 'Strategic plan extracted!',
        description: `Successfully extracted ${extractedData.goals.length} goals from your PDF.`,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Extraction failed',
        description: 'Failed to extract data from PDF. Please try entering it manually.',
      });
    } finally {
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const handleManualCreate = async () => {
    if (!user || !firestore || !title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Plan title is required.',
      });
      return;
    }

    setIsCreating(true);

    try {
      if (strategicPlan) {
        await updateStrategicPlan(firestore, user.uid, strategicPlan.id, {
          title: title.trim(),
          visionStatement: visionStatement.trim() || undefined,
          missionStatement: missionStatement.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        toast({
          title: 'Strategic plan updated',
          description: 'Your changes have been saved.',
        });
      } else {
        await addStrategicPlan(firestore, user.uid, {
          ministryId: ministry.id,
          title: title.trim(),
          visionStatement: visionStatement.trim() || undefined,
          missionStatement: missionStatement.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        toast({
          title: 'Strategic plan created',
          description: 'You can now add goals and metrics.',
        });
      }
    } catch (error) {
      console.error('Error saving strategic plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save strategic plan.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!strategicPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Strategic Plan</CardTitle>
          <CardDescription>
            Upload a PDF document or manually create your ministry's strategic plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PDF Upload Section */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Strategic Plan PDF</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI will automatically extract goals, metrics, and timelines
            </p>
            <Label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isExtracting ? 'Extracting data...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Choose PDF File
                  </>
                )}
              </div>
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or create manually</span>
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 2024-2027 Strategic Plan"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vision">Vision Statement</Label>
              <Textarea
                id="vision"
                value={visionStatement}
                onChange={(e) => setVisionStatement(e.target.value)}
                placeholder="What is the long-term vision for this ministry?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission Statement</Label>
              <Textarea
                id="mission"
                value={missionStatement}
                onChange={(e) => setMissionStatement(e.target.value)}
                placeholder="What is the core mission of this ministry?"
                rows={3}
              />
            </div>
            <Button onClick={handleManualCreate} disabled={isCreating} className="w-full">
              {isCreating ? 'Creating...' : 'Create Strategic Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{strategicPlan.title}</CardTitle>
            <CardDescription>
              {strategicPlan.startDate && strategicPlan.endDate && (
                <span className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(strategicPlan.startDate), 'MMM yyyy')} -{' '}
                  {format(new Date(strategicPlan.endDate), 'MMM yyyy')}
                </span>
              )}
            </CardDescription>
          </div>
          {strategicPlan.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={strategicPlan.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                View PDF
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {strategicPlan.visionStatement && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Vision Statement</h3>
            <p className="text-sm">{strategicPlan.visionStatement}</p>
          </div>
        )}
        {strategicPlan.missionStatement && (
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Mission Statement</h3>
            <p className="text-sm">{strategicPlan.missionStatement}</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-4">Update Strategic Plan</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Plan Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vision">Vision Statement</Label>
              <Textarea
                id="edit-vision"
                value={visionStatement}
                onChange={(e) => setVisionStatement(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mission">Mission Statement</Label>
              <Textarea
                id="edit-mission"
                value={missionStatement}
                onChange={(e) => setMissionStatement(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleManualCreate} disabled={isCreating}>
              {isCreating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
