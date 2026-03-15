export type HandoverType = "CHECK_IN" | "CHECK_OUT";
export type HandoverStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Handover {
    id: string;
    contract_id: string;
    type: HandoverType;
    status: HandoverStatus;
    handover_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    contract?: {
        id: string;
        code: string;
    };
    room?: {
        id: string;
        name: string;
    };
}

export interface HandoverItem {
    id: string;
    handover_id: string;
    name: string;
    category: string | null;
    status: "GOOD" | "DAMAGED" | "MISSING";
    note: string | null;
}

export interface HandoverMeterSnapshot {
    id: string;
    handover_id: string;
    meter_id: string;
    reading_value: number;
    reading_date: string;
    meter_name?: string;
}
