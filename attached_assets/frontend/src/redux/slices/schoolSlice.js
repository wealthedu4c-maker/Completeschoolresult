// src/redux/slices/schoolSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSchools = createAsyncThunk(
  'school/fetchSchools',
  async ({ page = 1, limit = 10, search = '' }) => {
    const response = await api.get('/schools', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const createSchool = createAsyncThunk(
  'school/createSchool',
  async (schoolData) => {
    const response = await api.post('/schools', schoolData);
    return response.data;
  }
);

export const updateSchool = createAsyncThunk(
  'school/updateSchool',
  async ({ id, data }) => {
    const response = await api.put(`/schools/${id}`, data);
    return response.data;
  }
);

export const deleteSchool = createAsyncThunk(
  'school/deleteSchool',
  async (id) => {
    await api.delete(`/schools/${id}`);
    return id;
  }
);

const schoolSlice = createSlice({
  name: 'school',
  initialState: {
    schools: [],
    currentSchool: null,
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentSchool: (state, action) => {
      state.currentSchool = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchools.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSchools.fulfilled, (state, action) => {
        state.loading = false;
        state.schools = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSchools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createSchool.fulfilled, (state, action) => {
        state.schools.unshift(action.payload.data);
      })
      .addCase(deleteSchool.fulfilled, (state, action) => {
        state.schools = state.schools.filter((s) => s._id !== action.payload);
      });
  },
});

export const { setCurrentSchool } = schoolSlice.actions;
export default schoolSlice.reducer;