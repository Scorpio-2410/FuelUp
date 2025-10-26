// hooks/useTargetQuestions.tsx
import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { BASE_URL as API_BASE_URL, K_TOKEN } from "@/constants/api";

interface QuestionOption {
  text: string;
  value: number;
}

interface SliderConfig {
  emojis: string[];
  feedbackTexts: string[];
  minValue: number;
  maxValue: number;
}

export interface TargetQuestion {
  id: number;
  type: "daily" | "weekly" | "monthly";
  text: string;
  priority: "high" | "medium" | "low";
  frequency: "mandatory" | "rotational" | "optional" | "occasional" | "rare";
  options: string[];
  isSlider: boolean;
  sliderConfig?: SliderConfig;
  category: string;
  influenceWeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  questionId: number;
  responseValue: number;
  responseText?: string;
}

export interface UserQuestionResponse {
  id: number;
  userId: number;
  questionId: number;
  responseValue: number;
  responseText?: string;
  askedAt: string;
  createdAt: string;
}

export interface UserInsight {
  question_text: string;
  category: string;
  question_type: string;
  avg_response: number;
  response_count: number;
  last_response_date: string;
}

interface QuestionsResponse {
  success: boolean;
  data: TargetQuestion[];
  userFrequency: string;
  totalQuestions: number;
  alreadyAnswered?: boolean;
  timeframe?: string;
}

interface ResponsesResponse {
  success: boolean;
  data: UserQuestionResponse[];
  message: string;
}

interface InsightsResponse {
  success: boolean;
  data: UserInsight[];
  message: string;
}

export const useTargetQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = useCallback(async () => {
    try {
      return await SecureStore.getItemAsync(K_TOKEN);
    } catch (err) {
      console.error("Error getting auth token:", err);
      return null;
    }
  }, []);

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getAuthToken();

      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      // Auto-clear token on 401 so app can route to login gracefully
      if (response.status === 401) {
        try {
          await SecureStore.deleteItemAsync(K_TOKEN);
        } catch {}
        const err = new Error("Session expired. Please sign in again.");
        // surface a consistent message to the UI
        throw err;
      }

      if (!response.ok) {
        // Try to extract a useful error message from JSON
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error ${response.status}` }));
        const msg =
          errorData?.error ||
          errorData?.message ||
          `HTTP error ${response.status}`;
        throw new Error(msg);
      }

      return response.json();
    },
    [getAuthToken]
  );

  const getQuestionsForUser = useCallback(
    async (
      userId: number
    ): Promise<{
      questions: TargetQuestion[];
      alreadyAnswered: boolean;
      timeframe?: string;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const data: QuestionsResponse = await makeAuthenticatedRequest(
          `/api/questions/user/${userId}`
        );
        return {
          questions: data.data,
          alreadyAnswered: data.alreadyAnswered ?? false,
          timeframe: data.timeframe,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch questions";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [makeAuthenticatedRequest]
  );

  const saveUserResponses = useCallback(
    async (
      userId: number,
      responses: UserResponse[]
    ): Promise<UserQuestionResponse[]> => {
      setLoading(true);
      setError(null);

      try {
        const data: ResponsesResponse = await makeAuthenticatedRequest(
          `/api/questions/user/${userId}/responses`,
          {
            method: "POST",
            body: JSON.stringify({ responses }),
          }
        );
        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save responses";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [makeAuthenticatedRequest]
  );

  const getUserResponseHistory = useCallback(
    async (
      userId: number,
      options?: {
        questionId?: number;
        limit?: number;
        offset?: number;
        daysBack?: number;
      }
    ): Promise<UserQuestionResponse[]> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.questionId)
          params.append("questionId", String(options.questionId));
        if (options?.limit) params.append("limit", String(options.limit));
        if (options?.offset) params.append("offset", String(options.offset));
        if (options?.daysBack)
          params.append("daysBack", String(options.daysBack));

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const data: ResponsesResponse = await makeAuthenticatedRequest(
          `/api/questions/user/${userId}/history${queryString}`
        );
        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch response history";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [makeAuthenticatedRequest]
  );

  const getUserInsights = useCallback(
    async (userId: number, daysBack = 30): Promise<UserInsight[]> => {
      setLoading(true);
      setError(null);

      try {
        const data: InsightsResponse = await makeAuthenticatedRequest(
          `/api/questions/user/${userId}/insights?daysBack=${daysBack}`
        );
        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user insights";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [makeAuthenticatedRequest]
  );

  const getQuestionsByType = useCallback(
    async (
      type: "daily" | "weekly" | "monthly",
      options?: {
        priority?: string;
        frequency?: string;
        limit?: number;
        offset?: number;
      }
    ): Promise<TargetQuestion[]> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.priority) params.append("priority", options.priority);
        if (options?.frequency) params.append("frequency", options.frequency);
        if (options?.limit) params.append("limit", String(options.limit));
        if (options?.offset) params.append("offset", String(options.offset));

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const data: QuestionsResponse = await makeAuthenticatedRequest(
          `/api/questions/type/${type}${queryString}`
        );
        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch questions by type";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [makeAuthenticatedRequest]
  );

  const getAllQuestions = useCallback(
    async (options?: {
      type?: string;
      priority?: string;
      frequency?: string;
      limit?: number;
      offset?: number;
    }): Promise<TargetQuestion[]> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options?.type) params.append("type", options.type);
        if (options?.priority) params.append("priority", options.priority);
        if (options?.frequency) params.append("frequency", options.frequency);
        if (options?.limit) params.append("limit", String(options.limit));
        if (options?.offset) params.append("offset", String(options.offset));

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const data: QuestionsResponse = await makeAuthenticatedRequest(
          `/api/questions${queryString}`
        );
        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch all questions";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [makeAuthenticatedRequest]
  );

  return {
    loading,
    error,
    getQuestionsForUser,
    saveUserResponses,
    getUserResponseHistory,
    getUserInsights,
    getQuestionsByType,
    getAllQuestions,
  };
};
