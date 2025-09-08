import { View, Text, SafeAreaView,TouchableOpacity, Modal, Pressable } from "react-native";
import RefreshScroll from "../../components/RefreshScroll";
import { Ionicons } from "@expo/vector-icons"; 
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import WeeklySchedule from '../../components/WeeklySchedule';
import WeeklySchedulePopUp from '../../components/WeeklySchedulePopUp';
import { useState } from "react";
import { ScrollView } from "react-native-gesture-handler";

export default function FitnessScreen() {
  // Global refresh hook (no custom logic needed for fitness tab)
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "fitness",
  });
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    // <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <SafeAreaView style={{flex: 1,backgroundColor: "#1a1a1a" }}>
      {/* <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}> */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 }}>
        {/* <View className="flex-1 items-center justify-center px-6 py-20"> */}
          <Text className="text-2xl font-bold text-emerald-400" style={{textAlign:"center"}}>Fitness</Text>
          <Text className="mt-2 text-neutral-400 text-center">
            Track workouts and progress here.
          </Text>
          </View>

         {/* calendar icon  */}
      <View style={{ alignItems: "flex-start", marginTop: 24, marginLeft: 30 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#4ade80",
            padding: 16,
            borderRadius: 50,
          }}
          onPress={() => setModalVisible(true)}>
          <Ionicons name="calendar-outline" size={38} color="Black" />
        </TouchableOpacity>
      </View>

      {/*  modal  */}
      <WeeklySchedulePopUp
        visible={modalVisible}
        onClose={() => setModalVisible(false)}/>
      </SafeAreaView>
 
  );
}
