// /components/MarkdownRenderer.tsx
'use client';
import { Clipboard } from 'lucide-react';
import { FC, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface CopyButtonProps {
  text: string;
}

const CopyButton: FC<CopyButtonProps> = ({ text }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-all"
      aria-label="Copy code"
    >
      <Clipboard size={16} />
    </button>
  );
};

const MarkdownRenderer: FC<{ content: string }> = memo(({ content }) => {
  return (
    <div className="prose prose-invert max-w-none prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold my-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold my-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold my-2" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            return !inline ? (
              <div className="relative">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match?.[1] || 'text'}
                  PreTag="pre"
                  className="bg-[#1e1e1e] p-4 rounded-md my-4 overflow-x-auto !text-sm"
                  {...props}
                >
                  {codeText}
                </SyntaxHighlighter>
                <CopyButton text={codeText} />
              </div>
            ) : (
              <code
                className="bg-[#111] text-sm font-mono px-1 py-0.5 rounded"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
export default MarkdownRenderer;
