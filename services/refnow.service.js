import axios from "axios";

const REFNOW_API_URL = "https://api.refnow.co/v1/public/";
const REFNOW_API_KEY = "dCqNL0EUzEezXE9XbdvG6XMJA6n9T3HhuKlLi9Df3TwoCWPm6ltYNP4jQ2CZ2HRIpx5d1UK9XbUYo6dbNl81JNMPwBQjBJs90OIJVnn7V22899";

const api = axios.create({
    baseURL: REFNOW_API_URL,
    headers: {
        "Content-Type": "application/json",
        "Authorization": `token ${REFNOW_API_KEY}`,
    },
});

const listReferenceRequests = async () => {
    try {
        const response = await api.get(`get/requests`);
        return response.data;
    } catch (err) {
        console.error("RefNow Error (GetRequests):", err);
        throw err;
    }
};

const getReferenceRequestById = async (id) => {
    try {
        const response = await api.get(`get/request?id=${id}`);
        return response.data;
    } catch (err) {
        console.error("RefNow Error (GetRequest):", err);
        throw err;
    }
};

const getQuestionProfiles = async () => {
    try {
        console.log("RefNow: Fetching Question Profiles...");

        const response = await api.get(`get/questionprofiles`);

        console.log("RefNow: Question Profiles fetched:", response);

        return response.data;
    } catch (err) {
        console.error("RefNow Error (GetQuestionProfiles):", err);
        throw err;
    }
};

const postNewReferenceRequest = async (requestData) => {
    try {
        console.log("RefNow: Creating new reference request with data:", requestData);

        const response = await api.post(`post/new/request`, requestData);

        console.log("RefNow: New reference request created:", response);

        return response.data;
    } catch (err) {
        console.error("RefNow Error (PostNewRequest):", err);
        throw err;
    }
};
 
const getRefNowCreditBalance = async () => {
    try {
        console.log("RefNow: Fetching Credit Balance...");
        const response = await api.get(`get/balance`);

        console.log("RefNow: Credit Balance fetched:", response);

        return response.data;

    } catch (error) {
        console.error("RefNow Error (Balance):", error);
        throw error;
    }
}

export {
    listReferenceRequests,
    getReferenceRequestById,
    getQuestionProfiles,
    postNewReferenceRequest,
    getRefNowCreditBalance
};