const bizSdk = require('facebook-nodejs-business-sdk');
const axios = require('axios');
const fs = require('fs');

const accessToken = process.env.FB_ACCESS_TOKEN;
const adAccountId = process.env.FB_AD_ACCOUNT_ID;
const pageId = process.env.FB_PAGE_ID;

let api = null;
if (accessToken) {
    api = bizSdk.FacebookAdsApi.init(accessToken);
    api.setDebug(true);
}

const AdAccount = bizSdk.AdAccount;
const AdVideo = bizSdk.AdVideo;
const AdCreative = bizSdk.AdCreative;
const Ad = bizSdk.Ad;
const Campaign = bizSdk.Campaign;

async function checkConfig() {
    if (!accessToken || !adAccountId) {
        throw new Error("Facebook API not configured in .env");
    }
}

async function listCampaigns() {
    await checkConfig();
    try {
        const account = new AdAccount(adAccountId);
        const campaigns = await account.getCampaigns(['name', 'status', 'objective']);
        return campaigns;
    } catch (e) {
        console.error("FB fetch campaigns error:", e);
        return [];
    }
}

async function uploadVideoFromUrl(videoUrl, title) {
    await checkConfig();
    try {
        const account = new AdAccount(adAccountId);
        
        // Using form data to post the video URL directly to FB
        const response = await axios.post(`https://graph.facebook.com/v20.0/${adAccountId}/advideos`, null, {
            params: {
                access_token: accessToken,
                file_url: videoUrl,
                title: title
            }
        });

        return response.data; // contains id (video_id)
    } catch (error) {
        console.error("Video upload error:", error.response?.data || error.message);
        throw error;
    }
}

async function createAd(campaignId, videoId, headline, message) {
    await checkConfig();
    
    // First, create an AdSet if needed, but assuming for the UI we already have one
    // We will hardcode or require the user to provide adset_id. 
    // In a real system, you'd fetch or create an AdSet.
    // For now, let's just create the Creative:

    const creative = new AdCreative(null, {
        account_id: adAccountId,
        name: `HeyGen Generated Ad: ${headline}`,
        object_story_spec: {
            page_id: pageId,
            video_data: {
                video_id: videoId,
                message: message,
                title: headline,
                call_to_action: {
                    type: 'SHOP_NOW',
                    value: {
                        link: 'https://aura.soomar.com' // Mock link for Aura app
                    }
                }
            }
        }
    });

    try {
        const createdCreative = await creative.create();
        return createdCreative;
        // The final step would be creating the Ad inside an AdSet:
        /*
        const ad = new Ad(null, {
            account_id: adAccountId,
            name: `Shiine Avatar Ad for ${headline}`,
            adset_id: '<AdSet_ID>',
            creative: { creative_id: createdCreative.id },
            status: 'PAUSED'
        });
        return await ad.create();
        */
    } catch (e) {
        console.error("Creative error:", e);
        throw e;
    }
}

async function getAdvancedAnalytics() {
    await checkConfig();
    try {
        const account = new AdAccount(adAccountId);
        const insights = await account.getInsights(
            ['campaign_name', 'adset_name', 'ad_name', 'impressions', 'clicks', 'spend', 'cpc', 'cpm', 'ctr', 'reach'],
            { 
                level: 'ad', 
                date_preset: 'last_30d',
                filtering: [{ field: 'impressions', operator: 'GREATER_THAN', value: 0 }]
            }
        );
        return insights;
    } catch (error) {
        console.error("Insights Error:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    listCampaigns,
    uploadVideoFromUrl,
    createAd,
    getAdvancedAnalytics
};
