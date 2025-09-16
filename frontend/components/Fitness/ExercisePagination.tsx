import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ExercisePaginationProps {
  currentPage: number;
  totalPages: number;
  totalExercises: number;
  exercisesPerPage: number;
  onPageChange: (page: number) => void;
}

export default function ExercisePagination({
  currentPage,
  totalPages,
  totalExercises,
  exercisesPerPage,
  onPageChange,
}: ExercisePaginationProps) {
  if (totalExercises === 0) return null;

  const startIndex = currentPage * exercisesPerPage;
  const endIndex = startIndex + exercisesPerPage;

  return (
    <View>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 20,
            gap: 16,
          }}
        >
          {/* Previous Button */}
          <TouchableOpacity
            onPress={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              backgroundColor: currentPage === 0 ? "#3a3a3a" : "#4ade80",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              opacity: currentPage === 0 ? 0.5 : 1,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentPage === 0 ? "#a1a1aa" : "#0a0a0a"}
            />
          </TouchableOpacity>

          {/* Page Indicator */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => onPageChange(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentPage ? "#4ade80" : "#3a3a3a",
                }}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={() =>
              onPageChange(Math.min(totalPages - 1, currentPage + 1))
            }
            disabled={currentPage === totalPages - 1}
            style={{
              backgroundColor:
                currentPage === totalPages - 1 ? "#3a3a3a" : "#4ade80",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              opacity: currentPage === totalPages - 1 ? 0.5 : 1,
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentPage === totalPages - 1 ? "#a1a1aa" : "#0a0a0a"}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Page Info */}
      <Text
        style={{
          color: "#a1a1aa",
          textAlign: "center",
          marginTop: 12,
          fontSize: 14,
        }}
      >
        Showing {startIndex + 1}-{Math.min(endIndex, totalExercises)} of{" "}
        {totalExercises} exercises
      </Text>
    </View>
  );
}
