import React from 'react';
import { Head } from '@inertiajs/react';
import CallScreen from '../components/call/CallScreen';

const Call = ({ callId, callType, recipientId, callerName }) => {
  return (
    <>
      <Head title={`${callType === 'video' ? 'Video' : 'Voice'} Call`} />
      <CallScreen 
        callId={callId}
        callType={callType}
        recipientId={recipientId}
        callerName={callerName}
      />
    </>
  );
};

export default Call;