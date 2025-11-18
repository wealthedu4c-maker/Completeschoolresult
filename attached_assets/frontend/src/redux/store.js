// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import schoolReducer from './slices/schoolSlice';
import teacherReducer from './slices/teacherSlice';
import studentReducer from './slices/studentSlice';
import resultReducer from './slices/resultSlice';
import pinReducer from './slices/pinSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    school: schoolReducer,
    teacher: teacherReducer,
    student: studentReducer,
    result: resultReducer,
    pin: pinReducer,
  },
});