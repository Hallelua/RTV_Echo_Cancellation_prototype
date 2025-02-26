import React from 'react';
import { ProcessingStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface StatusIndicatorProps {
  status: ProcessingStatus;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'done':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Processing audio...';
      case 'done':
        return 'Processing complete';
      case 'error':
        return 'Error processing audio';
      default:
        return 'Ready';
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {status === 'processing' ? (
        <LoadingSpinner size="sm" />
      ) : (
        <div 
          className={`w-3 h-3 rounded-full ${
            status === 'done' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-gray-300'
          }`} 
        />
      )}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default StatusIndicator;