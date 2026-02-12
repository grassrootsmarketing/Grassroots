'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface Channel {
  channelName: string;
  workspace: string;
  messageCount: number;
  summary: string;
}

interface Digest {
  generatedAt: string;
  totalMessages: number;
  overallSummary: string;
  channels: Channel[];
}

export default function SlackDigest() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDigest();
  }, []);

  async function fetchDigest() {
    try {
      const res = await fetch('/api/slack-digest');
      if (res.ok) {
        const data = await res.json();
        setDigest(data);
      }
    } catch (err) {
      console.error('Failed to load digest:', err);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/slack-digest/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDigest(data.digest);
      }
    } catch (err) {
      console.error('Failed to generate digest:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggle(channelName: string) {
    setExpanded(prev => ({ ...prev, [channelName]: !prev[channelName] }));
  }

  if (!digest) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-l-4 border-brand-teal p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-brand-teal" />
            <h3 className="text-base font-bold tracking-tight">Slack Daily Digest</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500">No digest available. Click refresh to generate.</p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark transition-colors text-sm font-medium flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Generate Digest'}
        </button>
      </div>
    );
  }

  const formattedTime = new Date(digest.generatedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border-l-4 border-brand-teal p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-brand-teal" />
          <div>
            <h3 className="text-base font-bold tracking-tight">Slack Daily Digest</h3>
            <p className="text-xs text-gray-400">Last week&apos;s activity</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal-dark transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Generated {formattedTime}
          </span>
          <span className="text-gray-300">&bull;</span>
          <span>
            {digest.totalMessages} message{digest.totalMessages !== 1 ? 's' : ''} across{' '}
            {digest.channels.length} channel{digest.channels.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-brand-teal-50 border border-brand-teal-100 rounded-lg p-4">
          <p className="text-xs font-semibold text-brand-teal-dark uppercase tracking-wide mb-1.5">
            Overall Summary
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{digest.overallSummary}</p>
        </div>

        <div className="space-y-1.5">
          {digest.channels.map(ch => {
            const isOpen = expanded[ch.channelName];
            return (
              <div key={ch.channelName} className="border border-gray-100 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => toggle(ch.channelName)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-brand-teal font-semibold text-sm">#{ch.channelName}</span>
                    <span className="text-xs bg-brand-teal-50 text-brand-teal px-2 py-0.5 rounded-full font-medium">
                      {ch.messageCount}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="text-sm text-gray-600 leading-relaxed mt-2.5 space-y-3">
                      {ch.summary.split('\n\n').map((section, idx) => (
                        <div key={idx}>
                          {section.split('\n').map((line, lineIdx) => {
                            if (line.match(/^\*\*•.*:\*\*$/)) {
                              return (
                                <p key={lineIdx} className="font-bold text-gray-800 mt-3 mb-1">
                                  {line.replace(/\*\*/g, '')}
                                </p>
                              );
                            }
                            if (line.startsWith('•') || line.startsWith('-')) {
                              return (
                                <p key={lineIdx} className="ml-4 mb-1">
                                  {line}
                                </p>
                              );
                            }
                            return line ? <p key={lineIdx} className="mb-1">{line}</p> : null;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
