const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log API URL for debugging (remove in production if needed)
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

export interface Token {
  id: number;
  token_number: number;
  counter_id: number | null;
  counter_name?: string | null;
  status: 'waiting' | 'called' | 'serving' | 'served';
  created_at: string;
  called_at: string | null;
  served_at: string | null;
}

export interface Counter {
  id: number;
  name: string;
  status: 'active' | 'closed';
  created_at: string;
}

export interface QueueStatus {
  counters: Array<{
    counter: Counter;
    nowServing: Token | null;
    nextUp: Token[];
    waitingCount: number;
  }>;
  waitingQueue: Token[];
}

export interface WaitingTime {
  estimatedMinutes: number;
  waitingCount: number;
  activeCounters: number;
  avgServiceTime: number;
}

class ApiService {
  async generateToken(): Promise<Token> {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token generation failed:', response.status, errorText);
        throw new Error(`Failed to generate token: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.token;
    } catch (error: any) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend. Please check if REACT_APP_API_URL is set correctly. Current: ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const response = await fetch(`${API_BASE_URL}/queue/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch queue status');
    }
    return response.json();
  }

  async getWaitingTime(): Promise<WaitingTime> {
    const response = await fetch(`${API_BASE_URL}/queue/waiting-time`);
    if (!response.ok) {
      throw new Error('Failed to fetch waiting time');
    }
    return response.json();
  }

  async getTokenHistory(): Promise<Token[]> {
    const response = await fetch(`${API_BASE_URL}/tokens/history/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch token history');
    }
    return response.json();
  }

  async getCounters(): Promise<Counter[]> {
    const response = await fetch(`${API_BASE_URL}/counters`);
    if (!response.ok) {
      throw new Error('Failed to fetch counters');
    }
    return response.json();
  }

  async createCounter(name: string): Promise<Counter> {
    try {
      const response = await fetch(`${API_BASE_URL}/counters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Create counter failed:', response.status, error);
        throw new Error(error.error || `Failed to create counter: ${response.status}`);
      }
      const data = await response.json();
      return data.counter;
    } catch (error: any) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend. Please check if REACT_APP_API_URL is set correctly. Current: ${API_BASE_URL}`);
      }
      throw error;
    }
  }

  async closeCounter(counterId: number): Promise<Counter> {
    const response = await fetch(`${API_BASE_URL}/counters/${counterId}/close`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to close counter');
    }
    const data = await response.json();
    return data.counter;
  }

  async reopenCounter(counterId: number): Promise<Counter> {
    const response = await fetch(`${API_BASE_URL}/counters/${counterId}/reopen`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reopen counter');
    }
    const data = await response.json();
    return data.counter;
  }

  async reassignCounter(counterId: number, newCounterId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/counters/${counterId}/reassign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newCounterId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reassign counter');
    }
  }

  async callNextToken(counterId: number): Promise<Token> {
    const response = await fetch(`${API_BASE_URL}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ counterId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to call next token');
    }
    const data = await response.json();
    return data.token;
  }

  async markTokenServing(tokenId: number): Promise<Token> {
    const response = await fetch(`${API_BASE_URL}/queue/${tokenId}/serving`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to mark token as serving');
    }
    const data = await response.json();
    return data.token;
  }

  async markTokenServed(tokenId: number): Promise<Token> {
    const response = await fetch(`${API_BASE_URL}/queue/${tokenId}/served`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to mark token as served');
    }
    const data = await response.json();
    return data.token;
  }
}

export default new ApiService();

