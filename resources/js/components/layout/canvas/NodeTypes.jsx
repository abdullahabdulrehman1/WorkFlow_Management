import React from 'react';
import { LucideMail, LucideMessageCircle, LucideBell, LucideZap } from 'lucide-react';

export const TriggerNode = ({ data }) => (
  <div className="rounded-xl bg-orange-100 border border-orange-300 shadow p-4 text-sm font-semibold text-gray-700">
    {data.label}
  </div>
);

export const ActionNode = ({ data }) => {
  let Icon, bgClass, borderClass;

  switch (data.label) {
    case 'Send email':
      Icon = LucideMail;
      bgClass = 'bg-blue-100';
      borderClass = 'border-blue-300';
      break;
    case 'Send SMS':
      Icon = LucideMessageCircle;
      bgClass = 'bg-yellow-100';
      borderClass = 'border-yellow-300';
      break;
    case 'In-app notification':
      Icon = LucideBell;
      bgClass = 'bg-pink-100';
      borderClass = 'border-pink-300';
      break;
    default:
      Icon = LucideZap;
      bgClass = 'bg-gray-100';
      borderClass = 'border-gray-300';
  }

  return (
    <div className={`rounded-xl ${bgClass} border-2 border-dashed ${borderClass} shadow-md px-4 py-3 text-sm text-black flex items-center gap-3 animate-fadeInScale`}>
      {Icon && <Icon className="w-5 h-5 text-black" />}
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{data.label}</span>
        <span className="text-[10px] text-gray-500">Action node</span>
      </div>
    </div>
  );
};

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};
