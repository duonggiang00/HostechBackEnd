export interface ILogin {
  email: string;
  password: string;
}

export interface ILoginResponse {
  org_id: string;
  session_id: string;
  otp_ttl: number;
  otp_method: "email" | "sms";
  dev_otp?: string;
}

export interface IOtpVerify {
  otp: string;
}

export interface IDecodeJWT {
  iss: string;
  iat: number;
  exp: number;
  sub: string;
  user: {
    id: string;
    org_id: string;
    email: string;
    phone: string;
    name: string;
    is_active: boolean;
    roles: string[];
    permissions: string[];
  };
  property_roles: Array<{
    property_id: string;
    role: string;
    permissions: string[];
  }>;
  session_id: string;
}

export interface IMe {
  full_name: string;
  org_id: string;
  role: string;
  phone: string;
  email: string;
}
