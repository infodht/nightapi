import axios from "axios";
import logger from "../logger/logger.js";

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
        logger.info("RefNow - Fetching reference requests");
        const response = await api.get(`get/requests`);
        logger.info(`RefNow - Reference requests fetched - Count: ${response?.data?.length || 0}`);
        return response.data;
    } catch (err) {
        logger.error(`RefNow Error (GetRequests): ${err.message}`);
        throw err;
    }
};

const getReferenceRequestById = async (id) => {
    try {
        logger.info(`RefNow - Fetch reference request - ID: ${id}`);
        const response = await api.get(`get/request?id=${id}`);
        logger.info(`RefNow - Reference request fetched - ID: ${id}`);
        return response.data;
    } catch (err) {
        logger.error(`RefNow Error (GetRequest): ${err.message}`);
        throw err;
    }
};

const getQuestionProfiles = async () => {
    try {
        logger.info("RefNow - Fetching question profiles");

        const response = await api.get(`get/questionprofiles`);

        logger.info(`RefNow - Question profiles fetched - Count: ${response?.data?.length || 0}`);

        return response.data;
    } catch (err) {
        logger.error(`RefNow Error (GetQuestionProfiles): ${err.message}`);
        throw err;
    }
};

const postNewReferenceRequest = async (requestData) => {
    try {
        logger.info(`RefNow - Creating reference request - Candidate ID: ${requestData?.candidateId || 'N/A'}`);

        const response = await api.post(`post/new/request`, requestData);

        logger.info(`RefNow - Reference request created - RID: ${response?.data?.[0]?.rid || 'unknown'}`);

        return response.data;
    } catch (err) {
        logger.error(`RefNow Error (PostNewRequest): ${err.message}`);
        throw err;
    }
};
 
const getRefNowCreditBalance = async () => {
    try {
        logger.info("RefNow - Fetching credit balance");
        const response = await api.get(`get/balance`);

        logger.info(`RefNow - Credit balance fetched - Balance: ${response?.data?.[0]?.totalcreditbal || 0}`);

        return response.data;

    } catch (error) {
        logger.error(`RefNow Error (Balance): ${error.message}`);
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