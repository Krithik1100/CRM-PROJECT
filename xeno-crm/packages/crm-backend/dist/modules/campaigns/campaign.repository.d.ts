export interface Campaign {
    id: string;
    name: string;
    goal?: string;
    segment_id?: string;
    channel: string;
    message_template: string;
    ai_reasoning?: string;
    status: 'draft' | 'sending' | 'completed' | 'failed';
    scheduled_at?: string;
    sent_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
}
export interface CampaignStats {
    campaign_id: string;
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    total_opened: number;
    total_read: number;
    total_clicked: number;
    total_purchased: number;
    revenue_attributed: number;
    updated_at: string;
}
export interface CampaignWithStats extends Campaign {
    stats: CampaignStats | null;
    segment_name?: string;
}
export declare const campaignRepository: {
    findAll(): Promise<CampaignWithStats[]>;
    findById(id: string): Promise<CampaignWithStats | null>;
    create(data: Partial<Campaign>): Promise<Campaign>;
    updateStatus(id: string, status: string, extra?: Partial<Campaign>): Promise<void>;
    delete(id: string): Promise<boolean>;
    incrementStat(campaignId: string, field: string, amount?: number): Promise<void>;
    addRevenue(campaignId: string, amount: number): Promise<void>;
    getOverviewStats(): Promise<Record<string, unknown> | null>;
};
//# sourceMappingURL=campaign.repository.d.ts.map