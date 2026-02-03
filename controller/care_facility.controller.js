import { careFacility } from '../model/care_facility.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import logger from '../logger/logger.js';
import * as cache from '../services/cache/cache.service.js';

const createCareFacility = async(req, res) => {

    const{ careFacilityName, created_by } = req.body;
    try {
        logger.info(`Creating care facility: ${careFacilityName}`);
     
        const checkCareExisted = await careFacility.findOne({
            where: { facility_name: careFacilityName }
        })

        if(checkCareExisted){
          logger.warn(`Care facility already exists: ${careFacilityName}`);
          return res.status(500).json(new ApiResponse(500,{},'Care Facility already existed'))
        }

       const care =  await careFacility.create({
            facility_name: careFacilityName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        // Invalidate cache after creation
        await cache.del("master:care_facilities:all");

        logger.info(`Care facility created successfully: ${careFacilityName} (ID: ${care.id})`);
        return res.status(200).json(new ApiResponse(200,care,'Care Facility Needs added successfully'))
    } catch (error) {
        logger.error(`Error creating care facility: ${error?.message}`);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getAllCareFacility = async(req, res) => {
    try {
        logger.info('Fetching all care facilities');
        
        // Check cache first
        const cacheKey = "master:care_facilities:all";
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
          logger.info("Returning cached care facilities");
          return res.status(200).json(cachedData);
        }

        const careFacilities = await careFacility.findAll();

        logger.info(`Retrieved ${careFacilities.length} care facilities`);
        
        const response = new ApiResponse(200, careFacilities, "Care Facility Fetched Successfully");
        
        // Cache for 24 hours (master data is static)
        await cache.set(cacheKey, response, 86400);
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error fetching care facilities: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

const updateFacilityName =  async(req, res) => {

    const {id} = req.query;
    const { careFacilityName } = req.body;

    try {
    logger.info(`Updating care facility ID: ${id} to name: ${careFacilityName}`);
    const clientCareFacility = await careFacility.findByPk(id);
    if (!clientCareFacility) {
      logger.warn(`Care facility not found for update - ID: ${id}`);
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Facility not found"));
    }

    const duplicateFacility = await careFacility.findOne({
      where: {
        facility_name: careFacilityName,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateFacility) {
      logger.warn(`Duplicate care facility name attempted: ${careFacilityName}`);
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Facility name already exists"));
    }

    clientCareFacility.facility_name = careFacilityName;
    clientCareFacility.updated_by = req.user?.id || null;
    clientCareFacility.updated_on = new Date();
    await clientCareFacility.save();

    // Invalidate cache after update
    await cache.del("master:care_facilities:all");

    logger.info(`Care facility updated successfully - ID: ${id}`);
    return res
      .status(200)
      .json(new ApiResponse(200, clientCareFacility, "Care Facility updated successfully"));

    } catch (error) {
    logger.error(`Error updating care facility ID ${id}: ${error.message}`);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating care facility"));
    }
}

const deleteCareFacility = async(req, res) => {
    const { id } = req.query;

    try {
        logger.info(`Deleting care facility ID: ${id}`);
        const clientCareFacility = await careFacility.findByPk(id);

        if(!clientCareFacility){
            logger.warn(`Care facility not found for deletion - ID: ${id}`);
            return res.status(400).json({
                message: "Facility not found"
            })
        }
     clientCareFacility.deleted_by = req.user?.id || null;
     clientCareFacility.deleted_on = new Date();
     clientCareFacility.is_deleted = "Y";

     const deleteFacility = await clientCareFacility.save();
     
     // Invalidate cache after deletion
     await cache.del("master:care_facilities:all");

     logger.info(`Care facility deleted successfully - ID: ${id}`);
     return res.status(200).json({
        message: "Facility deleted successfully",
        deleteFacility
     }) 

    } catch (error) {
        logger.error(`Error deleting care facility ID ${id}: ${error.message}`);
        return res.status(500).json({
            error,
            message: "Error while deleting care facility"
        })
    }
}

export { getAllCareFacility, createCareFacility, updateFacilityName, deleteCareFacility }