// /components/MarkdownRenderer.tsx
'use client';
import { motion } from 'framer-motion';
import { Check, Clipboard } from 'lucide-react';
import { FC, memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface CopyButtonProps {
  text: string;
}

const CopyButton: FC<CopyButtonProps> = ({ text }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={isCopied}
      className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-100 disabled:bg-green-800"
      aria-label="Copy code"
    >
      {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
    </button>
  );
};

const blockVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
};

const MarkdownRenderer: FC<{ content: string }> = memo(({ content }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="prose prose-invert max-w-none prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <motion.h1
              variants={blockVariants}
              className="text-2xl font-bold my-4"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <motion.h2
              variants={blockVariants}
              className="text-xl font-bold my-3"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <motion.h3
              variants={blockVariants}
              className="text-lg font-semibold my-2"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <motion.ul
              variants={blockVariants}
              className="list-disc pl-6"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <motion.ol
              variants={blockVariants}
              className="list-decimal pl-6"
              {...props}
            />
          ),
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          p: ({ node, ...props }) => {
            const hasBlockElement = node?.children.some(
              (child) => child.type === 'element'
            );
            if (hasBlockElement) {
              return <>{props.children}</>;
            }
            return <motion.p variants={blockVariants} {...props} />;
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            return !inline ? (
              <motion.div variants={blockVariants} className="relative group">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match?.[1] || 'text'}
                  PreTag="div"
                  className="bg-[#1e1e1e] p-4 rounded-md my-4 overflow-x-auto !text-sm"
                  {...props}
                >
                  {codeText}
                </SyntaxHighlighter>
                <CopyButton text={codeText} />
              </motion.div>
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
    </motion.div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
export default MarkdownRenderer;
