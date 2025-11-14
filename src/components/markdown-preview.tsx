
'use client';

import React from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const renderLine = (line: string, index: number) => {
    // Headers
    if (line.startsWith('#### ')) {
      return <h4 key={index} className="text-lg font-semibold mt-4 mb-2">{line.substring(5)}</h4>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 border-b pb-2">{line.substring(3)}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-3xl font-bold mt-6 mb-4 border-b pb-2">{line.substring(2)}</h1>;
    }
    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const parts = line.substring(2).split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return (
        <li key={index} className="ml-5 list-disc">
          {parts}
        </li>
      );
    }

    // Paragraph with bold support
    const parts = line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return <p key={index}>{parts}</p>;
  };

  const lines = content.split('\n');
  const elements = [];
  let isList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!isList) {
        isList = true;
        elements.push(<ul key={`ul-${i}`} className="space-y-1 my-4">{renderLine(line, i)}</ul>);
      } else {
        const lastElement = elements[elements.length - 1];
        if (React.isValidElement(lastElement) && lastElement.type === 'ul') {
          // Add to existing list
          const newChildren = [...(lastElement.props.children || []), renderLine(line, i)];
          elements[elements.length - 1] = React.cloneElement(lastElement, { children: newChildren });
        }
      }
    } else {
      isList = false;
      elements.push(renderLine(line, i));
    }
  }

  return <div className="prose prose-sm dark:prose-invert max-w-none">{elements}</div>;
}
