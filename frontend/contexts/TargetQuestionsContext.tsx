import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  useTargetQuestions,
  TargetQuestion,
  UserResponse,
  UserQuestionResponse,
  UserInsight,
} from "../hooks/useTargetQuestions";

interface TargetQuestionsContextType {
  // State
  questions: TargetQuestion[];
  currentQuestionIndex: number;
  answers: { [key: number]: number };
  loading: boolean;
  error: string | null;

  // Actions
  loadQuestionsForUser: (
    userId: number
  ) => Promise<{ alreadyAnswered: boolean; timeframe?: string }>;
  saveAnswers: (userId: number) => Promise<void>;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswer: (questionId: number, answerIndex: number) => void;
  resetSession: () => void;

  // API methods
  getUserInsights: (
    userId: number,
    daysBack?: number
  ) => Promise<UserInsight[]>;
  getUserHistory: (
    userId: number,
    options?: any
  ) => Promise<UserQuestionResponse[]>;
}

const TargetQuestionsContext = createContext<
  TargetQuestionsContextType | undefined
>(undefined);

interface TargetQuestionsProviderProps {
  children: ReactNode;
}

export const TargetQuestionsProvider: React.FC<TargetQuestionsProviderProps> = ({ children }) => {
  const {
    loading,
    error,
    getQuestionsForUser,
    saveUserResponses,
    getUserResponseHistory,
    getUserInsights,
  } = useTargetQuestions();

  const [questions, setQuestions] = useState<TargetQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});

  const loadQuestionsForUser = useCallback(
    async (
      userId: number
    ): Promise<{ alreadyAnswered: boolean; timeframe?: string }> => {
      try {
        const result = await getQuestionsForUser(userId);
        setQuestions(result.questions);
        setCurrentQuestionIndex(0);
        setAnswers({});
        return {
          alreadyAnswered: result.alreadyAnswered,
          timeframe: result.timeframe,
        };
      } catch (err) {
        console.error("Failed to load questions:", err);
        // Error is handled by the hook
        return { alreadyAnswered: false };
      }
    },
    [getQuestionsForUser]
  );

  const saveAnswers = useCallback(
    async (userId: number) => {
      try {
        const responses: UserResponse[] = Object.entries(answers).map(
          ([questionId, responseValue]) => ({
            questionId: parseInt(questionId),
            responseValue,
            responseText:
              questions.find((q) => q.id === parseInt(questionId))?.options[
                responseValue
              ] || undefined,
          })
        );

        if (responses.length === 0) {
          throw new Error("No answers to save");
        }

        await saveUserResponses(userId, responses);
      } catch (err) {
        console.error("Failed to save answers:", err);
        throw err;
      }
    },
    [answers, questions, saveUserResponses]
  );

  const setAnswer = useCallback((questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  }, []);

  const resetSession = useCallback(() => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
  }, []);

  const getUserHistory = useCallback(
    async (userId: number, options?: any) => {
      return getUserResponseHistory(userId, options);
    },
    [getUserResponseHistory]
  );

  const getInsights = useCallback(
    async (userId: number, daysBack = 30) => {
      return getUserInsights(userId, daysBack);
    },
    [getUserInsights]
  );

  const value: TargetQuestionsContextType = {
    // State
    questions,
    currentQuestionIndex,
    answers,
    loading,
    error,

    // Actions
    loadQuestionsForUser,
    saveAnswers,
    setCurrentQuestionIndex,
    setAnswer,
    resetSession,

    // API methods
    getUserInsights: getInsights,
    getUserHistory,
  };

  return (
    <TargetQuestionsContext.Provider value={value}>
      {children}
    </TargetQuestionsContext.Provider>
  );
};

export const useTargetQuestionsContext = () => {
  const context = useContext(TargetQuestionsContext);
  if (context === undefined) {
    throw new Error(
      "useTargetQuestionsContext must be used within a TargetQuestionsProvider"
    );
  }
  return context;
};
