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
}

export function EmailPreviewDialog({ open, onOpenChange, report, emailBody, userName }: EmailPreviewDialogProps) {
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const result = await emailReportAction(report, emailBody, userName);
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

  const handleCopy = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = emailBody;
    // Use innerText to preserve line breaks and basic formatting
    const plainText = tempDiv.innerText || "";
    
    navigator.clipboard.writeText(plainText.trim());
    toast({ title: 'Email content copied to clipboard!' });
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
        <ScrollArea className="flex-grow border rounded-md overflow-hidden">
            <iframe srcDoc={emailBody} className="w-full h-full" />
        </ScrollArea>
        <DialogFooter className="flex-wrap justify-end gap-2 pt-4">
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
