@@ .. @@
-import React, { useEffect, useState } from 'react';
 import React, { useEffect, useState, useRef } from 'react';
 import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
 import { SafeAreaView } from 'react-native-safe-area-context';
 import { useAuth } from '../context/AuthContext';