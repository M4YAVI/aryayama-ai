// /components/MarkdownRenderer.tsx
'use client';
import { motion } from 'framer-motion';
import { FC, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  isReasoning?: boolean; // The new prop to control styling
}

const CopyButton: FC<{ text: string }> = ({ text }) => {
  /* ... Unchanged ... */
};
const blockVariants = {
  /* ... Unchanged ... */
};

const MarkdownRenderer: FC<MarkdownRendererProps> = memo(
  ({ content, isReasoning = false }) => {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        className={`prose prose-invert max-w-none ${
          isReasoning ? 'prose-sm text-gray-400 font-sans' : 'prose-p:my-2'
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, ...props }) => {
              if (
                node?.children.some(
                  (child) => child.type === 'element' && child.tagName === 'pre'
                )
              ) {
                return <>{props.children}</>; // Avoid wrapping code blocks in <p>
              }
              return isReasoning ? (
                <motion.p
                  variants={blockVariants}
                  className="my-1.5"
                  {...props}
                />
              ) : (
                <motion.p variants={blockVariants} {...props} />
              );
            },
            code({ node, inline, className, children, ...props }) {
              // This is the core logic fix for the UI.
              // For reasoning, indented text is NOT treated as a code block.
              if (isReasoning && !inline && !className) {
                return (
                  <p className="font-mono bg-black/20 p-2 rounded-md my-2">
                    {children}
                  </p>
                );
              }

              const match = /language-(\w+)/.exec(className || '');
              const codeText = String(children).replace(/\n$/, '');

              return !inline ? (
                <motion.div
                  variants={blockVariants}
                  className="relative group my-4"
                >
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match?.[1] || 'text'}
                    PreTag="div"
                    className="bg-[#1e1e1e] p-4 rounded-md overflow-x-auto !text-sm"
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                  <CopyButton text={codeText} />
                </motion.div>
              ) : (
                <code
                  className="bg-[#111] text-sm font-mono px-1.5 py-1 rounded"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // ... other components like h1, h2, ul, etc. are unchanged ...
          }}
        >
          {content}
        </ReactMarkdown>
      </motion.div>
    );
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';
export default MarkdownRenderer;
