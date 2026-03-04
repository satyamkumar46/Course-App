import { Stack } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="courses"
        options={{
          title: "Courses",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: true,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="bookmarks"
        options={{
          title: "Bookmarks",
          headerShown: true,
        }}
      />
      <Stack.Screen name="explore" />
    </Stack>
  );
}
