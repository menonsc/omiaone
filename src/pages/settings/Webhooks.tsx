import React from 'react';
import WebhookSection from '../../components/WebhookSection';

export default function SettingsWebhooks() {
  return (
    <div className="p-8 pt-10 pl-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 text-neutral-900">Webhooks</h1>
      <p className="text-neutral-600 mb-6">Gerencie seus webhooks aqui.</p>
      <WebhookSection />
    </div>
  );
} 