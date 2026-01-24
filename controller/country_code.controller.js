import { countryCode } from "../model/country_code.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger/logger.js";

const getAllCountryCode = async(req, res) => {
    try {
        logger.info('Fetching all country codes');
        const countryCodes = await countryCode.findAll();

        logger.info(`Retrieved ${countryCodes.length} country codes`);
        return res.status(200).json(new ApiResponse(200, countryCodes, "Country Code Fetched Successfully"));

    } catch (error) {
        logger.error(`Error fetching country codes: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

export {
    getAllCountryCode
}