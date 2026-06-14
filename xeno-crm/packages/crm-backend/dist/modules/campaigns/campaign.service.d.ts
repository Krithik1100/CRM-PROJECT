export declare const campaignService: {
    listCampaigns(): Promise<import("./campaign.repository").CampaignWithStats[]>;
    getCampaign(id: string): Promise<{
        communications: import("../communications/communication.repository").Communication[];
        stats: import("./campaign.repository").CampaignStats | null;
        segment_name?: string;
        id: string;
        name: string;
        goal?: string;
        segment_id?: string;
        channel: string;
        message_template: string;
        ai_reasoning?: string;
        status: "draft" | "sending" | "completed" | "failed";
        scheduled_at?: string;
        sent_at?: string;
        completed_at?: string;
        created_at: string;
        updated_at: string;
    }>;
    copilot(goal: string): Promise<{
        estimatedAudience: number;
        segmentDescription: string;
        filterJson: object;
        segmentName: string;
        channel: string;
        channelReasoning: string;
        messageTemplate: string;
        reasoning: string;
        campaignName: string;
    }>;
    createCampaign(data: {
        name: string;
        goal?: string;
        segment_id?: string;
        channel: string;
        message_template: string;
        ai_reasoning?: string;
    }): Promise<import("./campaign.repository").Campaign>;
    deleteCampaign(id: string): Promise<{
        deleted: boolean;
        campaignId: string;
    }>;
    launchCampaign(id: string): Promise<{
        campaignId: string;
        totalTargeted: number;
    }>;
    getOverviewStats(): Promise<Record<string, unknown> | null>;
};
//# sourceMappingURL=campaign.service.d.ts.map