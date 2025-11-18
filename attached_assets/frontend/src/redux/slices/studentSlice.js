// src/redux/slices/studentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchStudents = createAsyncThunk(
  'student/fetchStudents',
  async ({ page = 1, limit = 10, search = '', class: className = '' }) => {
    const response = await api.get('/students', {
      params: { page, limit, search, class: className },
    });
    return response.data;
  }
);

export const createStudent = createAsyncThunk(
  'student/createStudent',
  async (studentData) => {
    const response = await api.post('/students', studentData);
    return response.data;
  }
);

export const bulkUploadStudents = createAsyncThunk(
  'student/bulkUpload',
  async (students) => {
    const response = await api.post('/students/bulk-upload', { students });
    return response.data;
  }
);

export const updateStudent = createAsyncThunk(
  'student/updateStudent',
  async ({ id, data }) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  }
);

export const deleteStudent = createAsyncThunk(
  'student/deleteStudent',
  async (id) => {
    await api.delete(`/students/${id}`);
    return id;
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState: {
    students: [],
    currentStudent: null,
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentStudent: (state, action) => {
      state.currentStudent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.students.unshift(action.payload.data);
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter((s) => s._id !== action.payload);
      });
  },
});

export const { setCurrentStudent } = studentSlice.actions;
export default studentSlice.reducer;