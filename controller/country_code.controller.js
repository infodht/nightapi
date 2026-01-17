import { countryCode } from "../model/country_code.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllCountryCode = async(req, res) => {
    try {
        const countryCodes = await countryCode.findAll();

        return res.status(200).json(new ApiResponse(200, countryCodes, "Country Code Fetched Successfully"));

    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

export {
    getAllCountryCode
}