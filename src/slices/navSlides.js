import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  company: null,
  isAuthenticated: false,
  registerInComplete: false,
  useSessionCancel: null,
  identityAuth: null,
};

export const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {
    setCompany: (state, action) => {
      state.company = action.payload;
    },
    setAuth: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setRegisterComplete: (state, action) => {
      state.registerInComplete = action.payload;
    },
    setUseSessionCancel: (state, action) => {
      state.useSessionCancel = action.payload;
    },
    setIdentityAuth: (state, action) => {
      state.identityAuth = action.payload;
    },
  },
});

export const {
  setCompany,
  setAuth,
  setRegisterComplete,
  setUseSessionCancel,
  setIdentityAuth,
} = navSlice.actions;

// selectors
export const selectCompany = (state) => state.nav.company;
export const selectAuth = (state) => state.nav.isAuthenticated;
export const selectUseSessionCancel = (state) => state.nav.useSessionCancel;
export const selectRegisterComplete = (state) => state.nav.registerInComplete;
export const selectIdentityAuth = (state) => state.nav.identityAuth;
export default navSlice.reducer;
