'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { emailReportAction } from '@/app/actions';
import type { DailyReport } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DailyReport;
  emailBody: string;
  userName: string;
  userEmail: string;
}

export function EmailPreviewDialog({ open, onOpenChange, report, emailBody, userName, userEmail }: EmailPreviewDialogProps) {
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const result = await emailReportAction(report, emailBody, userName, userEmail);
      if (result.success) {
        toast({ title: 'Email sent successfully!' });
        onOpenChange(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send email',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = emailBody;

      // Get the formatted text content
      const textContent = tempDiv.innerText || tempDiv.textContent || "";
      const trimmedText = textContent.trim();

      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(trimmedText);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = trimmedText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast({ title: 'Email copied to clipboard!' });
    } catch (error: unknown) {
      console.error('Copy failed:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unable to copy to clipboard. Please try again.';

      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: errorMessage,
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>
            Review the generated email report before sending.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow border rounded-md p-6 bg-muted/30">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: emailBody }}
          />
        </ScrollArea>
        <DialogFooter className="flex-wrap justify-end gap-2 pt-4 flex-shrink-0">
           <Button variant="outline" onClick={handleCopy} disabled={isSending}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Email
            </Button>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
