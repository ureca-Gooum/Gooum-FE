import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircle2, HelpCircle, Code2, ListTodo } from 'lucide-react';

interface SummaryData {
  title: string;
  summary: string;
  decisions: string[];
  actionItems: { task: string; assignee: string | null }[];
  codeSnippets: { language: string; code: string; description: string }[];
  unresolvedQuestions: string[];
}

export function MeetingSummary({ data }: { data: SummaryData }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border-default bg-bg-default p-5">
      <h2 className="text-lg font-semibold text-fg-primary">{data.title}</h2>

      <p className="text-sm text-fg-secondary leading-relaxed">{data.summary}</p>

      {data.decisions.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={16} className="text-brand-primary" />
            <h3 className="text-sm font-medium text-fg-primary">결정된 사항</h3>
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-sm text-fg-secondary list-disc">
            {data.decisions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {data.actionItems.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <ListTodo size={16} className="text-brand-primary" />
            <h3 className="text-sm font-medium text-fg-primary">할 일</h3>
          </div>
          <ul className="flex flex-col gap-1.5">
            {data.actionItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span className="text-fg-secondary">{item.task}</span>
                {item.assignee && (
                  <span className="text-xs text-brand-primary bg-brand-soft px-2 py-0.5 rounded-full">
                    {item.assignee}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.codeSnippets.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Code2 size={16} className="text-brand-primary" />
            <h3 className="text-sm font-medium text-fg-primary">코드 스니펫</h3>
          </div>
          {data.codeSnippets.map((snippet, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="text-xs text-fg-tertiary">{snippet.description}</p>
              <div className="rounded-lg overflow-hidden text-xs">
                <SyntaxHighlighter language={snippet.language} style={oneDark} customStyle={{ margin: 0 }}>
                  {snippet.code}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
        </section>
      )}

      {data.unresolvedQuestions.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <HelpCircle size={16} className="text-warning" />
            <h3 className="text-sm font-medium text-fg-primary">아직 정해지지 않은 것</h3>
          </div>
          <ul className="flex flex-col gap-1 pl-5 text-sm text-fg-secondary list-disc">
            {data.unresolvedQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
