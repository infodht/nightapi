import { countryCode } from "../model/country_code.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger/logger.js";
import * as cache from "../services/cache/cache.service.js";

const getAllCountryCode = async(req, res) => {
    try {
        logger.info('Fetching all country codes');
        
        // Check cache first
        const cacheKey = "master:country_codes:all";
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
          logger.info("Returning cached country codes");
          return res.status(200).json(cachedData);
        }

        const countryCodes = await countryCode.findAll();

        logger.info(`Retrieved ${countryCodes.length} country codes`);
        
        const response = new ApiResponse(200, countryCodes, "Country Code Fetched Successfully");
        
        // Cache for 24 hours (master data is static)
        await cache.set(cacheKey, response, 86400);
        
        return res.status(200).json(response);

    } catch (error) {
        logger.error(`Error fetching country codes: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

export {
    getAllCountryCode
}