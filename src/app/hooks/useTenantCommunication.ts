import { useState } from 'react';
import * as api from '@/lib/apiService';

export const useTenantCommunication = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = async (tenantId) => {
    setLoading(true);
    try {
      const data = await api.fetchMessages(tenantId);
      setMessages(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (tenantId, message) => {
    setLoading(true);
    try {
      await api.sendMessage(tenantId, message);
      setMessages((prev) => [...prev, { tenantId, message }]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
  };
};