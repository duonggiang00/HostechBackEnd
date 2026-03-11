
export interface IOpenTypeStore {
  open: boolean;
  openForm: boolean;
  openModalSetting: boolean;
  openRegister: boolean;
  eyePassword: boolean;
  setOpen: (open: boolean) => void;
  setOpenForm: (openForm: boolean) => void;
  setOpenModalSetting: (openModalSetting: boolean) => void;
  setOpenRegister: (openRegister: boolean) => void;
  setEyePassword: (eyePassword: boolean) => void;
}

export interface IPageStore {
  pages: number;
  pageSizes: number;
  setPage: (pages: number) => void;
  setPageSize: (pageSizes: number) => void;
}

export interface IOpenMenu {
  openMenu1: boolean;
  openMenu2: boolean;
  openMenu3: boolean;
  setOpenMenu1: (openMenu1: boolean) => void;
  setOpenMenu2: (openMenu2: boolean) => void;
  setOpenMenu3: (openMenu3: boolean) => void;
}

export interface ITokenStore {
  token: string;
  role: string | null;
  isLoading: boolean;
  setToken: (token: string, role?: string) => void;
  restoreToken: () => void;
  getRole: () => string | null;
  getToken: () => string | null;
  clearToken: () => void;
}
