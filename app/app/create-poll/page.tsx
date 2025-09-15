'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useCreatePoll } from '../../hooks/useCreatePoll';
import { Plus, Trash2, Calendar, Clock, DollarSign } from 'lucide-react';
import NotificationToast from '../../components/NotificationToast';

export default function CreatePollPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { createPoll, isCreating, creationFee, hash, isConfirmed, error } = useCreatePoll();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    startTime: '',
    endTime: '',
  });

  // Toast notifications state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    transactionHash?: string;
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  // Toast notification handlers
  useEffect(() => {
    if (hash && !isConfirmed) {
      setToast({
        show: true,
        message: `Transaction submitted! Hash: ${hash.slice(0, 10)}...`,
        type: 'info',
        transactionHash: hash
      });
    }
  }, [hash, isConfirmed]);

  useEffect(() => {
    if (isConfirmed) {
      setToast({
        show: true,
        message: 'Poll created successfully! Redirecting... 🎉',
        type: 'success'
      });
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [isConfirmed, router]);

  useEffect(() => {
    if (error) {
      setToast({
        show: true,
        message: `Error: ${error.message}`,
        type: 'error'
      });
    }
  }, [error]);

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };


  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startTimestamp = new Date(formData.startTime).getTime();
      const endTimestamp = new Date(formData.endTime).getTime();
      
      await createPoll({
        title: formData.title,
        description: formData.description,
        options: formData.options.filter(opt => opt.trim()),
        startTime: startTimestamp,
        endTime: endTimestamp,
      });
      
      // Don't redirect here - wait for transaction confirmation
    } catch (error) {
      console.error('Error creating poll:', error);
      // TODO: Show error toast
    }
  };

  const isValid = 
    formData.title.trim() &&
    formData.description.trim() &&
    formData.options.every(opt => opt.trim()) &&
    formData.startTime &&
    formData.endTime &&
    new Date(formData.startTime) > new Date() &&
    new Date(formData.endTime) > new Date(formData.startTime);

  if (!isConnected) {
    return (
      <div className="flex justify-center py-12">
        <div className="card-zama-highlight max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-4">🔒 Wallet Connection Required</h2>
          <p className="text-sm text-yellow-400">You need to connect your wallet to create polls</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-2 sm:px-4">
      {/* Responsive Header */}
      <div className="mb-6 md:mb-8 lg:mb-12 text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-zama mb-2 md:mb-4">
          Create New Poll
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-400">
          Create a confidential voting poll with FHEVM encryption
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* No image upload - keep it simple */}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Poll Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="input-zama w-full"
            placeholder="Enter poll title..."
            maxLength={100}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.title.length}/100 characters
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input-zama w-full h-24 resize-none"
            placeholder="Describe what this poll is about..."
            maxLength={500}
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Voting Options * (2-10 options)
          </label>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="input-zama w-full pl-8"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full text-xs flex items-center justify-center text-black font-bold">
                    {index + 1}
                  </div>
                </div>
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            
            {formData.options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            )}
          </div>
        </div>

        {/* Timing */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="input-zama w-full"
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              End Time *
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="input-zama w-full"
              min={formData.startTime || new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
        </div>

        {/* Fee Warning */}
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 text-yellow-300 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">💰 Creation Fee Required</h4>
          <p className="text-sm mb-2">
            Creating this poll will cost <strong>{creationFee ? `${creationFee} ETH` : '0.001 ETH'}</strong> to prevent spam.
          </p>
          <p className="text-xs text-yellow-200">
            ⚠️ Once created, poll parameters cannot be changed. You can reveal results after voting ends.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 btn-zama-outline py-3"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isCreating}
            className="flex-1 btn-zama-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                {hash ? 'Confirming...' : 'Creating...'}
              </div>
            ) : (
              `Create Poll (${creationFee} ETH)`
            )}
          </button>
        </div>
      </form>
      
      <NotificationToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
        duration={toast.type === 'error' ? 8000 : 5000}
        transactionHash={toast.transactionHash}
      />
    </div>
  );
}