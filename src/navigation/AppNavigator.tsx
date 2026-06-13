import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { BooksScreen } from '../screens/BooksScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { MembersScreen } from '../screens/MembersScreen';
import { MemberDetailScreen } from '../screens/MemberDetailScreen';
import { LoansScreen } from '../screens/LoansScreen';
import { LoanDetailScreen } from '../screens/LoanDetailScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();
const BooksStack = createNativeStackNavigator();
const MembersStack = createNativeStackNavigator();
const LoansStack = createNativeStackNavigator();
const ReservationsStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

function BooksNavigator() {
  return (
    <BooksStack.Navigator>
      <BooksStack.Screen name="BooksList" component={BooksScreen} options={{ title: 'Books' }} />
      <BooksStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Detail' }} />
    </BooksStack.Navigator>
  );
}

function MembersNavigator() {
  return (
    <MembersStack.Navigator>
      <MembersStack.Screen name="MembersList" component={MembersScreen} options={{ title: 'Members' }} />
      <MembersStack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ title: 'Member Detail' }} />
    </MembersStack.Navigator>
  );
}

function LoansNavigator() {
  return (
    <LoansStack.Navigator>
      <LoansStack.Screen name="LoansList" component={LoansScreen} options={{ title: 'Loans' }} />
      <LoansStack.Screen name="LoanDetail" component={LoanDetailScreen} options={{ title: 'Loan Detail' }} />
    </LoansStack.Navigator>
  );
}

function ReservationsNavigator() {
  return (
    <ReservationsStack.Navigator>
      <ReservationsStack.Screen name="ReservationsList" component={ReservationsScreen} options={{ title: 'Reservations' }} />
    </ReservationsStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <MoreStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
    </MoreStack.Navigator>
  );
}

const TAB_ICONS: Record<string, string> = {
  Books: '📚',
  Members: '👥',
  Loans: '📋',
  Reservations: '🔖',
  More: '⋯',
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name] ?? '•'}</Text>,
          headerShown: false,
          tabBarLabelStyle: { fontSize: 12 },
          tabBarActiveTintColor: '#2563eb',
        })}
      >
        <Tab.Screen name="Books" component={BooksNavigator} options={{ tabBarAccessibilityLabel: 'tab-books' }} />
        <Tab.Screen name="Members" component={MembersNavigator} options={{ tabBarAccessibilityLabel: 'tab-members' }} />
        <Tab.Screen name="Loans" component={LoansNavigator} options={{ tabBarAccessibilityLabel: 'tab-loans' }} />
        <Tab.Screen name="Reservations" component={ReservationsNavigator} options={{ tabBarAccessibilityLabel: 'tab-reservations' }} />
        <Tab.Screen name="More" component={MoreNavigator} options={{ tabBarAccessibilityLabel: 'tab-more' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
