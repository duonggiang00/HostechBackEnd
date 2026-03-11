import type { ReactNode } from "react";

export type TGlobalProp<T = {}> = {
  children: ReactNode;
} & T;
