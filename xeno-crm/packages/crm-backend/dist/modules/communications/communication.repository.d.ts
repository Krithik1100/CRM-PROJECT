export interface Communication {
    id: string;
    campaign_id: string;
    customer_id: string;
    channel: string;
    recipient: string;
    message: string;
    status: string;
    idempotency_key: string;
    sent_at?: string;
    created_at: string;
    updated_at: string;
}
export interface CommunicationEvent {
    id: string;
    communication_id: string;
    event_type: string;
    event_data: Record<string, unknown>;
    idempotency_key: string;
    received_at: string;
}
export declare const communicationRepository: {
    createBatch(communications: Array<Omit<Communication, "id" | "created_at" | "updated_at">>): Promise<Communication[]>;
    findById(id: string): Promise<Communication | null>;
    updateStatus(id: string, status: string): Promise<void>;
    recordEvent(data: {
        communication_id: string;
        event_type: string;
        event_data?: Record<string, unknown>;
        idempotency_key: string;
    }): Promise<boolean>;
    getByCampaign(campaignId: string, limit?: number): Promise<Communication[]>;
};
//# sourceMappingURL=communication.repository.d.ts.map