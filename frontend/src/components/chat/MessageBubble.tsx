import React from 'react';
import { Product } from '../../types';
import ProductCardMessage from './ProductCardMessage';

function renderMarkdown(text: string): string {
  // Split into lines to handle lists and block elements
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  for (let line of lines) {
    const trimmed = line.trim();
    // Detect list item: starts with '- ' or '* ' (with optional spaces)
    const listMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      inList = true;
      listItems.push(listMatch[1]);
    } else {
      if (inList) {
        const listHtml = `<ul style="margin:0.3rem 0; padding-left:1.2rem;">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
        processedLines.push(listHtml);
        inList = false;
        listItems = [];
      }
      processedLines.push(line);
    }
  }
  if (inList) {
    const listHtml = `<ul style="margin:0.3rem 0; padding-left:1.2rem;">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
    processedLines.push(listHtml);
  }

  let html = processedLines.join('\n');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size:1.1rem; font-weight:bold; margin-top:0.5rem; margin-bottom:0.3rem;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:1.25rem; font-weight:bold; margin-top:0.75rem; margin-bottom:0.4rem;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size:1.5rem; font-weight:bold; margin-top:1rem; margin-bottom:0.5rem;">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr style="border:0; border-top:1px solid #ddd; margin:0.8rem 0;" />');

  // Tables – remove any [id] markers from table content
  const tableRegex = /((\|[^\n]+\|\s*\n)+)/g;
  html = html.replace(tableRegex, (match) => {
    // Remove all [digits] from the table content
    const cleanedMatch = match.replace(/\[\d+\]/g, '');
    const rows = cleanedMatch.trim().split('\n').map(r => r.trim()).filter(r => r.startsWith('|') && r.endsWith('|'));
    const dataRows = rows.filter(r => !r.match(/\|[\s-:]+\|/));
    if (dataRows.length === 0) return '';
    const headerRow = dataRows[0];
    const bodyRows = dataRows.slice(1);
    const headerCells = headerRow.split('|').filter(c => c.trim() !== '').map(c => `<th style="border:1px solid #ccc; padding:4px 8px; text-align:left; font-weight:bold;">${c.trim()}</th>`);
    const bodyCells = bodyRows.map(row => {
      const cells = row.split('|').filter(c => c.trim() !== '').map(c => `<td style="border:1px solid #ccc; padding:4px 8px;">${c.trim()}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    });
    const tableHtml = `<table style="border-collapse:collapse; width:100%; min-width:400px; font-size:0.9rem;">${headerCells.length ? `<thead><tr>${headerCells.join('')}</tr></thead>` : ''}<tbody>${bodyCells.join('')}</tbody></table>`;
    return `<div style="overflow-x:auto; max-width:100%; margin:0.5rem 0;">${tableHtml}</div>`;
  });

  // Convert remaining newlines to <br/>
  html = html.replace(/\n/g, '<br/>');
  return html;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { content, productCards } = message;

  const cardMap: Record<string, Product> = {};
  if (productCards) {
    productCards.forEach(p => {
      cardMap[p.id] = p;
    });
  }

  // --- Helper to determine if a position is inside a table row ---
  function isInsideTableRow(content: string, index: number): boolean {
    // Find the start of the line containing the index
    let lineStart = content.lastIndexOf('\n', index);
    if (lineStart === -1) lineStart = 0;
    // Find the end of the line
    let lineEnd = content.indexOf('\n', index);
    if (lineEnd === -1) lineEnd = content.length;
    const line = content.substring(lineStart, lineEnd).trim();
    // A table row starts and ends with '|'
    return line.startsWith('|') && line.endsWith('|');
  }

  // --- Split content into segments, but skip markers inside table rows ---
  const segments: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    const markerIndex = match.index;
    const id = match[1];

    // Check if this marker is inside a table row
    if (isInsideTableRow(content, markerIndex)) {
      // Skip rendering a card for this marker; we'll remove the marker from the text
      // We'll just add the text up to the marker and continue without the marker
      const before = content.substring(lastIndex, markerIndex);
      if (before) {
        const html = renderMarkdown(before);
        segments.push(<span key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
      }
      // Do NOT add the marker or a card
      lastIndex = regex.lastIndex;
      continue;
    }

    // Normal processing: add text before marker, then the card
    const before = content.substring(lastIndex, markerIndex);
    if (before) {
      const html = renderMarkdown(before);
      segments.push(<span key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
    }

    const product = cardMap[id];
    if (product) {
      segments.push(
        <div key={key++} className="my-2">
          <ProductCardMessage product={product} />
        </div>
      );
    } else {
      segments.push(<span key={key++} className="text-gray-500">[{id}]</span>);
    }

    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last marker
  const after = content.substring(lastIndex);
  if (after) {
    const html = renderMarkdown(after);
    segments.push(<span key={key++} dangerouslySetInnerHTML={{ __html: html }} />);
  }

  // If no segments (no markers), render the whole content as markdown
  if (segments.length === 0) {
    const html = renderMarkdown(content);
    segments.push(<span key={0} dangerouslySetInnerHTML={{ __html: html }} />);
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] p-3 rounded-lg ${
          isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
        style={{ wordBreak: 'break-word' }}
      >
        {segments}
        <div className="text-xs opacity-70 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;