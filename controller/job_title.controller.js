import { job_title } from '../model/job_title.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import logger from '../logger/logger.js';
import * as cache from '../services/cache/cache.service.js';

const createJobTitle = async(req, res) => {

    const{ titleName, created_by } = req.body;

    try {
        logger.info(`Creating job title: ${titleName}`);
     
        const checkJobExisted = await job_title.findOne({
            where: { name: titleName }
        })

        if(checkJobExisted){
          logger.warn(`Job title already exists: ${titleName}`);
          return res.status(500).json(new ApiResponse(500,{},'Job title already existed'))
        }

       const title =  await job_title.create({
            name: titleName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        // Invalidate cache after creation
        await cache.del("master:job_titles:all");

        logger.info(`Job title created successfully: ${titleName} (ID: ${title.id})`);
        return res.status(200).json(new ApiResponse(200,title,'Job title added successfully'))
    } catch (error) {
        logger.error(`Error creating job title: ${error?.message}`);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getJobTitle = async(req, res) => {
    try {
        logger.info('Fetching all job titles');
        
        // Check cache first
        const cacheKey = "master:job_titles:all";
        const cachedData = await cache.get(cacheKey);
        
        if (cachedData) {
          logger.info("Returning cached job titles");
          return res.status(200).json(cachedData);
        }

        const jobTitles = await job_title.findAll();

        logger.info(`Retrieved ${jobTitles.length} job titles`);
        
        const response = new ApiResponse(200, jobTitles, "Job Title Fetched Successfully");
        
        // Cache for 24 hours (master data is static)
        await cache.set(cacheKey, response, 86400);
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error fetching job titles: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}


const updateJobTitle =  async(req, res) => {

    const {id} = req.query;
    const { titleName } = req.body;

    try {
    logger.info(`Updating job title ID: ${id} to name: ${titleName}`);
    const title = await job_title.findByPk(id);
    if (!title) {
      logger.warn(`Job title not found for update - ID: ${id}`);
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Job title not found"));
    }

    const duplicateTitle = await job_title.findOne({
      where: {
        name: titleName,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateTitle) {
      logger.warn(`Duplicate job title name attempted: ${titleName}`);
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Job title name already exists"));
    }

    title.name = titleName;
    title.updated_by = req.user?.id || null;
    title.updated_on = new Date() ;
    await title.save();

    // Invalidate cache after update
    await cache.del("master:job_titles:all");

    logger.info(`Job title updated successfully - ID: ${id}`);
    return res
      .status(200)
      .json(new ApiResponse(200, title, "Job title updated successfully"));

    } catch (error) {
    logger.error(`Error updating job title ID ${id}: ${error.message}`);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating job titles"));
    }
}

const deleteJobTitle = async(req, res) => {
    const { id } = req.query;

    try {
        logger.info(`Deleting job title ID: ${id}`);
        const title = await job_title.findByPk(id);

        if(!title){
            logger.warn(`Job title not found for deletion - ID: ${id}`);
            return res.status(400).json({
                message: "job title not found"
            })
        }

        title.deleted_by = req.user?.id || null;
        title.deleted_on = new Date();
        title.is_deleted = "Y";

     const deleteTitle = await title.save();
     
     // Invalidate cache after deletion
     await cache.del("master:job_titles:all");

     logger.info(`Job title deleted successfully - ID: ${id}`);
     return res.status(200).json({
        message: "job title deleted successfully",
        deleteTitle
     }) 

    } catch (error) {
        logger.error(`Error deleting job title ID ${id}: ${error.message}`);
        return res.status(500).json({
            error,
            message: "Error while deleting job title"
        })
    }
}

export { getJobTitle, createJobTitle, updateJobTitle, deleteJobTitle }