import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, SafeAreaView, Modal, TextInput, Switch } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TaskModal from "./taskModal";


export default function WeeklySchedule() {
  const [selected, setSelected] = useState("2025-09-02");
  const [modalVisible, setModalVisible] = useState(false);
  const [tasksByDate, setTasksByDate] = useState<Record<string, any[]>>({});
  const [newEvent, setNewEvent] = useState({
    title: "",
    subtitle: "",
    date: selected,
    start: "",
    end: "",
    color: "#B3FF6E",
  });

  //load stored data when refreshing app 
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const stored = await AsyncStorage.getItem("tasksByDate");
        if (stored) {
          setTasksByDate(JSON.parse(stored));
        }
      } catch (e) {
        console.log("Error loading tasks", e);
      }
    };
    loadTasks();
  }, []);
  //save tasks whenever they change
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
      } catch (e) {
        console.log("Error saving tasks", e);
      }
    };
    saveTasks();
  }, [tasksByDate]);

  const tasksForDay = tasksByDate[selected] || [];

  const handleCreateEvent = () => {
    if (!newEvent.title) return;   

    setTasksByDate((prev) => {
      const updated = { ...prev };
      if (!updated[selected]) updated[selected] = [];
      updated[selected].push({
        id: Date.now().toString(),
        // time: `${newEvent.start}-${newEvent.end}`,
        time: `${startTime}-${endTime}`,
        title: newEvent.title,
        subtitle: newEvent.subtitle,
        color: newEvent.color, });
      return updated;});

    setNewEvent({
      title: "",
      subtitle: "",
      date: selected,
      start: "",
      end: "",
      color: "#B3FF6E",
    });
    // setModalVisible(false);};
    setStartTime("08:00");
    setEndTime("08:00");
    setModalVisible(false);};

    const handleDeleteTask = (taskId: string) => {
      setTasksByDate((prev) => {
        const updated = { ...prev };
        updated[selected] = updated[selected].filter((task) => task.id !== taskId);
        if (updated[selected].length === 0) delete updated[selected];
        return updated;
      });
    };

      //marked dates for the calendar 
    const markedDates: Record<string, any> = {
      ...Object.keys(tasksByDate).reduce((acc, date) => {
        acc[date] = {
          marked: tasksByDate[date].length > 0,
          dots: [{ color: "#F9FF6E" }],
        };
        return acc;
      }, {} as Record<string, any>),
      [selected]: {
        selected: true,
        selectedColor: "#4ade80", 
        selectedTextColor: "black",
      },
    };

    //time dropdowns 
    const generateTimes = () => {
      const times = [];
      for (let h = 8; h <= 23; h++) {
        const hourStr = h.toString().padStart(2, "0");
        times.push({ label: `${hourStr}:00`, value: `${hourStr}:00` });
      }
      return times;
    };
    
    const [items, setItems] = useState(generateTimes());
    const [startTime, setStartTime] = useState("08:00");
    const [open, setOpen] = useState(false);

    const [openEnd, setOpenEnd] = useState(false);
    const [endTime, setEndTime] = useState("08:00");

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: "black"}}>
      <View style={{flex:1, backgroundColor: "black"}}>

      <View style={{alignItems: "center", paddingVertical: 24}}>
        <Text style={{color: "white", fontSize: 28, fontWeight: "800", textAlign: "center"}}>Weekly Schedule</Text>
      </View>

      {/* Calendar */}
      <Calendar
        theme={{
          calendarBackground: "black",
          dayTextColor: "white",
          monthTextColor: "#B3FF6E",
          textMonthFontWeight: "bold",
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
          textSectionTitleColor: "#B3FF6E",
          arrowColor: "white",
          textDisabledColor: "gray",
          todayTextColor: "#F9FF6E",
          selectedDayBackgroundColor: "#F9FF6E",
          selectedDayTextColor: "black",
        }}
        style={{height: 380}}
        current={selected}
        onDayPress={(day) => setSelected(day.dateString)}
          markedDates={markedDates}
          markingType={"multi-dot"}/>

      {/* Tasks List */}
      <FlatList
        data={tasksForDay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{color: "white", textAlign: "center", marginTop: 8, fontSize: 16}}>
            No tasks scheduled for this day
          </Text>}
        renderItem={({ item }) => (
          <View
          style={{ backgroundColor: item.color, padding: 20, borderRadius: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "black", fontWeight: "600", fontSize: 12 }}>
                {item.time}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => handleDeleteTask(item.id)} style={{ marginRight: 8 }}>
                  <Ionicons name="trash-outline" size={20} color="black" />
                </TouchableOpacity>
                {/* <TouchableOpacity> */}
                  {/* <Ionicons name="ellipsis-horizontal" size={20} color="black" /> */}
                {/* </TouchableOpacity> */}
              </View>
            </View>
            <Text style={{ color: "black", fontWeight: "500", marginTop: 4, fontSize: 20 }}>
              {item.title}
            </Text>
            <Text style={{ color: "black", fontWeight: "500", marginTop: 4, fontSize: 16 }}>
              {item.subtitle}
            </Text>
          </View>
          )}/>



      {/* Tasks Add Button */}
        <View style={{position: "absolute", bottom: 80, alignSelf: "center"}}>
        <TouchableOpacity style={{backgroundColor: "#4ade80", width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent:"center",}}
          onPress={()=> setModalVisible(true)}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
      </View>          
       

      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        open={open}
        setOpen={setOpen}
        openEnd={openEnd}
        setOpenEnd={setOpenEnd}
        items={items}
        setItems={setItems}/>
    </SafeAreaView>
  );
}
