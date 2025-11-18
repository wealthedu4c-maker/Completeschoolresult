// src/redux/slices/resultSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchResults = createAsyncThunk(
  'result/fetchResults',
  async ({ page = 1, limit = 10, session = '', term = '', status = '' }) => {
    const response = await api.get('/results', {
      params: { page, limit, session, term, status },
    });
    return response.data;
  }
);

export const createResult = createAsyncThunk(
  'result/createResult',
  async (resultData) => {
    const response = await api.post('/results', resultData);
    return response.data;
  }
);

export const updateResult = createAsyncThunk(
  'result/updateResult',
  async ({ id, data }) => {
    const response = await api.put(`/results/${id}`, data);
    return response.data;
  }
);

export const submitResult = createAsyncThunk(
  'result/submitResult',
  async (id) => {
    const response = await api.patch(`/results/${id}/submit`);
    return response.data;
  }
);

export const approveResult = createAsyncThunk(
  'result/approveResult',
  async (id) => {
    const response = await api.patch(`/results/${id}/approve`);
    return response.data;
  }
);

export const rejectResult = createAsyncThunk(
  'result/rejectResult',
  async ({ id, reason }) => {
    const response = await api.patch(`/results/${id}/reject`, { reason });
    return response.data;
  }
);

const resultSlice = createSlice({
  name: 'result',
  initialState: {
    results: [],
    currentResult: null,
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentResult: (state, action) => {
      state.currentResult = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createResult.fulfilled, (state, action) => {
        state.results.unshift(action.payload.data);
      });
  },
});

export const { setCurrentResult } = resultSlice.actions;
export default resultSlice.reducer;
