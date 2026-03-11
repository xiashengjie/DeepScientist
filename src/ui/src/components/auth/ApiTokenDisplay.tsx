'use client';

import { useState } from 'react';
import { Copy, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { PngIcon } from '@/components/ui/png-icon';
import { useI18n } from '@/lib/i18n/useI18n';

interface ApiTokenDisplayProps {
  token: string;
  showWarning?: boolean;
}

export function ApiTokenDisplay({ token, showWarning = false }: ApiTokenDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(showWarning);
  const { t } = useI18n('common');

  const handleCopy = async () => {
    const success = await copyToClipboard(token);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayToken = visible ? token : token.slice(0, 10) + '•'.repeat(30);

  const tokenContainerClass = showWarning
    ? 'bg-[#F1E3B6]/70 border border-[#D7C6AE]/70 text-[#2D2A26]'
    : 'bg-slate-800/50 border border-slate-700 text-slate-300'

  return (
    <div className="space-y-3">
      {/* Token Display */}
      <div className="relative">
        <div className={`flex min-w-0 items-center gap-2 p-3 rounded-lg font-mono text-sm ${tokenContainerClass}`}>
          <code className="min-w-0 flex-1 truncate">{displayToken}</code>
          <button
            onClick={() => setVisible(!visible)}
            className={`p-1.5 rounded transition-colors ${showWarning ? 'hover:bg-black/5' : 'hover:bg-slate-700'}`}
            title={visible ? t('token_hide') : t('token_show')}
          >
            {visible ? (
              <PngIcon
                name="EyeOff"
                size={16}
                className="h-4 w-4"
                fallback={<EyeOff className="h-4 w-4 text-slate-400" />}
              />
            ) : (
              <PngIcon
                name="Eye"
                size={16}
                className="h-4 w-4"
                fallback={<Eye className="h-4 w-4 text-slate-400" />}
              />
            )}
          </button>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded transition-colors ${showWarning ? 'hover:bg-black/5' : 'hover:bg-slate-700'}`}
            title={t('token_copy_clipboard')}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <PngIcon
                name="Copy"
                size={16}
                className="h-4 w-4"
                fallback={<Copy className="h-4 w-4 text-slate-400" />}
              />
            )}
          </button>
        </div>
      </div>

      {/* Warning Message */}
      {showWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F3E8C1]/85 border border-[#D0B26E]/35">
          <AlertTriangle className="h-5 w-5 text-[#B04F4F] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#2D2A26]">
            <p className="font-medium">{t('token_warning_title')}</p>
            <p className="mt-1 text-[#5D5A55]">
              {t('token_warning_description')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
