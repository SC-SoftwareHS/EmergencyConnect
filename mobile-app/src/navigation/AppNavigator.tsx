import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { COLORS } from '../config';

// Import screen components (we'll create these next)
import SimplifiedLoginScreen from '../screens/SimplifiedLoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import IncidentsScreen from '../screens/IncidentsScreen';
import IncidentDetailScreen from '../screens/IncidentDetailScreen';
import IncidentReportScreen from '../screens/IncidentReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Main tab navigator for authenticated users
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Incidents') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }
          
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.dark,
        tabBarStyle: {
          elevation: 5,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Incidents" component={IncidentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Stack for alert details
const AlertsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: 'Alert Details' }} />
    </Stack.Navigator>
  );
};

// Stack for incident management
const IncidentsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="Incidents" component={IncidentsScreen} />
      <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} options={{ title: 'Incident Details' }} />
      <Stack.Screen name="IncidentReport" component={IncidentReportScreen} options={{ title: 'Report Incident' }} />
    </Stack.Navigator>
  );
};

// Root navigator with authentication
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false
        }}
      >
        {/* Authentication Screen */}
        <Stack.Screen name="SimplifiedLogin" component={SimplifiedLoginScreen} />
        
        {/* Main App */}
        <Stack.Screen name="Dashboard" component={MainTabNavigator} />
        
        {/* Detail Screens */}
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
        <Stack.Screen name="IncidentDetail" component={IncidentDetailScreen} />
        <Stack.Screen name="IncidentReport" component={IncidentReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;