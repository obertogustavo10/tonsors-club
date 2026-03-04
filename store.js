import { configureStore } from "@reduxjs/toolkit";
import NavReducer from "./src/slices/navSlides";

export const store = configureStore({
  reducer: {
    nav: NavReducer,
  },
});
