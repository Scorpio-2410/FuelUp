import { useCallback } from "react";
import { useTargetQuestions } from "./useTargetQuestions";
// import { useAuth } from '../contexts/AuthContext'; // Uncomment when auth context is available

/**
 * Enhanced hook that integrates Target Questions with the authentication system
 * This is an example of how to integrate with your existing auth system
 */
export const useAuthIntegratedTargetQuestions = () => {
  const {
    loading,
    error,
    getQuestionsForUser,
    saveUserResponses,
    getUserResponseHistory,
    getUserInsights,
    getQuestionsByType,
    getAllQuestions,
  } = useTargetQuestions();

  // TODO: Uncomment and implement based on your auth system
  // const { user, token } = useAuth();

  // Mock user for demo - replace with actual auth user
  const getCurrentUser = useCallback(() => {
    // TODO: Replace with actual auth user
    // return user;
    return { id: 1, email: "demo@example.com" }; // Mock user
  }, []);

  const getAuthToken = useCallback(() => {
    // TODO: Replace with actual token from auth context
    // return token;
    return null; // Mock - no token needed for demo
  }, []);

  const getMyQuestions = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    return getQuestionsForUser(user.id);
  }, [getCurrentUser, getQuestionsForUser]);

  const saveMyResponses = useCallback(
    async (responses: any[]) => {
      const user = getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      return saveUserResponses(user.id, responses);
    },
    [getCurrentUser, saveUserResponses]
  );

  const getMyResponseHistory = useCallback(
    async (options?: any) => {
      const user = getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      return getUserResponseHistory(user.id, options);
    },
    [getCurrentUser, getUserResponseHistory]
  );

  const getMyInsights = useCallback(
    async (daysBack = 30) => {
      const user = getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      return getUserInsights(user.id, daysBack);
    },
    [getCurrentUser, getUserInsights]
  );

  const updateUserQuestionFrequency = useCallback(
    async (frequency: "daily" | "weekly" | "monthly") => {
      const user = getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      // TODO: Implement API call to update user's follow_up_frequency
      // This would typically be part of your user profile update endpoint
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/users/${user.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(getAuthToken() && {
                Authorization: `Bearer ${getAuthToken()}`,
              }),
            },
            body: JSON.stringify({ follow_up_frequency: frequency }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update question frequency");
        }

        return response.json();
      } catch (error) {
        console.error("Error updating question frequency:", error);
        throw error;
      }
    },
    [getCurrentUser, getAuthToken]
  );

  return {
    // State
    loading,
    error,
    currentUser: getCurrentUser(),

    // User-specific methods (automatically use authenticated user)
    getMyQuestions,
    saveMyResponses,
    getMyResponseHistory,
    getMyInsights,
    updateUserQuestionFrequency,

    // Admin methods (still require explicit user ID)
    getQuestionsForUser,
    saveUserResponses,
    getUserResponseHistory,
    getUserInsights,
    getQuestionsByType,
    getAllQuestions,
  };
};

// Example usage component
export const ExampleUsage = () => {
  const {
    loading,
    error,
    currentUser,
    getMyQuestions,
    saveMyResponses,
    getMyInsights,
    updateUserQuestionFrequency,
  } = useAuthIntegratedTargetQuestions();

  const handleLoadQuestions = async () => {
    try {
      const questions = await getMyQuestions();
      console.log("Loaded questions for user:", currentUser?.id, questions);
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

  const handleSaveResponses = async () => {
    try {
      const responses = [
        { questionId: 1, responseValue: 2, responseText: "Cardio" },
        { questionId: 2, responseValue: 4 },
      ];

      await saveMyResponses(responses);
      console.log("Responses saved successfully");
    } catch (err) {
      console.error("Failed to save responses:", err);
    }
  };

  const handleGetInsights = async () => {
    try {
      const insights = await getMyInsights(30);
      console.log("User insights:", insights);
    } catch (err) {
      console.error("Failed to get insights:", err);
    }
  };

  const handleUpdateFrequency = async () => {
    try {
      await updateUserQuestionFrequency("weekly");
      console.log("Question frequency updated to weekly");
    } catch (err) {
      console.error("Failed to update frequency:", err);
    }
  };

  // Component JSX would go here
  return null;
};
