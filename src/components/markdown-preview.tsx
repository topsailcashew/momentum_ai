'use client';

import React from 'react';

interface MarkdownPreviewProps {
  content: string | null;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return <p className="text-sm text-muted-foreground">The generated report will appear here.</p>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const renderList = (list: string[], key: string) => {
    if (list.length === 0) return null;
    return (
      <ul key={key} className="list-disc space-y-1 pl-5 my-2">
        {list.map((item, index) => (
          <li key={index} className="text-sm text-muted-foreground">{item.startsWith('- ') ? item.substring(2) : item}</li>
        ))}
      </ul>
    );
  };

  lines.forEach((line, i) => {
    if (line.startsWith('## ') && line.endsWith(' ##')) {
      if (currentList.length > 0) {
        elements.push(renderList(currentList, `list-${i - 1}`));
        currentList = [];
      }
      elements.push(
        <h3 key={i} className="text-md font-semibold mt-4 mb-2 border-b pb-1">
          {line.substring(3, line.length - 3)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      currentList.push(line);
    } else {
      if (currentList.length > 0) {
        elements.push(renderList(currentList, `list-${i - 1}`));
        currentList = [];
      }
      if (line.trim() !== '') {
        elements.push(<p key={i} className="text-sm text-muted-foreground my-2">{line}</p>);
      }
    }
  });

  if (currentList.length > 0) {
    elements.push(renderList(currentList, `list-final`));
  }

  return <div className="space-y-2">{elements}</div>;
}
