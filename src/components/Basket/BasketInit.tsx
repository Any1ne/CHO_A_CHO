"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initBasket } from "@/store/slices/basketSlice";

export const BasketInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initBasket());
  }, [dispatch]);

  return null;
};