/**
 * @file HarmonyVoiceApp.tsx
 * @description Mini App component container for Habeshawi Voice Live.
 */

import React from 'react';
import HarmonyVoiceAppModule from '../../apps/voice';

interface HarmonyVoiceAppProps {
  onSaveNote?: (note: any) => Promise<any>;
  onSaveDoc?: (doc: any) => Promise<any>;
}

export const HarmonyVoiceApp: React.FC<HarmonyVoiceAppProps> = ({
  onSaveNote,
  onSaveDoc,
}) => {
  return (
    <HarmonyVoiceAppModule
      onSaveNote={onSaveNote}
      onSaveDoc={onSaveDoc}
    />
  );
};

export default HarmonyVoiceApp;
