/ src/redux/slices/teacherSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTeachers = createAsyncThunk(
  'teacher/fetchTeachers',
  async ({ page = 1, limit = 10, search = '' }) => {
    const response = await api.get('/teachers', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const createTeacher = createAsyncThunk(
  'teacher/createTeacher',
  async (teacherData) => {
    const response = await api.post('/auth/register', {
      ...teacherData,
      role: 'teacher',
    });
    return response.data;
  }
);

export const updateTeacher = createAsyncThunk(
  'teacher/updateTeacher',
  async ({ id, data }) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  }
);

export const deleteTeacher = createAsyncThunk(
  'teacher/deleteTeacher',
  async (id) => {
    await api.delete(`/teachers/${id}`);
    return id;
  }
);

const teacherSlice = createSlice({
  name: 'teacher',
  initialState: {
    teachers: [],
    currentTeacher: null,
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentTeacher: (state, action) => {
      state.currentTeacher = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.teachers.unshift(action.payload.data);
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        state.teachers = state.teachers.filter((t) => t._id !== action.payload);
      });
  },
});

export const { setCurrentTeacher } = teacherSlice.actions;
export default teacherSlice.reducer;