export declare const aiService: {
    parseSegmentQuery(naturalLanguageQuery: string): Promise<{
        filterJson: object;
        segmentName: string;
        description: string;
        sqlPreview: string;
    }>;
    generateCampaignRecommendation(goal: string, customerStats: object): Promise<{
        segmentDescription: string;
        filterJson: object;
        segmentName: string;
        channel: string;
        channelReasoning: string;
        messageTemplate: string;
        reasoning: string;
        campaignName: string;
    }>;
    personalizeMessage(template: string, customer: {
        name: string;
        city?: string;
        last_order_at?: string;
        total_spent?: number;
    }): Promise<string>;
};
//# sourceMappingURL=ai.service.d.ts.map