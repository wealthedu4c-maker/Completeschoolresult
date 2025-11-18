// src/redux/slices/pinSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchPINs = createAsyncThunk(
  'pin/fetchPINs',
  async ({ page = 1, limit = 10, session = '', term = '' }) => {
    const response = await api.get('/pins', {
      params: { page, limit, session, term },
    });
    return response.data;
  }
);

export const generatePINs = createAsyncThunk(
  'pin/generatePINs',
  async (pinData) => {
    const response = await api.post('/pins', pinData);
    return response.data;
  }
);

export const deletePIN = createAsyncThunk(
  'pin/deletePIN',
  async (id) => {
    await api.delete(`/pins/${id}`);
    return id;
  }
);

const pinSlice = createSlice({
  name: 'pin',
  initialState: {
    pins: [],
    pagination: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPINs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPINs.fulfilled, (state, action) => {
        state.loading = false;
        state.pins = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPINs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(generatePINs.fulfilled, (state, action) => {
        state.pins = [...action.payload.data, ...state.pins];
      })
      .addCase(deletePIN.fulfilled, (state, action) => {
        state.pins = state.pins.filter((p) => p._id !== action.payload);
      });
  },
});

export default pinSlice.reducer;